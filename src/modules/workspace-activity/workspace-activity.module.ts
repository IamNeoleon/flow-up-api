import { Module } from '@nestjs/common';
import { WorkspaceActivityService } from './workspace-activity.service';
import { WorkspaceActivityListener } from './workspace-activity.listener';
import { EventsModule } from 'src/modules/events/event.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';
import { AppWsModule } from 'src/modules/app-ws/app-ws.module';

@Module({
  imports: [EventsModule, AuthModule, WorkspaceModule, AppWsModule],
  providers: [WorkspaceActivityService, WorkspaceActivityListener],
})
export class WorkspaceActivityModule { }
