import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { AuthModule } from '../auth/auth.module';
import { AppWsModule } from '../app-ws/app-ws.module';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  imports: [AuthModule, AppWsModule],
  exports: [NotificationService]
})
export class NotificationModule { }
