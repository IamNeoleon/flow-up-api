import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrioritiesService {
   constructor(
      private readonly prismaService: PrismaService
   ) { }

   async getAll() {
      return this.prismaService.taskPriorities.findMany()
   }
}
