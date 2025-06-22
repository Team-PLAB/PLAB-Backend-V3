import { Module } from '@nestjs/common'
import { LabService } from './lab.service'
import { LabController } from './lab.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Lab } from './entities/lab.entity'
import { UserModule } from 'src/user/user.module'
import { ScheduleModule } from '@nestjs/schedule'
import { User } from 'src/user/entities/user.entity'
import { LabFactory } from './factory/lab.factory'

@Module({
  imports: [
    TypeOrmModule.forFeature([Lab,User]), 
    UserModule, 
    ScheduleModule.forRoot()
  ],
  controllers: [LabController],
  providers: [LabService, LabFactory],
  exports: [LabService]
})
export class LabModule {}
