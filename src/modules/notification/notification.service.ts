import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppWsEmitter } from '../app-ws/app-ws-emitter.service';
import { CreateNotificationArgs, NotificationMetaMap } from './types/notification';

@Injectable()
export class NotificationService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly appWsEmitter: AppWsEmitter
   ) { }

   async sendUserNotificaion(userId: string) {
      this.appWsEmitter.user(userId, 'NOTIFICATION_NEW');
   }

   async getNotifications(args: { userId: string }) {
      const { userId } = args;

      const unread = await this.prismaService.notification.findMany({
         where: { userId, read: false },
         orderBy: { updatedAt: "desc" },
      });

      const read = await this.prismaService.notification.findMany({
         where: { userId, read: true },
         orderBy: { updatedAt: "desc" },
         take: 5,
      });

      return [...unread, ...read];
   }

   async markAsRead(args: { notificationId: string }) {
      const { notificationId } = args;

      return this.prismaService.notification.update({
         where: { id: notificationId },
         data: { read: true },
      });
   }

   async createNotification<T extends keyof NotificationMetaMap>(args: CreateNotificationArgs<T>) {
      const { userId, type, sourceId, metadata } = args;

      return this.prismaService.notification.create({
         data: {
            userId,
            type,
            sourceId,
            metadata,
         },
      });
   }
}