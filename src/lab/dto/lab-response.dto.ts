import { ApiProperty } from '@nestjs/swagger'
import { Lab } from '../entities/lab.entity'

export class LabResponseDto {
  @ApiProperty({ description: '랩실 대여 ID', example: 1 })
  public id: number

  @ApiProperty({ description: '대여 희망 시간', example: '2024-12-25' })
  public rentalDate: string

  @ApiProperty({ description: '대표자 이름', example: '성홍제' })
  public rentalUser: string

  @ApiProperty({ description: '사용자 인원', example: '성홍제, 유진승' })
  public rentalUsers: string

  @ApiProperty({ description: '사용 목적', example: '캡스톤' })
  public rentalPurpose: string

  @ApiProperty({ description: '대여 시작 시간', example: '야자시간(19:10 ~ 20:30)' })
  public rentalStartTime: string

  @ApiProperty({ description: '삭제 여부', example: false })
  public deletionRental: boolean

  @ApiProperty({ description: '삭제 시간', example: null })
  public deletedAt: Date | null

  @ApiProperty({ description: '승인 여부', example: false })
  public approvalRental: boolean

  @ApiProperty({ description: '랩실 이름', example: '3층 임베디드 실습실' })
  public labName: string

  @ApiProperty({ description: '유저 ID', example: 1 })
  public userId: number

  @ApiProperty({ description: '생성 시간', example: '2024-12-25T00:00:00Z' })
  public createdAt: Date

  @ApiProperty({ description: '수정 시간', example: null })
  public updatedAt: Date | null

  public static fromEntity(lab: Lab): LabResponseDto {
    const dto = new LabResponseDto()
    dto.id = lab.id
    dto.rentalDate = lab.rentalDate.toString()
    dto.rentalUser = lab.rentalUser
    dto.rentalUsers = lab.rentalUsers
    dto.rentalPurpose = lab.rentalPurpose
    dto.rentalStartTime = lab.rentalStartTime
    dto.deletionRental = lab.deletionRental
    dto.deletedAt = lab.deletedAt
    dto.approvalRental = lab.approvalRental
    dto.labName = lab.labName
    dto.userId = lab.userId
    dto.createdAt = lab.createdAt
    dto.updatedAt = lab.updatedAt
    return dto
  }
}
