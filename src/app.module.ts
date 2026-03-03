import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { BoardModule } from './modules/board/board.module';
import { ColumnModule } from './modules/column/column.module';
import { TaskModule } from './modules/task/task.module';
import { BoardEventsModule } from './modules/board-events/board-events.module';
import { EventsModule } from './modules/events/event.module';
import { WorkspaceActivityModule } from './modules/workspace-activity/workspace-activity.module';
import { R2Module } from './modules/r2/r2.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AppWsModule } from './modules/app-ws/app-ws.module';
import { NotificationsSchedulerModule } from './modules/notifications-scheduler/notifications-scheduler.module';
import { MailModule } from './modules/mail/mail.module';
import { RecentTasksModule } from './modules/recent-tasks/recent-tasks.module';
import { PrioritiesModule } from './modules/priorities/priorities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    UserModule,
    AuthModule,
    PrismaModule,
    WorkspaceModule,
    BoardModule,
    ColumnModule,
    TaskModule,
    BoardEventsModule,
    EventsModule,
    WorkspaceActivityModule,
    R2Module,
    NotificationModule,
    AppWsModule,
    ScheduleModule.forRoot(),
    NotificationsSchedulerModule,
    MailModule,
    ScheduleModule,
    RecentTasksModule,
    PrioritiesModule
  ],
})
export class AppModule { }
