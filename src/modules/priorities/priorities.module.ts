import { Module } from '@nestjs/common';
import { PrioritiesService } from './priorities.service';
import { PrioritiesController } from './priorities.controller';

@Module({
  controllers: [PrioritiesController],
  providers: [PrioritiesService],
})
export class PrioritiesModule {}
