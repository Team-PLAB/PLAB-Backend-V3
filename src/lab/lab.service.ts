import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Lab } from './entities/lab.entity'
import { CreateLabDto } from './dto/create-lab.dto'
import { UpdateLabDto } from './dto/update-lab.dto'
import { Cron, CronExpression } from '@nestjs/schedule'
import { User } from 'src/user/entities/user.entity'
import { ApiResponseUtil } from 'src/common/api-response.util'
import { LabFactory } from './factory/lab.factory'
import { LabResponseDto } from './dto/lab-response.dto'

@Injectable()
export class LabService {
  private readonly logger = new Logger(LabService.name)

  constructor(
    @InjectRepository(Lab)
    private readonly labRepository: Repository<Lab>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly labFactory: LabFactory
  ) {}

  async createLab(dto: CreateLabDto, userId: number): Promise<LabResponseDto> {
    // 유저의 실습실 대여 여부 체크
    const user = await this.userRepository.findOneBy({ id: userId })
    if (!user) {
      throw ApiResponseUtil.error('사용자를 찾을 수 없습니다.', 404, {
        code: 'USER_NOT_FOUND',
        details: '해당 ID의 사용자가 없습니다.'
      })
    }
    if (user.hasLabRental) {
      throw ApiResponseUtil.error('이미 실습실을 대여했습니다.', 400, {
        code: 'DUPLICATE_RENTAL',
        details: '오늘 이미 대여한 기록이 있습니다.'
      })
    }

    // 중복 실습실 체크
    const conflictingLab = await this.labRepository.findOne({
      where: {
        rentalDate: dto.rentalDate,
        rentalStartTime: dto.rentalStartTime,
        labName: dto.labName,
        deletionRental: false
      }
    })
    if (conflictingLab) {
      throw ApiResponseUtil.error('이미 예약된 실습실입니다.', 400, {
        code: 'LAB_CONFLICT',
        details: '선택한 날짜와 시간에 이미 예약이 있습니다.'
      })
    }

    const lab = this.labFactory.createLab(dto, userId)
    const savedLab = await this.labRepository.save(lab)

    // 대여 후 유저 상태 업데이트
    await this.userRepository.update(userId, { hasLabRental: true })
    this.logger.log(`Lab rental created for user ${userId}, ID: ${savedLab.id}`)

    return LabResponseDto.fromEntity(savedLab)
  }

  // 모든 대여 요청 조회
  async findAll(): Promise<LabResponseDto[]> {
    const labs = await this.labRepository.find()
    return labs.map((lab) => LabResponseDto.fromEntity(lab))
  }

  // 승인 요청중인 대여 요청 조회
  async findApprovalRental(): Promise<LabResponseDto[]> {
    const labs = await this.labRepository.find({
      where: {
        approvalRental: false,
        deletionRental: false
      }
    })
    return labs.map((lab) => LabResponseDto.fromEntity(lab))
  }

  // 승인한 대여 요청 조회
  async findApproval(): Promise<LabResponseDto[]> {
    const labs = await this.labRepository.find({
      where: {
        approvalRental: true,
        deletionRental: false
      }
    })
    return labs.map((lab) => LabResponseDto.fromEntity(lab))
  }

  // 삭제되지 않은 대여 요청 조회
  async findDeletionRental(): Promise<LabResponseDto[]> {
    const labs = await this.labRepository.find({
      where: {
        deletionRental: false
      }
    })
    return labs.map((lab) => LabResponseDto.fromEntity(lab))
  }

  // 유저별 대여 요청 조회 (삭제 포함)
  async findAllUserLab(userId: number): Promise<LabResponseDto[]> {
    const labs = await this.labRepository.find({
      where: {
        userId
      }
    })
    return labs.map((lab) => LabResponseDto.fromEntity(lab))
  }

  // 대여 요청 하나만 조회 (삭제 포함)
  async findOneLab(id: number): Promise<Lab> {
    const lab = await this.labRepository.findOneBy({ id })
    if (!lab) {
      throw ApiResponseUtil.error('랩실 대여 요청을 찾을 수 없습니다.', 404, {
        code: 'LAB_NOT_FOUND',
        details: '해당 ID의 랩실 대여 요청이 없습니다.'
      })
    }
    return lab
  }

  async update(id: number, dto: UpdateLabDto): Promise<LabResponseDto> {
    const lab = await this.findOneLab(id)
    await lab.updateLab(dto)
    await this.labRepository.save(lab)
    return LabResponseDto.fromEntity(lab)
  }

  @Cron(CronExpression.EVERY_12_HOURS) // 12시간마다 실행
  async cleanAllRentals(): Promise<void> {
    const now = new Date()
    const labs = await this.labRepository.find({
      relations: ['user'] // user 관계 로드
    })
    for (const lab of labs) {
      await this.labRepository.update(lab.id, {
        deletionRental: true,
        deletedAt: now
      })
      // 유저 상태 초기화
      if (lab.user) {
        await this.userRepository.update(lab.userId, { hasLabRental: false })
        this.logger.log(`Reset hasLabRental to false for user ${lab.userId}, ID: ${lab.id}`)
      }
      this.logger.log(`Deleted rental for user ${lab.userId}, ID: ${lab.id} at ${now}`)
    }
  }
}
