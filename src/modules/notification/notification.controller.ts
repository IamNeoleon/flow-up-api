import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
   constructor(private readonly notificationService: NotificationService) { }

   @Get()
   async getLast(@User() user: Express.User) {
      return this.notificationService.getNotifications({ userId: user.id })
   }

   @Patch(':id')
   async markAsRead(@Param('id') id: string) {
      return this.notificationService.markAsRead({ notificationId: id })
   }
}
