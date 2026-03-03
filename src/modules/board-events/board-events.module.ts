import { Module } from '@nestjs/common';
import { BoardEventsService } from './board-events.service';
import { BoardEventsListener } from './board-events.listener';
import { WorkspaceModule } from '../workspace/workspace.module';
import { EventsModule } from '../events/event.module';
import { AuthModule } from '../auth/auth.module';
import { AppWsModule } from '../app-ws/app-ws.module';

@Module({
  imports: [WorkspaceModule, EventsModule, AuthModule, AppWsModule],
  providers: [BoardEventsService, BoardEventsListener],
})
export class BoardEventsModule { }
