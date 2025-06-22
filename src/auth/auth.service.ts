import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from 'src/user/user.service'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcryptjs'
import { RedisService } from 'src/configuration/redis/redis.service'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response } from 'express'
import { CookieAuthStrategy } from 'src/auth/strategy/cookie.auth.strategy'
import { HeaderAuthStrategy } from 'src/auth/strategy/header.auth.strategy'
import { RolesEnum } from 'src/common/enum/roles.enum'
import { ApiResponseUtil } from 'src/common/api-response.util'

interface TokenPayload {
  id: number
  type: 'access' | 'refresh'
  jti: string
  role: RolesEnum
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:'
  private readonly REFRESH_TOKEN_PREFIX = 'refresh:'
  private readonly REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // 30일

  constructor(
    private readonly jwt: JwtService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly cookieStrategy: CookieAuthStrategy,
    private readonly headerStrategy: HeaderAuthStrategy
  ) {}

  async signToken(userId: number, type: 'access' | 'refresh', role: RolesEnum): Promise<string> {
    const jti = uuidv4()
    const payload = { id: userId, type, jti, role }
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: type === 'refresh' ? '30d' : '10m'
    })
  }

  async loginWithUsername(
    dto: LoginDto,
    res: Response,
    isMobile: boolean = false // 쿼리 파라미터로 모바일 여부 전달
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.checkUser(dto)
    const accessToken = await this.signToken(user.id, 'access', user.role)
    const refreshToken = await this.signToken(user.id, 'refresh', user.role)
    const accessDecoded = this.jwt.decode(accessToken) as TokenPayload
    const refreshDecoded = this.jwt.decode(refreshToken) as TokenPayload

    await this.redisService.set(
      `${this.REFRESH_TOKEN_PREFIX}${refreshDecoded.jti}`,
      String(user.id),
      this.REFRESH_TOKEN_TTL
    )
    this.logger.log(
      `Login - Access Token jti: ${accessDecoded.jti}, Refresh Token jti: ${refreshDecoded.jti}, userId: ${user.id}`
    )

    // 플랫폼에 따라 전략 선택
    const strategy = isMobile ? this.headerStrategy : this.cookieStrategy
    strategy.setToken(res, accessToken, refreshToken)
    return { accessToken, refreshToken }
  }

  private async checkUser(dto: LoginDto): Promise<{ id: number; role: RolesEnum }> {
    const user = await this.userService.findUserByLogin(dto.login, true)
    if (!user) {
      throw ApiResponseUtil.error('사용자를 찾을 수 없습니다.', 404, {
        code: 'USER_NOT_FOUND',
        details: '입력한 로그인 정보에 해당하는 사용자가 없습니다.'
      })
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password)
    if (!isPasswordValid) {
      throw ApiResponseUtil.error('비밀번호가 일치하지 않습니다.', 401, {
        code: 'INVALID_PASSWORD',
        details: '입력한 비밀번호가 올바르지 않습니다.'
      })
    }
    return { id: user.id, role: user.role }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const decoded = await this.jwt.verifyAsync<TokenPayload>(token, {
      secret: process.env.JWT_SECRET
    })
    const isBlacklisted = await this.redisService.get(
      `${this.TOKEN_BLACKLIST_PREFIX}${decoded.jti}`
    )
    if (isBlacklisted) {
      throw ApiResponseUtil.error('블랙리스트에 등록된 토큰입니다.', 401, {
        code: 'TOKEN_BLACKLISTED',
        details: '이 토큰은 블랙리스트에 등록되어 사용이 불가능합니다.'
      })
    }
    if (decoded.type === 'refresh') {
      const storedUserId = await this.redisService.get<string>(
        `${this.REFRESH_TOKEN_PREFIX}${decoded.jti}`
      )
      if (!storedUserId || Number(storedUserId) !== decoded.id) {
        throw ApiResponseUtil.error('유효하지 않은 리프레시 토큰입니다.', 401, {
          code: 'INVALID_REFRESH_TOKEN',
          details: '리프레시 토큰이 유효하지 않거나 만료되었습니다.'
        })
      }
    }
    return decoded
  }

  async rotateToken(
    refreshToken: string,
    res: Response,
    req: Request
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = await this.verifyToken(refreshToken)
    if (decoded.type !== 'refresh') {
      throw ApiResponseUtil.error('리프레시 토큰이 필요합니다.', 403, {
        code: 'FORBIDDEN',
        details: '이 엔드포인트는 리프레시 토큰으로만 접근할 수 있습니다.'
      })
    }
    await this.blacklistToken(decoded.jti, decoded.id)

    const newAccessToken = await this.signToken(decoded.id, 'access', decoded.role)
    const newRefreshToken = await this.signToken(decoded.id, 'refresh', decoded.role)
    const newAccessDecoded = this.jwt.decode(newAccessToken) as TokenPayload
    const newRefreshDecoded = this.jwt.decode(newRefreshToken) as TokenPayload

    await this.redisService.set(
      `${this.REFRESH_TOKEN_PREFIX}${newRefreshDecoded.jti}`,
      String(decoded.id),
      this.REFRESH_TOKEN_TTL
    )
    this.logger.log(
      `Token rotated - New Access Token jti: ${newAccessDecoded.jti}, New Refresh Token jti: ${newRefreshDecoded.jti}, userId: ${decoded.id}`
    )

    // 플랫폼에 따라 전략 선택 (refresh 요청 시 헤더 또는 쿠키에서 토큰 추출 여부에 따라 판단)
    const isMobile = !!req.headers.authorization // 헤더에 토큰이 있으면 모바일로 간주
    const strategy = isMobile ? this.headerStrategy : this.cookieStrategy
    strategy.setToken(res, newAccessToken, newRefreshToken)
    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }

  async blacklistToken(jti: string, userId: number): Promise<void> {
    try {
      this.logger.debug(`Attempting to blacklist jti: ${jti}`)
      const setResult = await this.redisService.set(
        `${this.TOKEN_BLACKLIST_PREFIX}${jti}`,
        'true',
        this.REFRESH_TOKEN_TTL
      )
      this.logger.debug(`Set blacklist result: ${setResult}`)

      const refreshExists = await this.redisService.get<string>(
        `${this.REFRESH_TOKEN_PREFIX}${jti}`
      )
      if (refreshExists && Number(refreshExists) === userId) {
        const delResult = await this.redisService.del(`${this.REFRESH_TOKEN_PREFIX}${jti}`)
        this.logger.debug(`Deleted refresh token result: ${delResult}`)
      } else {
        this.logger.debug(
          `No matching refresh token found for jti: ${jti}, userId: ${userId}, skipping deletion`
        )
      }
    } catch (error) {
      this.logger.error(`Failed to blacklist token ${jti}: ${error.message}`)
      throw error
    }
  }

  async logout(token: string, res: Response, req: Request): Promise<void> {
    try {
      this.logger.debug(`Logout initiated with token: ${token}`)
      const decoded = await this.verifyToken(token)
      this.logger.debug(`Decoded jti from token: ${decoded.jti}`)

      await this.blacklistToken(decoded.jti, decoded.id)

      const refreshKeys = await this.redisService.keys(`${this.REFRESH_TOKEN_PREFIX}*`)
      for (const key of refreshKeys) {
        const storedUserId = await this.redisService.get<string>(key)
        if (storedUserId && Number(storedUserId) === decoded.id) {
          const refreshJti = key.replace(this.REFRESH_TOKEN_PREFIX, '')
          await this.blacklistToken(refreshJti, decoded.id)
          await this.redisService.del(key)
          this.logger.debug(`Deleted refresh token for jti: ${refreshJti}`)
        }
      }

      // 플랫폼에 따라 전략 선택
      const isMobile = !!req.headers.authorization // 헤더에 토큰이 있으면 모바일로 간주
      const strategy = isMobile ? this.headerStrategy : this.cookieStrategy
      strategy.clearToken(res)
      this.logger.log(`User ${decoded.id} logged out successfully`)
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`)
      throw error
    }
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const isBlacklisted = await this.redisService.get(`${this.TOKEN_BLACKLIST_PREFIX}${jti}`)
    return !!isBlacklisted
  }

  async isRefreshTokenValid(jti: string, userId: number): Promise<boolean> {
    const storedUserId = await this.redisService.get<string>(`${this.REFRESH_TOKEN_PREFIX}${jti}`)
    return !!storedUserId && Number(storedUserId) === userId
  }
}
