import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { WorkspaceMembersService } from 'src/modules/workspace/services/workspace-members.service';

export interface AccessContext {
   workspaceId: string;
   workspaceRole: 'OWNER' | 'EDITOR' | 'MEMBER';
}

@Injectable()
export class AccessContextResolver {
   constructor(
      private readonly prisma: PrismaService,
      private readonly workspaceMembersService: WorkspaceMembersService
   ) { }

   async resolve(userId: string, resource: {
      workspaceId?: string;
      boardId?: string;
      colId?: string;
      taskId?: string;
   }): Promise<AccessContext | null> {

      let workspaceId = resource.workspaceId ?? null;

      if (!workspaceId && resource.boardId) {
         const board = await this.prisma.board.findUnique({ where: { id: resource.boardId } });
         workspaceId = board?.workspaceId ?? null;
      }

      if (!workspaceId && resource.colId) {
         const col = await this.prisma.column.findUnique({
            where: { id: resource.colId },
            select: { board: { select: { workspaceId: true } } }
         });
         workspaceId = col?.board.workspaceId ?? null;
      }

      if (!workspaceId && resource.taskId) {
         const task = await this.prisma.task.findUnique({
            where: { id: resource.taskId },
            select: { column: { select: { board: { select: { workspaceId: true } } } } }
         });
         workspaceId = task?.column.board.workspaceId ?? null;
      }

      if (!workspaceId) return null;

      const workspaceRole = await this.workspaceMembersService.getWorkspaceMember(userId, workspaceId);

      if (!workspaceRole) return null;

      const workspace = await this.prisma.workspace.findUnique({
         where: {
            id: workspaceId,
         },
         select: {
            id: true,
            isArchived: true
         }
      })

      if (workspace?.isArchived === true && workspaceRole !== 'OWNER') {
         return null
      }

      return { workspaceId, workspaceRole };
   }
}
