import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class SchedulerService {
   constructor(
      private readonly prismaService: PrismaService
   ) { }


   // @Cron("0 */3 * * *")
   // async deleteNotVerifiedUsers() {
   //    const now = new Date()
   //    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

   //    await this.prismaService.user.deleteMany({
   //       where: {
   //          isEmailVerified: false,
   //          createdAt: {
   //             lt: threeHoursAgo
   //          }
   //       }
   //    })
   // }
}