import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ApiResponseUtil } from 'src/common/api-response.util'
import { ROLES_KEY } from 'src/common/decorator/roles.decorator'
import { RolesEnum } from 'src/common/enum/roles.enum'


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolesEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!requiredRoles) return true

    const request = context.switchToHttp().getRequest()
    if (!request.user || !request.user.role) {
      throw ApiResponseUtil.error('사용자 정보가 없습니다.', 403, {
        code: 'FORBIDDEN',
        details: '인증된 사용자 정보가 필요합니다.'
      })
    }
    const hasRole = requiredRoles.some((role) => request.user.role === role)
    if (!hasRole) {
      throw ApiResponseUtil.error('권한이 없습니다..', 403, {
        code: 'FORBIDDEN',
        details: '필요한 역할이 없습니다.'
      })
    }
    return true
  }
}
