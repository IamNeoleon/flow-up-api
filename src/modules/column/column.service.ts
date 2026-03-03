import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { type TWorkspaceRole } from 'src/common/types/workspaceRole';
import { BoardService } from '../board/services/board.service';
import { canCreateColumn, canDeleteColumn, canMoveColumn, canUpdateColumn } from './column.policy';

@Injectable()
export class ColumnService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly boardService: BoardService,
   ) { }

   async getAll(boardId: string) {
      const existBoard = await this.prismaService.board.findUnique({ where: { id: boardId } })
      if (!existBoard) throw new NotFoundException('Доска с таким id не найдена')

      return this.prismaService.column.findMany({
         where: {
            boardId,
         },
         include: {
            tasks: {
               select: {
                  id: true,
                  name: true,
                  priority: true,
                  colId: true,
                  order: true,
                  dueDate: true
               }
            }
         }
      })
   }

   async create(dto: CreateColumnDto, boardId: string, userId: string, workspaceRole: TWorkspaceRole) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)

      if (!canCreateColumn({ workspaceRole, boardRole })) {
         throw new ForbiddenException()
      }

      const { name, color, status } = dto
      if (!boardId) throw new BadRequestException('BoardId не указан')

      const col = await this.prismaService.$transaction(async (tx) => {
         const maxColumn = await tx.column.findFirst({
            where: { boardId },
            orderBy: { order: 'desc' }
         })

         const order = (maxColumn?.order ?? 0) + 1

         return tx.column.create({
            data: {
               name,
               color,
               status,
               boardId,
               order
            }
         })
      })

      this.boardService.updateDateBoard(boardId)

      return col
   }

   async update(id: string, dto: UpdateColumnDto, boardId: string, userId: string, workspaceRole: TWorkspaceRole) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)

      if (!canUpdateColumn({ workspaceRole, boardRole })) {
         throw new ForbiddenException()
      }

      const { name, color, status } = dto
      const column = await this.prismaService.column.update({
         where: {
            id: id
         },
         data: {
            name,
            color,
            status
         }
      })

      this.boardService.updateDateBoard(boardId)

      return column
   }

   async delete(id: string, boardId: string, userId: string, workspaceRole: TWorkspaceRole) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)

      if (!canDeleteColumn({ workspaceRole, boardRole })) {
         throw new ForbiddenException()
      }

      const board = await this.prismaService.board.findUnique({
         where: {
            id: boardId
         },
      })

      if (!board) throw new NotFoundException('Не найдена доска с таким id')

      const column = await this.prismaService.column.findUnique({
         where: { id: id },
         include: {
            tasks: {
               select: { id: true }
            }
         }
      })
      if (!column) throw new NotFoundException('Не найдена заданная колонка')
      if (column.tasks.length > 0) throw new ConflictException('Нельзя удалить колонку, в которой есть задачи')

      await this.prismaService.$transaction(async (tx) => {
         await tx.column.updateMany({
            where: {
               order: {
                  gt: column.order
               }
            },
            data: {
               order: { decrement: 1 }
            }
         })

         await tx.column.delete({
            where: {
               id
            }
         })
      })

      this.boardService.updateDateBoard(boardId)

      return true
   }

   async changeOrder(colId: string, newOrder: number, boardId: string, userId: string, workspaceRole: TWorkspaceRole) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)

      if (!canMoveColumn({ workspaceRole, boardRole })) {
         throw new ForbiddenException()
      }

      const column = await this.prismaService.$transaction(async (tx) => {
         const column = await this.prismaService.column.findUnique({
            where: { id: colId }
         })

         if (!column) throw new NotFoundException('Не найдена заданная колонка')

         const oldOrder = column.order

         if (oldOrder === newOrder) return column

         if (oldOrder < newOrder) {
            await tx.column.updateMany({
               where: {
                  boardId: column.boardId,
                  order: {
                     gt: oldOrder,
                     lte: newOrder,
                  }
               },
               data: {
                  order: { decrement: 1 }
               }
            })
         }

         if (oldOrder > newOrder) {
            await tx.column.updateMany({
               where: {
                  boardId: column.boardId,
                  order: {
                     gte: newOrder,
                     lt: oldOrder
                  }
               },
               data: {
                  order: { increment: 1 }
               }
            })
         }

         return tx.column.update({
            where: { id: colId },
            data: { order: newOrder }
         })
      })

      this.boardService.updateDateBoard(boardId)

      return column
   }
}
