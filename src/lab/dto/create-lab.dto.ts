import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateLabDto {
  @ApiProperty({ description: '대여 희망시간', default: '2024-12-25' })
  @IsNotEmpty()
  public readonly rentalDate: string | Date

  @ApiProperty({ description: '대표자 이름', default: '성홍제' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  public readonly rentalUser: string

  @ApiProperty({ description: '사용자 인원', default: '성홍제, 유진승' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @IsNotEmpty()
  public readonly rentalUsers: string

  @ApiProperty({ description: '사용 목적', default: '캡스톤' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsNotEmpty()
  public readonly rentalPurpose: string

  @ApiProperty({ description: '대여 시작 시간', default: '야자시간(19:10 ~ 20:30)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  public readonly rentalStartTime: string

  @ApiProperty({ description: '랩실 이름', default: '3층 임베디드 실습실' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsNotEmpty()
  public readonly labName: string
}
