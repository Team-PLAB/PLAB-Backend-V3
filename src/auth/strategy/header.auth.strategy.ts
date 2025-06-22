import { Request, Response } from 'express'
import { IAuthStrategy } from 'src/auth/interface/auth'

export class HeaderAuthStrategy implements IAuthStrategy {
  getToken(req: Request): string | null {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1]
    }
    return null
  }

  setToken(res: Response, accessToken: string, refreshToken: string): void {
    // 헤더 기반은 토큰을 직접 설정하지 않음 (클라이언트가 관리)
    // 필요 시 응답 헤더에 포함 가능 (예: res.setHeader('Authorization', `Bearer ${accessToken}`))
  }

  clearToken(res: Response): void {
    // 헤더 기반은 토큰을 직접 클리어하지 않음 (클라이언트가 담당)
  }
}
