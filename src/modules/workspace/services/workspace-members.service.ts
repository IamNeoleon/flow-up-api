import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { canChangeMemberRole, canDeleteMember } from "../workspace.policy";
import { ChangeRoleDto } from "../dto/change-role.dto";
import { TWorkspaceRole } from "src/common/types/workspaceRole";

@Injectable()
export class WorkspaceMembersService {
   constructor(
      private readonly prismaService: PrismaService
   ) { }

   async getMembers(workspaceId: string) {
      const workspace = await this.prismaService.workspace.findUnique({ where: { id: workspaceId } })
      if (!workspace) throw new NotFoundException('Workspace not found')

      const members = await this.prismaService.workspaceMember.findMany({
         where: {
            workspaceId
         },
         include: {
            user: {
               select: {
                  id: true,
                  username: true,
                  email: true,
                  avatar: true,
                  fullName: true
               }
            }
         }
      })

      let resolvedMembers = [...members]

      const owner = await this.prismaService.user.findUnique({
         where: {
            id: workspace.ownerId
         }
      })

      if (owner) {
         const ownerRandomUuid = randomUUID()

         resolvedMembers.push({
            id: ownerRandomUuid,
            createdAt: workspace.createdAt,
            role: 'OWNER',
            workspaceId: workspace.id,
            userId: owner.id,
            user: {
               id: owner.id,
               email: owner.email,
               avatar: owner.avatar,
               username: owner.username,
               fullName: owner.fullName
            }
         })
      }

      return resolvedMembers
   }

   async getWorkspaceMember(userId: string, workspaceId: string) {
      const workspace = await this.prismaService.workspace.findUnique({
         where: { id: workspaceId },
         include: {
            workspaceMembers: true
         }
      })

      if (!workspace) return null;

      if (workspace.ownerId === userId) return 'OWNER';

      const member = workspace.workspaceMembers.find(m => m.userId === userId)
      if (!member) return null;

      return member.role
   }

   async changeMemberRole(userId: string, workspaceId: string, memberId: string, dto: ChangeRoleDto, workspaceRole: TWorkspaceRole) {
      if (!canChangeMemberRole({ workspaceRole })) {
         throw new ForbiddenException()
      }

      const { role } = dto

      if (userId === memberId) {
         throw new ConflictException('You cannot update your own role.')
      }

      if (role === 'OWNER') {
         if (workspaceRole !== 'OWNER') throw new ForbiddenException()

         const res = await this.prismaService.$transaction(async tx => {
            const oldOwner = await tx.user.findUnique({ where: { id: userId } })

            if (!oldOwner) throw new NotFoundException('Old owner not found')

            const member = await tx.workspaceMember.findUnique({
               where: { userId_workspaceId: { userId: memberId, workspaceId } }
            })

            if (!member) throw new NotFoundException('The user is not a member of the workspace')

            await tx.workspace.update({
               where: { id: workspaceId },
               data: {
                  ownerId: member.userId
               }
            })

            await tx.workspaceMember.delete({
               where: { userId_workspaceId: { userId: memberId, workspaceId } }
            })

            await tx.workspaceMember.create({
               data: {
                  role: 'EDITOR',
                  userId: oldOwner.id,
                  workspaceId
               }
            })

            return true
         })

         return res
      }

      try {
         const updatedMember = await this.prismaService.workspaceMember.update({
            where: { userId_workspaceId: { userId: memberId, workspaceId } },
            data: { role: dto.role }
         })

         return updatedMember
      } catch (error) {
         throw new NotFoundException('User not found');
      }
   }

   async deleteMember(workspaceId: string, userId: string, workspaceRole: TWorkspaceRole) {
      if (!canDeleteMember({ workspaceRole })) {
         throw new ForbiddenException('У вас не доступа к этому ресурсу')
      }

      const deleted = await this.prismaService.workspaceMember.delete({
         where: { userId_workspaceId: { userId, workspaceId } }
      })

      return deleted;
   }
}