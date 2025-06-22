import { Request, Response } from 'express'
import { RolesEnum } from 'src/common/enum/roles.enum'

export interface AuthRequest extends Request {
  user?: {
    id: number
    type: 'access' | 'refresh'
    jti: string
    role: RolesEnum
  }
}

export interface IAuthStrategy {
  getToken(req: Request): string | null
  setToken(res: Response, accessToken: string, refreshToken: string): void
  clearToken(res: Response): void
}

export interface TokenResult {
  accessToken: string
  refreshToken: string
}
