import { Module } from '@nestjs/common';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [NotificationsSchedulerService],
})
export class NotificationsSchedulerModule { }
