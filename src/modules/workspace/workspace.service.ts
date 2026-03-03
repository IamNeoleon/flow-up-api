import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateInviteLinkDto } from './dto/create-invite-link.dto';
import { ConfigService } from '@nestjs/config';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { canChangeMemberRole, canCreateInvite, canDeleteMember, canDeleteWorkspace, canGetActions, canUpdateWorkspace } from './workspace.policy';
import { TWorkspaceRole } from 'src/common/types/workspaceRole';
import { randomUUID } from 'crypto';

@Injectable()
export class WorkspaceService {
   constructor(private readonly prismaService: PrismaService, private configService: ConfigService) { }

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

   async createInviteLink(workspaceId: string, dto: CreateInviteLinkDto, workspaceRole: TWorkspaceRole) {
      if (!canCreateInvite({ workspaceRole })) {
         throw new ForbiddenException('У вас не доступа к этому ресурсу')
      }

      const expiresAt = new Date(Date.now() + (dto.expiresIn ?? 24) * 60 * 60 * 1000);

      const invite = await this.prismaService.workspaceInvite.create({
         data: {
            workspaceId,
            role: dto.role,
            expiresAt
         }
      })
      const frontendUrl = this.configService.get("FRONTEND_URL")

      return {
         inviteUrl: `${frontendUrl}/workspaces/invite/${invite.id}`
      }
   }

   async validateInvite(token: string) {
      const invite = await this.prismaService.workspaceInvite.findUnique({
         where: { id: token },
         include: {
            workspace: {
               select: {
                  name: true
               }
            }
         }
      });

      if (!invite) throw new NotFoundException('Invite not found');

      if (invite.expiresAt < new Date()) {
         throw new BadRequestException('Invite expired');
      }

      return {
         workspaceId: invite.workspaceId,
         role: invite.role,
         workspaceName: invite.workspace.name
      };
   }

   async acceptInvite(id: string, userId: string) {
      if (!userId) throw new NotFoundException('User not found')

      const invite = await this.prismaService.workspaceInvite.findUnique({ where: { id: id } })

      if (!invite) throw new NotFoundException('Invite not found');
      if (invite.expiresAt < new Date()) throw new BadRequestException('Invite expired');

      const already = await this.prismaService.workspaceMember.findFirst({
         where: { workspaceId: invite.workspaceId, userId }
      });

      const workspace = await this.prismaService.workspace.findUnique({
         where: {
            id: invite.workspaceId
         }
      })

      if (already || workspace?.ownerId === userId) return { message: 'Already in workspace' };

      await this.prismaService.workspaceMember.create({
         data: {
            workspaceId: invite.workspaceId,
            userId,
            role: invite.role,
         }
      });

      return { success: true };
   }

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
         throw new ForbiddenException('У вас не доступа к этому ресурсу')
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
