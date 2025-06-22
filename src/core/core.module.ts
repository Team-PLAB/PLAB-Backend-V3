import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigurationModule } from '../configuration/configuration.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_SCHEMA'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'], // 엔티티 경로 조정
        synchronize: config.get<boolean>('TYPEORM_SYBCHRONIZE')
      })
    }),
    ConfigurationModule,
  ],
  exports: [TypeOrmModule] // TypeORM을 다른 모듈에서 사용할 수 있도록 내보냄
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
