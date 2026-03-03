import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceStatisticsService {
   constructor(
      private readonly prismaService: PrismaService
   ) { }

   private toISODateOnly(d: Date) {
      return d.toISOString().slice(0, 10)
   }

   private addDays(date: Date, days: number) {
      const d = new Date(date)
      d.setUTCDate(d.getUTCDate() + days)
      return d
   }

   private startOfUTCDay(date: Date) {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
   }

   private async getCreatedCompletedSeries(workspaceId: string) {
      const today = this.startOfUTCDay(new Date())
      const from = this.addDays(today, -29)
      const to = this.addDays(today, 1)

      const createdTasks = await this.prismaService.task.findMany({
         where: {
            column: { board: { workspaceId } },
            createdAt: { gte: from, lt: to },
         },
         select: { createdAt: true },
      })

      const doneTasks = await this.prismaService.task.findMany({
         where: {
            column: { board: { workspaceId } },
            doneAt: { not: null, gte: from, lt: to },
         },
         select: { doneAt: true },
      })

      const map = new Map<string, { date: string; created: number; completed: number }>()

      for (let d = from; d < to; d = this.addDays(d, 1)) {
         const key = this.toISODateOnly(d)
         map.set(key, { date: key, created: 0, completed: 0 })
      }

      for (const t of createdTasks) {
         const key = this.toISODateOnly(this.startOfUTCDay(t.createdAt))
         const row = map.get(key)
         if (row) row.created += 1
      }

      for (const t of doneTasks) {
         const key = this.toISODateOnly(this.startOfUTCDay(t.doneAt!))
         const row = map.get(key)
         if (row) row.completed += 1
      }

      const series = Array.from(map.values())

      return {
         interval: "day",
         from: this.toISODateOnly(from),
         to: this.toISODateOnly(this.addDays(to, -1)),
         series,
      }
   }

   private async getAllCompletedCumulativeSeries(workspaceId: string) {
      const today = this.startOfUTCDay(new Date())
      const from = this.addDays(today, -29)
      const to = this.addDays(today, 1)

      const baselineAll = await this.prismaService.task.count({
         where: {
            column: { board: { workspaceId } },
            createdAt: { lt: from },
         },
      })

      const baselineCompleted = await this.prismaService.task.count({
         where: {
            column: { board: { workspaceId } },
            doneAt: { not: null, lt: from },
         },
      })

      const createdTasks = await this.prismaService.task.findMany({
         where: {
            column: { board: { workspaceId } },
            createdAt: { gte: from, lt: to },
         },
         select: { createdAt: true },
      })

      const doneTasks = await this.prismaService.task.findMany({
         where: {
            column: { board: { workspaceId } },
            doneAt: { not: null, gte: from, lt: to },
         },
         select: { doneAt: true },
      })

      const map = new Map<string, { date: string; created: number; completed: number }>()
      for (let d = from; d < to; d = this.addDays(d, 1)) {
         const key = this.toISODateOnly(d)
         map.set(key, { date: key, created: 0, completed: 0 })
      }

      for (const t of createdTasks) {
         const key = this.toISODateOnly(this.startOfUTCDay(t.createdAt))
         const row = map.get(key)
         if (row) row.created += 1
      }

      for (const t of doneTasks) {
         const key = this.toISODateOnly(this.startOfUTCDay(t.doneAt!))
         const row = map.get(key)
         if (row) row.completed += 1
      }

      const daily = Array.from(map.values())

      let all = baselineAll
      let completed = baselineCompleted

      const series = daily.map((d) => {
         all += d.created
         completed += d.completed

         return {
            date: d.date,
            all,
            completed,
         }
      })

      return {
         interval: "day",
         from: this.toISODateOnly(from),
         to: this.toISODateOnly(this.addDays(to, -1)),
         series,
      }
   }

   private async getStatByPrioritites(workspaceId: string) {
      const [priorities, tasks] = await Promise.all([
         this.prismaService.taskPriorities.findMany({
            select: { name: true }
         }),
         this.prismaService.task.findMany({
            where: {
               column: {
                  board: { workspaceId }
               }
            },
            select: {
               priority: {
                  select: { name: true }
               }
            }
         })
      ])

      const taskCountByPriority = priorities.reduce((acc, p) => {
         acc[p.name] = 0
         return acc
      }, { 'Without': 0 } as Record<string, number>)

      for (const task of tasks) {
         const priority = task.priority?.name ?? 'Without'
         taskCountByPriority[priority]++
      }

      return taskCountByPriority
   }

   async getFullStatistics(workspaceId: string) {
      const flow = await this.getCreatedCompletedSeries(workspaceId)
      const cumulative = await this.getAllCompletedCumulativeSeries(workspaceId)
      const byPriority = await this.getStatByPrioritites(workspaceId)

      return {
         flow,
         cumulative,
         byPriority
      };
   }

   async getStatistics(workspaceId: string) {
      const tasks = await this.prismaService.task.findMany({
         where: {
            column: {
               board: {
                  workspaceId: workspaceId
               }
            }
         },
         include: {
            column: {
               select: {
                  status: true
               }
            }
         }
      })

      const stat = {
         total: tasks.length,
         todo: 0,
         inProgress: 0,
         done: 0
      }

      for (const task of tasks) {
         switch (task.column.status) {
            case 'TODO':
               stat.todo++
               break
            case 'IN_PROGRESS':
               stat.inProgress++
               break
            case 'DONE':
               stat.done++
               break
         }
      }

      return stat;
   }
}
