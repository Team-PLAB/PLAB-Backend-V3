import { Injectable } from '@nestjs/common'
import { Lab } from '../entities/lab.entity'
import { CreateLabDto } from '../dto/create-lab.dto'

@Injectable()
export class LabFactory {
  createLab(dto: CreateLabDto, userId: number): Lab {
    const lab = new Lab()
    lab.rentalDate = dto.rentalDate
    lab.rentalUser = dto.rentalUser
    lab.rentalUsers = dto.rentalUsers
    lab.rentalPurpose = dto.rentalPurpose
    lab.rentalStartTime = dto.rentalStartTime
    lab.labName = dto.labName
    lab.userId = userId
    lab.deletionRental = false
    lab.approvalRental = false
    lab.updatedAt = null
    return lab
  }
}
