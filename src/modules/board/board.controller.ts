import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BoardService } from './services/board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { WorkspaceGuard } from 'src/common/guards/workspace.guard';
import { User } from 'src/common/decorators/user.decorator';
import { WorkspaceContext } from 'src/common/decorators/workspace-context.decorator';
import { type IWorkspaceContext } from 'src/common/types/workspace-context';
import { ChangeMemberRoleDto } from './dto/change-role.dto';
import { VerifiedGuard } from 'src/common/guards/verified.guard';
import { BoardImageService } from './services/board-image.service';
import { CompleteImageUploadDto, PresignImageUploadDto } from './dto/upload-image.dto';

@Controller('workspaces/:workspaceId/boards')
@UseGuards(JwtAuthGuard, WorkspaceGuard, VerifiedGuard)
export class BoardController {
	constructor(
		private readonly boardService: BoardService,
		private readonly boardImageService: BoardImageService
	) { }

	@Post()
	create(
		@Param('workspaceId') workspaceId: string,
		@Body() createBoardDto: CreateBoardDto,
		@WorkspaceContext() workspace: IWorkspaceContext,
		@User() user: Express.User
	) {
		return this.boardService.create(workspaceId, createBoardDto, workspace.workspaceRole, user.id);
	}

	@Get(':boardId')
	findOne(@Param('boardId') boardId: string) {
		return this.boardService.findOne(boardId);
	}

	@Patch(':boardId')
	update(
		@Param('boardId') id: string,
		@Body() updateBoardDto: UpdateBoardDto,
		@WorkspaceContext() workspace: IWorkspaceContext,
		@User() user: Express.User
	) {
		return this.boardService.update(id, updateBoardDto, workspace.workspaceRole, user.id);
	}

	@Delete(':boardId')
	remove(
		@Param('boardId') id: string,
		@WorkspaceContext() workspace: IWorkspaceContext,
		@User() user: Express.User
	) {
		return this.boardService.remove(id, workspace.workspaceRole, user.id);
	}

	@Get(':boardId/role')
	async getMyRole(
		@Param('boardId') id: string,
		@User() user: Express.User
	) {
		const role = await this.boardService.getBoardRole(id, user.id)

		return {
			role
		}
	}

	@Get(':boardId/members')
	async getBoardMembers(
		@Param('boardId') boardId: string,
		@Param('workspaceId') workspaceId: string,
	) {
		return await this.boardService.getBoardMembers(boardId, workspaceId)
	}

	@Post(':boardId/members/change-role')
	async changeMemberRole(
		@Param('boardId') boardId: string,
		@WorkspaceContext() workspace: IWorkspaceContext,
		@User() user: Express.User,
		@Body() dto: ChangeMemberRoleDto
	) {
		return await this.boardService.changeRoleMember({
			userId: user.id,
			workspaceId: workspace.workspaceId,
			boardId,
			workspaceRole: workspace.workspaceRole,
			targetRole: dto.targetRole,
			targetUserId: dto.targetUserId
		})
	}

	@Post(':boardId/image/presign-upload')
	presignImageUpload(@Param('boardId') boardId: string, @Body() dto: PresignImageUploadDto) {
		return this.boardImageService.presignImageUpload(boardId, dto.mimeType);
	}

	@Post(':boardId/image/complete')
	completeImageUpload(@Param('boardId') boardId: string, @Body() dto: CompleteImageUploadDto) {
		return this.boardImageService.completeImageUpload(boardId, dto.key);
	}
}
