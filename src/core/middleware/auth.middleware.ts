import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt'
import { AuthService } from '../../auth/auth.service'
import { CookieAuthStrategy } from '../../auth/strategy/cookie.auth.strategy'
import { HeaderAuthStrategy } from '../../auth/strategy/header.auth.strategy'
import { AuthRequest } from 'src/auth/interface/auth'
import { ApiResponseUtil } from 'src/common/api-response.util'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name)

  constructor(
    private readonly authService: AuthService,
    private readonly cookieStrategy: CookieAuthStrategy,
    private readonly headerStrategy: HeaderAuthStrategy
  ) {
    this.logger.debug('AuthMiddleware initialized with strategies:', {
      cookieStrategy: this.cookieStrategy.constructor.name,
      headerStrategy: this.headerStrategy.constructor.name
    })
  }

  async use(req: Request | AuthRequest, res: Response, next: NextFunction): Promise<void> {
    let token: string | null = null

    // 1. 쿠키에서 토큰 시도 (웹 브라우저용)
    token = this.cookieStrategy.getToken(req)
    this.logger.debug(`Cookie token attempt for ${req.url}: ${token || 'none'}`)

    // 2. 쿠키가 없으면 헤더에서 토큰 시도 (앱용)
    if (!token) {
      token = this.headerStrategy.getToken(req)
      this.logger.debug(`Header token attempt for ${req.url}: ${token || 'none'}`)
    }

    if (!token) {
      this.logger.debug(`No token found for ${req.url}, skipping authentication`)
      return next()
    }

    try {
      const decoded = await this.authService.verifyToken(token)
      req.user = decoded
      this.logger.debug(`User authenticated for ${req.url}: ${JSON.stringify(req.user)}`)
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw ApiResponseUtil.error('토큰이 만료되었습니다.', 401, {
          code: 'TOKEN_EXPIRED',
          details: '토큰이 만료되어 재로그인이 필요합니다.'
        })
      }
      if (e instanceof JsonWebTokenError) {
        this.logger.error(
          `JsonWebTokenError for ${req.url}: ${e.message}, Token: ${token.substring(0, 10)}...`
        )
        throw ApiResponseUtil.error('유효하지 않은 토큰입니다.', 401, {
          code: 'INVALID_TOKEN',
          details: '토큰이 유효하지 않습니다.'
        })
      }
      this.logger.error(`Token verification failed for ${req.url}: ${e.message}`)
      throw ApiResponseUtil.error(e.message, 500, {
        code: 'AUTH_ERROR',
        details: e.message
      })
    }
    next()
  }
}
