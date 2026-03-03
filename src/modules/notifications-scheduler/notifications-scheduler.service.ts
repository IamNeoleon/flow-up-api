import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class NotificationsSchedulerService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly notificationService: NotificationService
   ) { }

   async findTasksDueSoon() {
      const now = new Date()
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      return this.prismaService.task.findMany({
         where: {
            dueDate: { not: null, gt: now, lte: in24h },
            assigneeId: { not: null },
            column: { status: { not: "DONE" } },
         },
         select: {
            id: true,
            name: true,
            dueDate: true,
            assigneeId: true,
            colId: true,
            column: {
               select: {
                  board: {
                     select: {
                        id: true,
                        workspaceId: true
                     }
                  }
               }
            },
         },
      })
   }

   async findOverdueTasks() {
      const now = new Date()

      return this.prismaService.task.findMany({
         where: {
            dueDate: { not: null, lt: now },
            assigneeId: { not: null },
            column: { status: { not: "DONE" } },
         },
         select: {
            id: true,
            name: true,
            dueDate: true,
            assigneeId: true,
            colId: true,
            column: {
               select: {
                  board: {
                     select: {
                        id: true,
                        workspaceId: true
                     }
                  }
               }
            },
         },
      })
   }

   async createOrRefreshDeadlineNotif(args: {
      userId: string
      taskId: string,
      taskName: string,
      dueDate: Date
      colId: string
      boardId?: string
      type: NotificationType,
      workspaceId: string
   }) {
      const { userId, taskId, dueDate, colId, boardId, type, taskName, workspaceId } = args

      const meta = {
         taskId,
         dueAt: dueDate.toISOString(),
         colId,
         boardId,
         taskName,
         workspaceId
      }

      const existing = await this.prismaService.notification.findFirst({
         where: {
            userId: userId,
            type,
            sourceId: taskId
         },
      })

      if (!existing) {
         const created = await this.prismaService.notification.create({
            data: {
               userId,
               type,
               sourceId: taskId,
               read: false,
               metadata: meta,
            },
         })

         if (created) {
            this.notificationService.sendUserNotificaion(userId)
         }

         return created
      }

      const prevDueAt = (existing.metadata as any)?.dueAt as string | undefined

      if (prevDueAt !== meta.dueAt) {
         const updated = await this.prismaService.notification.update({
            where: { id: existing.id },
            data: {
               read: false,
               metadata: meta,
            },
         })

         if (updated) {
            this.notificationService.sendUserNotificaion(userId)
         }

         return updated
      }

      return null
   }

   @Cron("*/5 * * * *")
   async handle() {
      const soonTasks = await this.findTasksDueSoon()
      for (const t of soonTasks) {
         await this.createOrRefreshDeadlineNotif({
            userId: t.assigneeId!,
            taskId: t.id,
            dueDate: t.dueDate!,
            colId: t.colId,
            boardId: t.column.board.id,
            type: "DEADLINE_SOON",
            taskName: t.name,
            workspaceId: t.column.board.workspaceId
         })
      }

      const overdueTasks = await this.findOverdueTasks()
      for (const t of overdueTasks) {
         await this.createOrRefreshDeadlineNotif({
            userId: t.assigneeId!,
            taskId: t.id,
            dueDate: t.dueDate!,
            colId: t.colId,
            boardId: t.column.board.id,
            type: "DEADLINE_OVERDUE",
            taskName: t.name,
            workspaceId: t.column.board.workspaceId
         })
      }
   }
}
