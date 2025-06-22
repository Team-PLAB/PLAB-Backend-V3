import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { LabModule } from './lab/lab.module'
import { AuthModule } from './auth/auth.module'
import { CoreModule } from './core/core.module'

@Module({
  imports: [CoreModule, UserModule, LabModule, AuthModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // AppModule에서 추가적인 전역 설정이 필요하면 여기에 추가
  }
}
