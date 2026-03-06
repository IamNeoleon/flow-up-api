import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { UpdateWorkspaceDto } from '../dto/update-workspace.dto';
import { canDeleteWorkspace, canGetActions, canUpdateWorkspace } from '../workspace.policy';
import { TWorkspaceRole } from 'src/common/types/workspaceRole';

@Injectable()
export class WorkspaceService {
   constructor(
      private readonly prismaService: PrismaService
   ) { }

   async getAll(userId: string) {
      const user = await this.prismaService.user.findUnique({ where: { id: userId } })
      if (!user) throw new NotFoundException('Не удалось найти пользователя')

      const workspaces = await this.prismaService.workspace.findMany({
         where: {
            OR: [
               { ownerId: user.id },
               {
                  workspaceMembers: {
                     some: {
                        userId: user.id
                     }
                  },
                  isArchived: false
               }
            ]
         }
      })

      return workspaces
   }

   async getById(workspaceId: string, workspaceRole: TWorkspaceRole) {
      if (!canGetActions({ workspaceRole })) {
         throw new ForbiddenException('У вас не доступа к этому ресурсу')
      }

      return await this.prismaService.workspace.findUnique({
         where: {
            id: workspaceId
         },
         include: {
            boards: true
         }
      })
   }

   async create(dto: CreateWorkspaceDto, userId: string) {
      const user = await this.prismaService.user.findUnique({
         where: {
            id: userId
         }
      })
      if (!user) throw new NotFoundException('Не найден пользователь с таким id')

      const { name, description } = dto

      return await this.prismaService.workspace.create({
         data: {
            name,
            description,
            ownerId: user.id,
         }
      })
   }

   async update(workspaceId: string, dto: UpdateWorkspaceDto, workspaceRole: TWorkspaceRole) {
      if (!canUpdateWorkspace({ workspaceRole })) {
         throw new ForbiddenException('У вас не доступа к этому ресурсу')
      }

      const { name, description, icon, isArchived } = dto

      return await this.prismaService.workspace.update({
         where: {
            id: workspaceId
         },
         data: {
            name,
            icon,
            description,
            isArchived
         }
      })
   }

   async delete(id: string, workspaceRole: TWorkspaceRole) {
      if (!canDeleteWorkspace({ workspaceRole })) {
         throw new ForbiddenException('У вас не доступа к этому ресурсу')
      }

      return await this.prismaService.workspace.delete({
         where: {
            id
         }
      })
   }

   async getActivity(workspaceId: string) {
      return this.prismaService.workspaceActivity.findMany({
         where: {
            workspaceId
         },
         orderBy: {
            createdAt: 'desc'
         },
         take: 5,
         include: {
            user: {
               select: {
                  username: true,
                  avatar: true,
                  fullName: true
               }
            }
         },

      })
   }

   async leaveWorkspace(workspaceId: string, userId: string, workspaceRole: TWorkspaceRole) {
      const membersCount = await this.prismaService.workspaceMember.count({
         where: { workspaceId },
      })

      if (workspaceRole === 'OWNER') {
         if (membersCount === 0) {
            await this.prismaService.workspace.update({
               where: { id: workspaceId },
               data: {
                  ownerId: "ROOT"
               }
            })
            return true
         }
         throw new ConflictException(
            'Unable to leave the workspace. Please transfer the owner role to another user first'
         )
      }

      return await this.prismaService.$transaction(async (tx) => {
         await tx.boardMembers.deleteMany({
            where: { userId, board: { workspaceId } },
         })

         await tx.workspaceMember.delete({
            where: { userId_workspaceId: { userId, workspaceId } },
         })

         return true
      })
   }
}