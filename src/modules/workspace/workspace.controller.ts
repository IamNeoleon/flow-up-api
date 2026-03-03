import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common'
import { WorkspaceService } from './workspace.service'
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard'
import { WorkspaceGuard } from 'src/common/guards/workspace.guard'
import { CreateInviteLinkDto } from './dto/create-invite-link.dto'
import { ChangeRoleDto } from './dto/change-role.dto'
import { UpdateWorkspaceDto } from './dto/update-workspace.dto'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { User } from 'src/common/decorators/user.decorator'
import { WorkspaceContext } from 'src/common/decorators/workspace-context.decorator'
import { type IWorkspaceContext } from 'src/common/types/workspace-context'
import { WorkspaceStatisticsService } from './workspace-statistics.service'
import { VerifiedGuard } from 'src/common/guards/verified.guard'

@Controller('workspaces')
@UseGuards(JwtAuthGuard, VerifiedGuard)
export class WorkspaceController {
	constructor(
		private readonly workspaceService: WorkspaceService,
		private readonly workspaceStatisticsService: WorkspaceStatisticsService
	) { }

	@Get()
	async getAll(@User() user: Express.User) {
		return this.workspaceService.getAll(user.id)
	}

	@UseGuards(WorkspaceGuard)
	@Get(':workspaceId')
	async getById(
		@Param('workspaceId') workspaceId: string,
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.workspaceService.getById(
			workspaceId,
			workspace.workspaceRole
		)
	}

	@Post()
	async create(
		@Body() dto: CreateWorkspaceDto,
		@User() user: Express.User
	) {
		return this.workspaceService.create(dto, user.id)
	}

	@UseGuards(WorkspaceGuard)
	@Patch(':workspaceId')
	async update(
		@Param('workspaceId') workspaceId: string,
		@Body() dto: UpdateWorkspaceDto,
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.workspaceService.update(
			workspaceId,
			dto,
			workspace.workspaceRole
		)
	}

	@UseGuards(WorkspaceGuard)
	@Delete(':workspaceId')
	async delete(
		@Param('workspaceId') workspaceId: string,
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.workspaceService.delete(
			workspaceId,
			workspace.workspaceRole
		)
	}

	@UseGuards(WorkspaceGuard)
	@Get(':workspaceId/members')
	async getMembers(
		@Param('workspaceId') workspaceId: string,
	) {
		return this.workspaceService.getMembers(
			workspaceId,
		)
	}

	@UseGuards(WorkspaceGuard)
	@Patch(':workspaceId/members/:memberId')
	async changeRole(
		@Param('workspaceId') workspaceId: string,
		@Param('memberId') memberId: string,
		@Body() dto: ChangeRoleDto,
		@WorkspaceContext() workspace: IWorkspaceContext,
		@User() user: Express.User
	) {
		return this.workspaceService.changeMemberRole(
			user.id,
			workspaceId,
			memberId,
			dto,
			workspace.workspaceRole
		)
	}

	@UseGuards(WorkspaceGuard)
	@Delete(':workspaceId/members/:memberId')
	async deleteMember(
		@Param('workspaceId') workspaceId: string,
		@Param('memberId') memberId: string,
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.workspaceService.deleteMember(
			workspaceId,
			memberId,
			workspace.workspaceRole
		)
	}

	@UseGuards(WorkspaceGuard)
	@Post(':workspaceId/invite-link')
	async createInvite(
		@Param('workspaceId') workspaceId: string,
		@Body() dto: CreateInviteLinkDto,
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.workspaceService.createInviteLink(
			workspaceId,
			dto,
			workspace.workspaceRole
		)
	}

	@Get('invite/:token')
	async validateInvite(@Param('token') token: string) {
		return this.workspaceService.validateInvite(token)
	}

	@Post('invite/:token/accept')
	async acceptInvite(
		@Param('token') token: string,
		@User() user: Express.User
	) {
		return this.workspaceService.acceptInvite(
			token,
			user.id
		)
	}

	@UseGuards(WorkspaceGuard)
	@Get(':workspaceId/role')
	async getMyRole(
		@Param('workspaceId') workspaceId: string,
		@User() user: Express.User
	) {
		return this.workspaceService.getWorkspaceMember(
			user.id,
			workspaceId
		)
	}

	@UseGuards(WorkspaceGuard)
	@Get(':workspaceId/activity')
	async getActivity(@Param('workspaceId') workspaceId: string) {
		return this.workspaceService.getActivity(workspaceId)
	}

	@UseGuards(WorkspaceGuard)
	@Get(':workspaceId/statistics')
	async getStatistics(@Param('workspaceId') workspaceId: string) {
		return this.workspaceStatisticsService.getStatistics(workspaceId)
	}

	@UseGuards(WorkspaceGuard)
	@Get(':workspaceId/statistics-full')
	async getFullStatistics(
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.workspaceStatisticsService.getFullStatistics(workspace.workspaceId)
	}

	@UseGuards(WorkspaceGuard)
	@Post(':workspaceId/leave')
	async leaveWorkspace(
		@Param('workspaceId') workspaceId: string,
		@User() user: Express.User,
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.workspaceService.leaveWorkspace(workspaceId, user.id, workspace.workspaceRole)
	}
}
