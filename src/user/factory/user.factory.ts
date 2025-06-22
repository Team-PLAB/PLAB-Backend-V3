import { Injectable } from '@nestjs/common'
import { User } from '../entities/user.entity'
import { CreateUserDto } from '../dto/create-user.dto'
import * as bcrypt from 'bcryptjs'
import { RolesEnum } from 'src/common/enum/roles.enum'

@Injectable()
export class UserFactory {
  async createUser(dto: CreateUserDto, role: RolesEnum): Promise<User> {
    const user = new User()
    user.username = dto.username
    user.role = role
    user.hasLabRental = false
    user.password = await bcrypt.hash(dto.password, await bcrypt.genSalt())
    return user
  }
}
