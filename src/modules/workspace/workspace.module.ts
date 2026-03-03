import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { AccessContextResolver } from '../access-context-resolver/access-context-resolver';
import { WorkspaceStatisticsService } from './workspace-statistics.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, AccessContextResolver, WorkspaceStatisticsService],
  exports: [WorkspaceService, AccessContextResolver],
})
export class WorkspaceModule { }
