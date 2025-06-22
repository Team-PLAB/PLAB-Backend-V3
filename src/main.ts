import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as expressBasicAuth from 'express-basic-auth'
import * as cookieParser from 'cookie-parser'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor'
import { ErrorResponseInterceptor } from './common/interceptors/error-response.interceptor'
import { AuthMiddleware } from './core/middleware/auth.middleware'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)

  // CORS 설정 (프로덕션에서는 특정 origin으로 제한 권장)
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  })

  // 글로벌 파이프 (DTO 유효성 검사)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 데이터 변환 활성화
      whitelist: true,
      errorHttpStatusCode: 400
    })
  )

  // 미들웨어 적용
  app.use(cookieParser())

  // 글로벌 인터셉터
  app.useGlobalInterceptors(new SuccessResponseInterceptor(), new ErrorResponseInterceptor())

  // Swagger 기본 인증 설정
  app.use(
    ['/api', '/api-json'], // 오타 수정: /api-jsom -> /api-json
    expressBasicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER]: process.env.SWAGGER_PW
      }
    })
  )

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('GBSW_랩실대여 Api문서')
    .setDescription('이걸 내가하네?')
    .setVersion('2.0')
    .addBearerAuth() // Bearer 토큰 인증 추가
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  // 서버 시작
  await app.listen(3030)
  logger.log(`Application is running on: http://localhost:3030`)
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap')
  logger.error('Application failed to start', error.stack)
  process.exit(1)
})
