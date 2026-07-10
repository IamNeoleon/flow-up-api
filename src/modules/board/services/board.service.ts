import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { canCreateBoard, canDeleteBoard, canEditBoard } from '../board.policy';
import { TWorkspaceRole } from 'src/common/types/workspaceRole';
import { BOARD_TEMPLATES } from '../constants/board-templates';

@Injectable()
export class BoardService {
    constructor(private readonly prismaService: PrismaService) {}

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

    async create(
        workspaceId: string,
        createBoardDto: CreateBoardDto,
        workspaceRole: TWorkspaceRole,
        userId: string,
    ) {
        if (!canCreateBoard({ workspaceRole })) {
            throw new ForbiddenException();
        }

        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const workspace = await this.prismaService.workspace.findUnique({
            where: {
                id: workspaceId,
            },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        const { name, template } = createBoardDto;
        const templateConfig = template ? BOARD_TEMPLATES[template] : null;

        const createdBoard = await this.prismaService.$transaction(
            async (tx) => {
                const board = await tx.board.create({
                    data: {
                        name,
                        ownerId: userId,
                        workspaceId,
                    },
                });

                if (templateConfig && templateConfig.columns.length > 0) {
                    await tx.column.createMany({
                        data: templateConfig.columns.map((column, index) => ({
                            name: column.name,
                            status: column.status,
                            color: column.color,
                            order: index + 1,
                            boardId: board.id,
                        })),
                    });
                }

                return board;
            },
        );

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
    ) {
        if (!canEditBoard({ workspaceRole })) {
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

    async remove(id: string, workspaceRole: TWorkspaceRole) {
        if (!canDeleteBoard({ workspaceRole })) {
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

    async getAllTaskList(boardId: string) {
        const tasks = await this.prismaService.task.findMany({
            where: {
                column: {
                    boardId: boardId,
                },
            },
            include: {
                column: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                priority: true,
            },
        });

        return tasks;
    }
}
