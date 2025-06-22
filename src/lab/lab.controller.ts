import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common'
import { LabService } from './lab.service'
import { CreateLabDto } from './dto/create-lab.dto'
import { UpdateLabDto } from './dto/update-lab.dto'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from 'src/auth/guard/auth.guard'
import { RolesGuard } from 'src/auth/guard/role.guard'
import { AuthRequest } from 'src/auth/interface/auth'
import { RolesEnum } from 'src/common/enum/roles.enum'
import { ApiResponseUtil } from 'src/common/api-response.util'
import { Roles } from 'src/common/decorator/roles.decorator'

@ApiTags('Lab')
@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @ApiOperation({ summary: '랩실 대여' })
  @Roles(RolesEnum.user, RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @Post()
  async createLab(@Req() req: AuthRequest, @Body() dto: CreateLabDto): Promise<ApiResponseUtil> {
    const lab = await this.labService.createLab(dto, req.user.id)
    return ApiResponseUtil.success({ lab }, '랩실 대여 요청 성공')
  }

  @ApiOperation({ summary: '삭제 포함 모든 대여 요청 조회' })
  @Roles(RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get()
  async findAll(): Promise<ApiResponseUtil> {
    const labs = await this.labService.findAll()
    return ApiResponseUtil.success({ labs }, '모든 대여 요청 조회 성공')
  }

  @ApiOperation({ summary: '승인 요청중인 대여 요청 조회' })
  @Roles(RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('approved')
  async findApprovalRental(): Promise<ApiResponseUtil> {
    const labs = await this.labService.findApprovalRental()
    return ApiResponseUtil.success({ labs }, '승인 요청 조회 성공')
  }

  @ApiOperation({ summary: '승인한 대여 요청 조회' })
  @Roles(RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('approval')
  async findApproval(): Promise<ApiResponseUtil> {
    const labs = await this.labService.findApproval()
    return ApiResponseUtil.success({ labs }, '승인 목록 조회 성공')
  }

  @ApiOperation({ summary: '모든 대여 요청 조회' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('list')
  async findDeletionRental(): Promise<ApiResponseUtil> {
    const labs = await this.labService.findDeletionRental()
    return ApiResponseUtil.success({ labs }, '삭제 되지않은 대여 요청 조회 성공')
  }

  @ApiOperation({ summary: '대여 요청 하나만 조회' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ApiResponseUtil> {
    const lab = await this.labService.findOneLab(id)
    return ApiResponseUtil.success({ lab }, '대여 요청 조회 성공')
  }

  @ApiOperation({ summary: '유저별 대여 요청 조회' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('user/:id')
  async findAllUserLab(@Param('id') id: number): Promise<ApiResponseUtil> {
    const labs = await this.labService.findAllUserLab(id)
    return ApiResponseUtil.success({ labs }, '유저별 대여 요청 조회 성공')
  }

  @ApiOperation({ summary: '대여 요청 수정' })
  @ApiBearerAuth()
  @Roles(RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateLabDto): Promise<ApiResponseUtil> {
    const lab = await this.labService.update(id, dto)
    return ApiResponseUtil.success({ lab }, '대여 요청 수정 성공')
  }

  @ApiOperation({ summary: '모든 대여 요청 삭제' })
  @Roles(RolesEnum.admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Delete()
  async allDelete(): Promise<ApiResponseUtil> {
    await this.labService.cleanAllRentals()
    return ApiResponseUtil.success({}, '모든 대여 요청 삭제 성공')
  }
}
