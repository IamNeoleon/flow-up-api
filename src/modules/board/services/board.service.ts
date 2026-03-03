import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
	canChangeBoardMember,
	canCreateBoard,
	canDeleteBoard,
	canEditBoard,
} from '../board.policy';
import { TWorkspaceRole } from 'src/common/types/workspaceRole';
import { BoardRoles } from '@prisma/client';

@Injectable()
export class BoardService {
	constructor(private readonly prismaService: PrismaService) { }

	async uploadImage() {

	}

	async updateDateBoard(boardId: string) {
		await this.prismaService.board.update({
			where: {
				id: boardId,
			},
			data: {
				updatedAt: new Date(),
			},
		});
	}

	async getBoardRole(boardId: string, userId: string) {
		const board = await this.prismaService.board.findUnique({
			where: { id: boardId },
			include: { boardMembers: true },
		});
		if (!board) return null;

		const member = board.boardMembers.find((m) => m.userId === userId);

		return member?.role ?? 'VIEWER';
	}

	async create(
		workspaceId: string,
		createBoardDto: CreateBoardDto,
		workspaceRole: TWorkspaceRole,
		userId: string,
	) {
		if (!canCreateBoard({ workspaceRole: workspaceRole })) {
			throw new ForbiddenException('У вас нет доступа к этому ресурсу');
		}

		const user = await this.prismaService.user.findUnique({
			where: {
				id: userId,
			},
		});
		if (!user) {
			throw new NotFoundException('Не найден пользователь с таким id');
		}

		const workspace = await this.prismaService.workspace.findUnique({
			where: {
				id: workspaceId,
			},
		});
		if (!workspace)
			throw new NotFoundException('Не удалось найти рабочее пространство');

		const { name, description } = createBoardDto;

		const createdBoard = await this.prismaService.board.create({
			data: {
				name,
				description,
				workspaceId: workspace.id,
				ownerId: user.id,
			},
		});

		await this.prismaService.boardMembers.create({
			data: {
				userId: user.id,
				role: 'OWNER',
				boardId: createdBoard.id,
			},
		});

		return createdBoard;
	}

	async findOne(boardId: string) {
		return this.prismaService.board.findUnique({
			where: {
				id: boardId,
			},
		});
	}

	async update(
		id: string,
		updateBoardDto: UpdateBoardDto,
		workspaceRole: TWorkspaceRole,
		userId: string,
	) {
		const boardRole = await this.getBoardRole(id, userId);

		if (!canEditBoard({ workspaceRole, boardRole })) {
			throw new ForbiddenException('У вас нет доступа к этому ресурсу');
		}

		const { name, description } = updateBoardDto;
		return this.prismaService.board.update({
			where: {
				id: id,
			},
			data: {
				name,
				description,
			},
		});
	}

	async remove(id: string, workspaceRole: TWorkspaceRole, userId: string) {
		const boardRole = await this.getBoardRole(id, userId);

		if (!canDeleteBoard({ workspaceRole, boardRole })) {
			throw new ForbiddenException('У вас нет доступа к этому ресурсу');
		}

		const board = await this.prismaService.board.findUnique({
			where: { id: id },
		});
		if (!board) throw new NotFoundException('Не найдена доска с таким id');

		return this.prismaService.board.delete({
			where: {
				id: id,
			},
		});
	}

	async getBoardMembers(boardId: string, workspaceId: string) {
		const workspace = await this.prismaService.workspace.findUnique({
			where: { id: workspaceId },
			include: {
				owner: {
					select: {
						id: true,
						email: true,
						username: true,
						avatar: true,
						fullName: true,
					},
				},
			},
		});
		if (!workspace) throw new NotFoundException();

		const workspaceMembers = await this.prismaService.workspaceMember.findMany({
			where: { workspaceId },
			select: {
				userId: true,
				user: {
					select: {
						id: true,
						email: true,
						username: true,
						avatar: true,
						fullName: true,
					},
				},
			},
		});

		const boardMembers = await this.prismaService.boardMembers.findMany({
			where: { boardId },
			select: { userId: true, role: true },
		});

		const boardMap = new Map(boardMembers.map((m) => [m.userId, m.role]));

		const allMembers = [...workspaceMembers];

		allMembers.push({
			userId: workspace.ownerId,
			user: workspace.owner,
		});

		const result = allMembers.map((member) => {
			const boardRoleFromDB = boardMap.get(member.userId) ?? 'VIEWER';

			const boardRole =
				member.userId === workspace.ownerId ? 'OWNER' : boardRoleFromDB;

			return {
				userId: member.userId,
				user: member.user,
				boardRole,
			};
		});

		return result;
	}

	async changeRoleMember(args: {
		userId: string;
		boardId: string;
		workspaceId: string;
		workspaceRole: TWorkspaceRole;
		targetUserId: string;
		targetRole: BoardRoles | 'VIEWER';
	}) {
		const {
			userId,
			boardId,
			workspaceId,
			workspaceRole,
			targetUserId,
			targetRole,
		} = args;

		if (targetUserId === userId) throw new ConflictException();

		const targetWs = await this.prismaService.workspaceMember.findUnique({
			where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
			select: { userId: true },
		});
		if (!targetWs)
			throw new NotFoundException('Target is not a workspace member');

		const boardMember = await this.prismaService.boardMembers.findUnique({
			where: { userId_boardId: { userId, boardId } },
			select: { role: true, userId: true },
		});

		if (
			!canChangeBoardMember({ workspaceRole, boardRole: boardMember?.role })
		) {
			throw new ForbiddenException();
		}

		const boardOwner = await this.prismaService.boardMembers.findFirst({
			where: { role: 'OWNER', boardId },
			select: { userId: true },
		});
		if (!boardOwner) throw new NotFoundException();

		if (boardOwner.userId === targetUserId && targetRole !== 'OWNER') {
			throw new ConflictException(
				'Cannot change board owner role without transferring ownership',
			);
		}

		if (targetRole === 'OWNER' && boardOwner.userId === targetUserId)
			return true;

		if (targetRole === 'OWNER') {
			return await this.prismaService.$transaction(async (tx) => {
				await tx.boardMembers.update({
					where: { userId_boardId: { userId: boardOwner.userId, boardId } },
					data: { role: 'EDITOR' },
				});

				await tx.boardMembers.upsert({
					where: { userId_boardId: { userId: targetUserId, boardId } },
					create: { userId: targetUserId, boardId, role: 'OWNER' },
					update: { role: 'OWNER' },
				});

				return true;
			});
		}

		if (targetRole === 'VIEWER') {
			await this.prismaService.boardMembers.deleteMany({
				where: { userId: targetUserId, boardId },
			});
			return true;
		}

		return await this.prismaService.boardMembers.upsert({
			where: { userId_boardId: { userId: targetUserId, boardId } },
			create: { userId: targetUserId, boardId, role: targetRole },
			update: { role: targetRole },
		});
	}
}
