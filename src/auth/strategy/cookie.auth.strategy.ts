import { Request, Response } from 'express'
import { IAuthStrategy } from 'src/auth/interface/auth'

export class CookieAuthStrategy implements IAuthStrategy {
  getToken(req: Request): string | null {
    return req.cookies?.access_token || null
  }

  setToken(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000 // 10분
    })
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
      path: '/auth/token/refresh'
    })
  }

  clearToken(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/token/refresh'
    })
  }
}
