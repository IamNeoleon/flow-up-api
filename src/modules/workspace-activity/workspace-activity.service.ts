import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ICreateActivityBody } from './workspace-activity.types';

@Injectable()
export class WorkspaceActivityService {
   constructor(
      private readonly prismaService: PrismaService
   ) { }

   async createActivity(body: ICreateActivityBody) {
      const { workspaceId, actorId, entityId, type, metadata } = body

      return this.prismaService.workspaceActivity.create({
         data: {
            workspaceId,
            actorId,
            entityId,
            type,
            metadata
         }
      })
   }
}
