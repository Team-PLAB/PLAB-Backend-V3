import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ApiResponseUtil } from 'src/common/api-response.util'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    if (!request.user || !request.user.id) {
      throw ApiResponseUtil.error(`인증되지 않은 사용자입니다.`, 401, {
        code: 'UNAUTHORIZED',
        details: '사용자 인증 정보가 없습니다.'
      })
    }
    if (request.user.type === 'refresh' && request.originalUrl !== '/auth/token/refresh') {
      throw ApiResponseUtil.error(`리프레시 토큰은 재발급 엔드포인트에서만 사용 가능합니다.`, 403, {
        code: 'FORBIDDEN',
        details: '잘못된 토큰 유형입니다.'
      })
    }
    return true
  }
}
