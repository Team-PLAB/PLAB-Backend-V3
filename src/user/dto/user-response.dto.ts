import { ApiProperty } from '@nestjs/swagger'
import { User } from '../entities/user.entity'

export class UserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  id: number

  @ApiProperty({ description: '사용자 이름(닉네임)', example: '김승환 | silofn523' })
  username: string

  @ApiProperty({ description: '사용자 권한', example: 'user' })
  role: string

  @ApiProperty({ description: '실습실 대여 여부', example: false })
  hasLabRental: boolean

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto()
    dto.id = user.id
    dto.username = user.username
    dto.role = user.role
    dto.hasLabRental = user.hasLabRental
    return dto
  }
}
