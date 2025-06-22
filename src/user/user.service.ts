import { Injectable, Logger } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { RolesEnum } from 'src/common/enum/roles.enum'
import { ApiResponseUtil } from 'src/common/api-response.util'
import { UserFactory } from './factory/user.factory'
import { UserResponseDto } from './dto/user-response.dto'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(User)
    private readonly user: Repository<User>,
    private readonly userFactory: UserFactory
  ) {}

  public async createUser(dto: CreateUserDto, role: RolesEnum): Promise<UserResponseDto> {
    const user = await this.userFactory.createUser(dto, role)
    const savedUser = await this.user.save(user)
    this.logger.log(`User created with ID: ${savedUser.id}, username: ${savedUser.username}`)

    return UserResponseDto.fromEntity(savedUser)
  }

  public async getOneUser(id: number): Promise<User> {
    return await this.user.findOne({
      where: {
        id
      }
    })
  }

  async findAllUser(): Promise<UserResponseDto[]> {
    const users = await this.user.find()
    return users.map((user) => UserResponseDto.fromEntity(user))
  }

  public async checkUsername(username: string): Promise<void> {
    const existing = await this.user.findOne({
      where: [{ username }]
    })

    if (existing) {
      throw ApiResponseUtil.error(`${username}은 이미 사용 중인 사용자 이름입니다.`, 409, {
        code: 'USERNAME_CONFLICT',
        details: '입력한 사용자 이름은 이미 다른 사용자에 의해 사용되고 있습니다.'
      })
    }
  }

  public async updateUserStatus(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.getOneUser(id)
    if (updateUserDto.username) {
      await this.checkUsername(updateUserDto.username)
    }
    await user.updateUser(updateUserDto)
    const userStatus =  await this.user.save(user)
    this.logger.log(`User updated with ID: ${id}`)

    return UserResponseDto.fromEntity(userStatus)
  }

  async deleteUser(id: number): Promise<void> {
    await this.user.delete(id)
    this.logger.log(`User deleted with ID: ${id}`)
  }

  public async findUserByLogin(login: string, secret = false): Promise<User | undefined> {
    return (
      (await this.user.findOne({
        where: [{ username: login }],
        select: {
          id: true,
          username: true,
          password: secret,
          role: true
        }
      })) ?? undefined
    )
  }
}
