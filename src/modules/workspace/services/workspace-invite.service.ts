import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { CreateInviteLinkDto } from "../dto/create-invite-link.dto";
import { TWorkspaceRole } from "src/common/types/workspaceRole";
import { canCreateInvite } from "../workspace.policy";
import { REDIRECT_INVITE_ROUTE } from "../constants/redirect-invite-route";

@Injectable()
export class WorkspaceInviteService {
   constructor(
      private readonly prismaService: PrismaService,
      private configService: ConfigService
   ) { }

   async createInviteLink(workspaceId: string, dto: CreateInviteLinkDto, workspaceRole: TWorkspaceRole) {
      if (!canCreateInvite({ workspaceRole })) {
         throw new ForbiddenException()
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
         inviteUrl: `${frontendUrl}/${REDIRECT_INVITE_ROUTE}/${invite.id}`
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
}