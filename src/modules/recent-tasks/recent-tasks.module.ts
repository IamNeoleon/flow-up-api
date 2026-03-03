import { Module } from '@nestjs/common';
import { RecentTasksService } from './recent-tasks.service';
import { RecentTasksController } from './recent-tasks.controller';

@Module({
  controllers: [RecentTasksController],
  providers: [RecentTasksService],
})
export class RecentTasksModule {}
