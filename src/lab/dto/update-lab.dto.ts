import { ApiProperty, PartialType } from '@nestjs/swagger'
import { CreateLabDto } from './create-lab.dto'
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator'

export class UpdateLabDto extends PartialType(CreateLabDto) {
  @ApiProperty({
    description: '승인여부',
    default: 'false'
  })
  @IsOptional()
  @IsBoolean()
  public readonly approvalRental: boolean

  @ApiProperty({
    description: '빌릴 랩실 이름',
    default: '3층 임베디드 실습실'
  })
  @IsString()
  @IsOptional()
  public readonly labName: string

  @ApiProperty({
    description: '수정 시간',
    default: () => new Date().toISOString()
  })
  @IsDate()
  public readonly updatedAt: Date = new Date() // 기본값으로 현재 시간 설정
}
