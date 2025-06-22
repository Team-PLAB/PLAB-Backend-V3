import {
  Module,
  DynamicModule,
  forwardRef,
  MiddlewareConsumer,
  NestModule,
  RequestMethod
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UserModule } from 'src/user/user.module'
import { RedisModule } from 'src/configuration/redis/redis.module'
import { ConfigurationModule } from 'src/configuration/configuration.module'
import { AuthMiddleware } from '../core/middleware/auth.middleware'
import { CookieAuthStrategy } from './strategy/cookie.auth.strategy'
import { HeaderAuthStrategy } from './strategy/header.auth.strategy'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from 'src/user/entities/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 도메인 내 엔티티만 관리
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'JWT')
      })
    }),
    RedisModule,
    forwardRef(() => UserModule) // 순환 의존성 해결
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthMiddleware, CookieAuthStrategy, HeaderAuthStrategy],
  exports: [AuthService, AuthMiddleware, CookieAuthStrategy, HeaderAuthStrategy]
})
export class AuthModule implements NestModule {
  static forMobile(): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: 'IAuthStrategy',
          useClass: HeaderAuthStrategy // 모바일용 헤더 기반
        }
      ]
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/token/refresh', method: RequestMethod.POST }
      )
      .forRoutes('*') // 인증 제외 경로 명시// AuthModule 내에서 추가적인 미들웨어 설정이 필요하면 여기에
  }
}
