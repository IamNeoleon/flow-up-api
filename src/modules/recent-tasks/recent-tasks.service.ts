import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecentTasksService {
   constructor(
      private readonly prismaService: PrismaService
   ) { }

   async trackOpen(userId: string, taskId: string) {
      const now = new Date();
      const keep = 10;

      return this.prismaService.$transaction(async (tx) => {
         const created = await tx.userRecentTask.upsert({
            where: { userId_taskId: { userId, taskId } },
            create: { userId, taskId, lastOpenedAt: now },
            update: { lastOpenedAt: now },
         });

         const toDelete = await tx.userRecentTask.findMany({
            where: { userId },
            select: { id: true },
            orderBy: { lastOpenedAt: "desc" },
            skip: keep,
            take: 1000,
         });

         if (toDelete.length) {
            await tx.userRecentTask.deleteMany({
               where: { id: { in: toDelete.map((x) => x.id) } },
            });
         }

         return created
      });
   }

   async listRecent(userId: string, limit = 10) {
      const take = Math.min(Math.max(limit, 1), 50);

      const recents = await this.prismaService.userRecentTask.findMany({
         where: { userId },
         orderBy: [{ lastOpenedAt: "desc" }, { id: "desc" }],
         take,
         select: {
            taskId: true,
            lastOpenedAt: true,
            task: {
               select: {
                  id: true,
                  name: true,
                  column: {
                     select: {
                        id: true,
                        name: true,
                        board: {
                           select: {
                              id: true,
                              name: true,
                              workspace: {
                                 select: {
                                    id: true,
                                    name: true
                                 }
                              }
                           }
                        }
                     }
                  }
               }
            }
         }
      });

      return recents
   }
}
