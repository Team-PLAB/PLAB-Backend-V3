import { ApiProperty } from '@nestjs/swagger'
import { RolesEnum } from 'src/common/enum/roles.enum'
import { Lab } from 'src/lab/entities/lab.entity'
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { UpdateUserDto } from '../dto/update-user.dto'

@Entity()
export class User extends BaseEntity {
  @ApiProperty({
    description: '기본키',
    default: '1'
  })
  @PrimaryGeneratedColumn()
  public id: number

  @ApiProperty({
    description: '사용자 이름(닉네임)',
    default: '김승환 | silofn523'
  })
  @Column({
    name: 'username',
    type: 'varchar',
    nullable: false
  })
  public username: string

  @ApiProperty({
    description: '사용자 패스워드',
    default: '1234'
  })
  @Column({
    name: 'password',
    type: 'varchar',
    nullable: false
  })
  public password: string

  @ApiProperty({
    description: '사용자 권한',
    default: 'user | admin'
  })
  @Column({
    name: 'role_type',
    nullable: false
  })
  public role: RolesEnum

  @ApiProperty({
    description: '실습실 대여 여부',
    default: false
  })
  @Column({
    name: 'has_lab_rental',
    type: 'boolean',
    nullable: false,
    default: false
  })
  public hasLabRental: boolean

  @OneToMany(() => Lab, (lab) => lab.user, { eager: true })
  public readonly lab: Lab[]

  public async updateUser(dto: UpdateUserDto): Promise<void> {
    if (dto.username) {
      this.username = dto.username
    }
    if (dto.password) {
      this.password = await bcrypt.hash(dto.password, await bcrypt.genSalt())
    }
  }
}
