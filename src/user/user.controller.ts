import { Controller, Get, Post, Patch, Param, Delete, Body, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RolesGuard } from 'src/auth/guard/role.guard'
import { ApiResponseUtil } from 'src/common/api-response.util'
import { RolesEnum } from 'src/common/enum/roles.enum'
import { Roles } from 'src/common/decorator/roles.decorator'
import { AuthGuard } from 'src/auth/guard/auth.guard'

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '회원가입' })
  @Post('/signup')
  async createUser(@Body() dto: CreateUserDto): Promise<ApiResponseUtil> {
    await this.userService.checkUsername(dto.username)
    const user = await this.userService.createUser(dto, RolesEnum.user)
    return ApiResponseUtil.success({ user }, '회원가입 성공')
  }

  @ApiOperation({ summary: '관리자 회원가입' })
  @Post('/signup/admin')
  async createAdmin(@Body() dto: CreateUserDto): Promise<ApiResponseUtil> {
    await this.userService.checkUsername(dto.username)
    const admin = await this.userService.createUser(dto, RolesEnum.admin)
    return ApiResponseUtil.success({ admin }, '관리자 회원가입 성공')
  }

  @ApiOperation({ summary: '모든 사용자 조회' })
  @ApiBearerAuth()
  @Roles(RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @Get()
  async findAllUser(): Promise<ApiResponseUtil> {
    const users = await this.userService.findAllUser()
    return ApiResponseUtil.success({ users }, '모든 사용자 조회 성공')
  }

  @ApiOperation({ summary: '사용자 조회' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  async getOneUser(@Param('id') id: number): Promise<ApiResponseUtil> {
    const user = await this.userService.getOneUser(id)
    return ApiResponseUtil.success({ user }, '사용자 조회 성공')
  }

  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Patch(':id/update')
  async updateUserStatus(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<ApiResponseUtil> {
    const userStatus = await this.userService.updateUserStatus(id, updateUserDto)
    return ApiResponseUtil.success({ userStatus }, '사용자 정보 수정 성공')
  }

  @ApiOperation({ summary: '사용자 삭제' })
  @ApiBearerAuth()
  @Roles(RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: number): Promise<ApiResponseUtil> {
    await this.userService.deleteUser(id)
    return ApiResponseUtil.success({}, '사용자 삭제 성공')
  }
}
