import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrioritiesService } from './priorities.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';

@Controller('priorities')
@UseGuards(JwtAuthGuard)
export class PrioritiesController {
   constructor(private readonly prioritiesService: PrioritiesService) { }

   @Get()
   async getAll() {
      return this.prioritiesService.getAll()
   }
}
