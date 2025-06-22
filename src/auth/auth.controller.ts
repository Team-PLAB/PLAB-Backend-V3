import { Controller, Post, Body, UseGuards, Req, Res, Get, Logger, Query } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from './guard/auth.guard'
import { UserService } from 'src/user/user.service'
import { Request, Response } from 'express'
import { AuthRequest } from 'src/auth/interface/auth'
import { ApiResponseUtil } from 'src/common/api-response.util'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @ApiOperation({ summary: '로그인' })
  @Post('login')
  async loginUser(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Query('mobile') isMobile: boolean = false // 쿼리 파라미터로 모바일 여부 전달
  ): Promise<ApiResponseUtil> {
    const result = await this.authService.loginWithUsername(dto, res, isMobile)
    this.logger.log(`User ${dto.login} logged in successfully`)

    return ApiResponseUtil.success(
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      '로그인 성공'
    )
  }

  @ApiOperation({ summary: '토큰 재발급' })
  @ApiBearerAuth()
  @Post('token/refresh')
  async refreshToken(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponseUtil> {
    const refreshToken = req.cookies.refresh_token || req.headers.authorization?.split(' ')[1]

    if (!refreshToken) {
      throw ApiResponseUtil.error('리프레시 토큰이 필요합니다.', 401, {
        code: 'UNAUTHORIZED',
        details: '쿠키 또는 헤더에 리프레시 토큰이 없습니다.'
      })
    }

    const result = await this.authService.rotateToken(refreshToken, res, req)
    this.logger.log(`Token refreshed for user ID ${req.user.id}`)

    return ApiResponseUtil.success(
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      '토큰 재발급 성공'
    )
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponseUtil> {
    const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1]
    if (!token) {
      throw ApiResponseUtil.error('토큰이 필요합니다.', 401, {
        code: 'UNAUTHORIZED',
        details: '로그아웃하려면 유효한 토큰이 필요합니다.'
      })
    }

    this.logger.debug(`Logout attempt with token: ${token}`)
    await this.authService.logout(token, res, req)
    this.logger.log(`User ${req.user.id} logged out successfully`)
    return ApiResponseUtil.success({}, '로그아웃 성공')
  }

  @ApiOperation({ summary: '유저 확인' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  async findMyProfile(@Req() req: AuthRequest): Promise<ApiResponseUtil> {
    const user = await this.userService.getOneUser(req.user.id)
    console.log('req.user:', req.user)

    return ApiResponseUtil.success({ user }, '유저 정보를 성공적으로 조회했습니다.')
  }

  @ApiOperation({ summary: '토큰 블랙리스트 및 리프레시 토큰 상태 확인' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('token-status')
  async checkTokenStatus(
    @Req() req: AuthRequest,
    @Body('jti') jti: string // 클라이언트가 jti를 요청 본문으로 전달
  ): Promise<ApiResponseUtil> {
    if (!jti) {
      throw ApiResponseUtil.error('jti가 필요합니다.', 400, {
        code: 'INVALID_REQUEST',
        details: '토큰 상태를 확인하려면 jti를 제공해야 합니다.'
      })
    }

    const isBlacklisted = await this.authService.isTokenBlacklisted(jti)
    const isRefreshValid = await this.authService.isRefreshTokenValid(jti, req.user.id)

    return ApiResponseUtil.success(
      {
        jti,
        isBlacklisted,
        isRefreshValid,
        userId: req.user.id
      },
      '토큰 상태 확인 성공'
    )
  }
}
