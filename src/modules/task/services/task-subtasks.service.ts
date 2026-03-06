import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TWorkspaceRole } from "src/common/types/workspaceRole";
import { BoardService } from "src/modules/board/services/board.service";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { CreateSubTaskDto } from "../dto/create-subtask.dto";
import { TypedEventEmitter } from "src/modules/events/typed-event-emitter";
import { WorkspaceEvents } from "src/modules/workspace/types/workspace-events.types";
import { TaskService } from "./task.service";
import { canEditTask } from "../task.policy";
import { UpdateSubTaskDto } from "../dto/update-subtask.dto";

@Injectable()
export class TaskSubtasksService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly boardService: BoardService,
      private readonly eventEmitter: TypedEventEmitter<WorkspaceEvents>,
      private readonly taskService: TaskService
   ) { }

   async createSubtask(
      workspaceRole: TWorkspaceRole,
      boardId: string,
      taskId: string,
      userId: string,
      dto: CreateSubTaskDto
   ) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)
      const task = await this.taskService.getTaskOrFail(taskId)

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException()
      }

      const subtask = await this.prismaService.$transaction(async tx => {
         const { title } = dto

         const subtask = await tx.taskTodo.create({
            data: {
               title,
               completed: false,
               taskId
            }
         })

         return subtask
      })

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_UPDATED', { colId: task.colId, boardId, actorId: userId, taskId })

      return subtask
   }

   async updateSubtask(
      workspaceRole: TWorkspaceRole,
      boardId: string,
      taskId: string,
      subtaskId: string,
      userId: string,
      dto: UpdateSubTaskDto
   ) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)
      const { title, completed } = dto
      const task = await this.taskService.getTaskOrFail(taskId)

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException()
      }

      const subtask = await this.prismaService.$transaction(async tx => {
         const subtask = await tx.taskTodo.findUnique({ where: { id: subtaskId } })
         if (!subtask) throw new NotFoundException('Не найдена подзадача с таким id')

         const updated = await tx.taskTodo.update({
            where: { id: subtaskId },
            data: {
               title: title,
               completed: completed
            }
         })

         return updated
      })

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_UPDATED', { colId: task.colId, boardId, actorId: userId, taskId })

      return subtask
   }

   async deleteSubtask(
      workspaceRole: TWorkspaceRole,
      boardId: string,
      taskId: string,
      subtaskId: string,
      userId: string
   ) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)
      const task = await this.prismaService.task.findUnique({ where: { id: taskId }, select: { id: true, assigneeId: true, colId: true } })
      if (!task) throw new NotFoundException('Не найдено задание с таким id')

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException()
      }

      const subtask = await this.prismaService.$transaction(async tx => {
         const subtask = await tx.taskTodo.findUnique({ where: { id: subtaskId } })
         if (!subtask) throw new NotFoundException('Не найдена подзадача с таким id')

         await tx.taskTodo.delete({
            where: { id: subtaskId }
         })

         return true
      })

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_UPDATED', { colId: task.colId, boardId, actorId: userId, taskId })

      return subtask
   }
} 