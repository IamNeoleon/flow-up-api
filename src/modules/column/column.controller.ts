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
import { ColumnService } from './column.service'
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard'
import { WorkspaceGuard } from 'src/common/guards/workspace.guard'
import { CreateColumnDto } from './dto/create-column.dto'
import { ChangeOrderDto } from './dto/change-order.dto'
import { User } from 'src/common/decorators/user.decorator'
import { WorkspaceContext } from 'src/common/decorators/workspace-context.decorator'
import { type IWorkspaceContext } from 'src/common/types/workspace-context'
import { VerifiedGuard } from 'src/common/guards/verified.guard'

@UseGuards(JwtAuthGuard, WorkspaceGuard, VerifiedGuard)
@Controller('/boards/:boardId/columns')
export class ColumnController {
	constructor(private readonly columnService: ColumnService) { }

	@Get()
	async getAll(@Param('boardId') boardId: string) {
		return this.columnService.getAll(boardId)
	}

	@Post()
	async create(
		@Param('boardId') boardId: string,
		@Body() dto: CreateColumnDto,
		@User() user: Express.User,
		@WorkspaceContext() workspace: IWorkspaceContext
	) {
		return this.columnService.create(
			dto,
			boardId,
			user.id,
			workspace.workspaceRole
		)
	}

	@Patch(':colId')
	async update(
		@Param('colId') colId: string,
		@Param('boardId') boardId: string,
		@User() user: Express.User,
		@WorkspaceContext() workspace: IWorkspaceContext,
		@Body() dto: CreateColumnDto
	) {
		return this.columnService.update(
			colId,
			dto,
			boardId,
			user.id,
			workspace.workspaceRole
		)
	}

	@Delete(':colId')
	async delete(
		@Param('colId') colId: string,
		@Param('boardId') boardId: string,
		@User() user: Express.User,
		@WorkspaceContext() workspace: IWorkspaceContext,
	) {
		return this.columnService.delete(
			colId,
			boardId,
			user.id,
			workspace.workspaceRole
		)
	}

	@Patch(':colId/change-order')
	async changeOrder(
		@Param('colId') colId: string,
		@Body() dto: ChangeOrderDto,
		@Param('boardId') boardId: string,
		@User() user: Express.User,
		@WorkspaceContext() workspace: IWorkspaceContext,
	) {
		return this.columnService.changeOrder(
			colId,
			dto.newOrder,
			boardId,
			user.id,
			workspace.workspaceRole
		)
	}
}
