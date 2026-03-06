import { Module } from '@nestjs/common';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceController } from './workspace.controller';
import { AccessContextResolver } from '../access-context-resolver/access-context-resolver';
import { WorkspaceStatisticsService } from './services/workspace-statistics.service';
import { WorkspaceInviteService } from './services/workspace-invite.service';
import { WorkspaceMembersService } from './services/workspace-members.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, AccessContextResolver, WorkspaceStatisticsService, WorkspaceInviteService, WorkspaceMembersService],
  exports: [WorkspaceService, AccessContextResolver],
})
export class WorkspaceModule { }
