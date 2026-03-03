import { Module } from '@nestjs/common';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { BoardModule } from '../board/board.module';
import { EventsModule } from '../events/event.module';
import { R2Module } from '../r2/r2.module';
import { TaskCommentService } from './services/task-comment.service';
import { NotificationModule } from '../notification/notification.module';
import { AppWsModule } from '../app-ws/app-ws.module';

@Module({
  imports: [
    WorkspaceModule,
    BoardModule,
    EventsModule,
    R2Module,
    NotificationModule,
    AppWsModule,
    NotificationModule
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskCommentService],
})
export class TaskModule { }
