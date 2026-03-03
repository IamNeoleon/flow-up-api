import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateSubTaskDto } from '../dto/create-subtask.dto';
import { UpdateSubTaskDto } from '../dto/update-subtask.dto';
import { BoardService } from '../../board/services/board.service';
import { canCreateTask, canDeleteTask, canEditTask, canMoveTask } from '../task.policy';
import { TypedEventEmitter } from 'src/modules/events/typed-event-emitter';
import { TaskCreateArgs, TaskUpdateArgs } from '../task.types';
import { WorkspaceEvents } from '../../workspace/types/workspace-events.types';
import { TWorkspaceRole } from 'src/common/types/workspaceRole';
import { randomUUID } from 'crypto';
import { PresignTaskAttachmentUploadDto } from '../dto/presign-attachment.dto';
import { R2Service } from '../../r2/r2.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { AppWsEmitter } from 'src/modules/app-ws/app-ws-emitter.service';

@Injectable()
export class TaskService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly boardService: BoardService,
      private readonly eventEmitter: TypedEventEmitter<WorkspaceEvents>,
      private readonly r2: R2Service,
      private readonly notificationService: NotificationService,
   ) { }

   private safeFileName(name: string) {
      return name
         .replace(/[/\\]+/g, '_')
         .replace(/[^\w.\-() ]+/g, '_')
         .trim()
         .slice(0, 120);
   }

   private buildAttachmentKey(taskId: string, originalName: string) {
      const safe = this.safeFileName(originalName);
      return `tasks/${taskId}/attachments/${randomUUID()}-${safe}`;
   }

   private async getTaskOrFail(taskId: string) {
      const task = await this.prismaService.task.findUnique({
         where: {
            id: taskId
         }
      })

      if (!task) {
         throw new NotFoundException('Задача не найдена')
      }

      return task
   }

   async findById(taskId: string) {
      const task = await this.prismaService.task.findUnique({
         where: {
            id: taskId
         },
         include: {
            todos: true,
            priority: true,
            attachments: true,
            assignee: {
               select: {
                  id: true,
                  username: true,
                  avatar: true,
                  fullName: true
               }
            }
         }
      })
      if (!task) throw new NotFoundException('Не найдено задание с таким id')

      return task;
   }

   async create(args: TaskCreateArgs) {
      const { boardId, colId, userId, workspaceRole, workspaceId, dto } = args

      const boardRole = await this.boardService.getBoardRole(boardId, userId)

      if (!canCreateTask({ workspaceRole, boardRole })) {
         throw new ForbiddenException()
      }

      const { name, dueDate, priorityId, assigneeId } = dto

      const task = await this.prismaService.$transaction(async (tx) => {
         const existCol = await tx.column.findUnique({
            where: { id: colId }
         })

         if (!existCol) {
            throw new NotFoundException('Не найдена колонка с таким id')
         }

         const order = await tx.task.count({
            where: { colId }
         }) + 1

         const task = await tx.task.create({
            data: {
               name,
               colId,
               order,
               dueDate: dueDate || null,
               priorityId: priorityId || null,
               assigneeId: assigneeId || null
            }
         })

         await tx.workspaceActivity.create({
            data: {
               workspaceId: workspaceId,
               actorId: userId,
               entityId: task.id,
               type: 'TASK_CREATED',
               metadata: {
                  taskName: task.name
               }
            }
         })

         return task;
      })

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_CREATED', {
         workspaceId,
         boardId,
         task,
         actorId: userId
      })

      return task
   }
   async update(args: TaskUpdateArgs) {
      const { boardId, colId, taskId, userId, dto, workspaceRole, workspaceId } = args;

      const existTask = await this.prismaService.task.findUnique({ where: { id: taskId } });
      if (!existTask) throw new NotFoundException('Не найдено задание с таким id');

      const boardRole = await this.boardService.getBoardRole(boardId, userId);

      if (!canEditTask({ workspaceRole, boardRole })) {
         throw new ForbiddenException('Нет доступа');
      }

      const updated = await this.prismaService.task.update({
         where: { id: taskId },
         data: {
            name: dto.name ?? existTask.name,
            dueDate: dto.dueDate ?? existTask.dueDate,
            priorityId: dto.priorityId !== undefined ? dto.priorityId : existTask.priorityId,
            assigneeId: dto.assigneeId ?? existTask.assigneeId,
            description: dto.description ?? existTask.description,
         },
         include: {
            priority: {
               select: {
                  name: true
               }
            }
         }
      });

      if (existTask.assigneeId !== updated.assigneeId && updated.assigneeId) {
         this.notificationService.createNotification({
            userId: updated.assigneeId,
            type: 'ADD_ASSIGMENT',
            sourceId: updated.id,
            metadata: {
               colId: updated.colId,
               taskId: updated.id,
               taskName: updated.name,
               boardId,
               workspaceId
            }
         })

         this.notificationService.sendUserNotificaion(updated.assigneeId)
      }

      if (existTask.assigneeId === updated.assigneeId && existTask.priorityId !== updated.priorityId && updated.priority && updated.assigneeId) {
         this.notificationService.createNotification({
            userId: updated.assigneeId,
            type: 'STATUS_CHANGE',
            sourceId: updated.id,
            metadata: {
               newStatus: updated.priority.name,
               colId: updated.colId,
               taskId: updated.id,
               taskName: updated.name,
               boardId,
               workspaceId
            }
         })

         this.notificationService.sendUserNotificaion(updated.assigneeId)
      }

      await this.boardService.updateDateBoard(boardId);

      this.eventEmitter.emit('TASK_UPDATED', { colId, boardId, actorId: userId, taskId });

      return updated;
   }

   async delete(
      workspaceId: string,
      workspaceRole: TWorkspaceRole,
      boardId: string,
      taskId: string,
      userId: string
   ) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)
      if (!canDeleteTask({ workspaceRole, boardRole })) {
         throw new ForbiddenException()
      }

      const task = await this.getTaskOrFail(taskId)

      const deletedTask = await this.prismaService.$transaction(async tx => {
         const deleted = await tx.task.delete({
            where: {
               id: task.id
            }
         })

         await tx.task.updateMany({
            where: {
               colId: task.colId,
               order: { gt: task.order }
            },
            data: {
               order: { decrement: 1 }
            }
         })

         await tx.workspaceActivity.create({
            data: {
               workspaceId: workspaceId,
               actorId: userId,
               entityId: task.id,
               type: 'TASK_DELETED',
               metadata: {
                  taskName: task.name
               }
            }
         })

         return deleted
      })

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_DELETED', {
         workspaceId,
         boardId,
         colId: deletedTask.colId,
         actorId: userId,
         task: deletedTask
      })

      return deletedTask
   }

   async moveTask(args: {
      workspaceId: string,
      workspaceRole: TWorkspaceRole,
      boardId: string,
      taskId: string,
      targetColId: string,
      newOrder: number,
      userId: string
   }) {
      const { workspaceId, workspaceRole, boardId, taskId, targetColId, newOrder, userId } = args

      const boardRole = await this.boardService.getBoardRole(boardId, userId)
      const task = await this.getTaskOrFail(taskId)

      if (!canMoveTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException()
      }

      const movedTask = await this.prismaService.$transaction(async tx => {
         const targetColumn = await tx.column.findUnique({
            where: { id: targetColId }
         })

         if (!targetColumn) {
            throw new NotFoundException('Не найдена целевая колонка')
         }

         const isSameColumn = task.colId === targetColId

         const targetColumnTasks = await tx.task.findMany({
            where: { colId: targetColId },
            orderBy: { order: 'asc' },
            select: { id: true, order: true }
         })

         const targetCount = targetColumnTasks.length
         let safeOrder: number

         if (targetCount === 0) {
            safeOrder = 1
         } else if (isSameColumn) {
            safeOrder = Math.max(1, Math.min(newOrder, targetCount))
         } else {
            safeOrder = Math.max(1, Math.min(newOrder, targetCount + 1))
         }

         if (isSameColumn) {
            if (safeOrder === task.order) {
               return task
            }

            if (safeOrder > task.order) {
               await tx.task.updateMany({
                  where: {
                     colId: task.colId,
                     order: {
                        gt: task.order,
                        lte: safeOrder
                     }
                  },
                  data: {
                     order: { decrement: 1 }
                  }
               })
            } else {
               await tx.task.updateMany({
                  where: {
                     colId: task.colId,
                     order: {
                        gte: safeOrder,
                        lt: task.order
                     }
                  },
                  data: {
                     order: { increment: 1 }
                  }
               })
            }
         } else {
            await tx.task.updateMany({
               where: {
                  colId: task.colId,
                  order: { gt: task.order }
               },
               data: {
                  order: { decrement: 1 }
               }
            })

            if (safeOrder <= targetCount) {
               await tx.task.updateMany({
                  where: {
                     colId: targetColId,
                     order: { gte: safeOrder }
                  },
                  data: {
                     order: { increment: 1 }
                  }
               })
            }
         }

         let doneAt: Date | null = task.doneAt
         if (targetColumn.status === 'DONE' && !task.doneAt) {
            doneAt = new Date()
         }
         if (targetColumn.status !== 'DONE') {
            doneAt = null
         }

         const updated = await tx.task.update({
            where: { id: taskId },
            data: {
               colId: targetColId,
               order: safeOrder,
               doneAt
            },
            include: {
               column: {
                  select: { name: true }
               }
            }
         })

         const allTargetTasks = await tx.task.findMany({
            where: { colId: targetColId },
            orderBy: { order: 'asc' }
         })

         for (let i = 0; i < allTargetTasks.length; i++) {
            const task = allTargetTasks[i]
            const expectedOrder = i + 1

            if (task.order !== expectedOrder) {
               await tx.task.update({
                  where: { id: task.id },
                  data: { order: expectedOrder }
               })
            }
         }

         await tx.workspaceActivity.create({
            data: {
               workspaceId,
               actorId: userId,
               entityId: updated.id,
               type: 'TASK_MOVED',
               metadata: {
                  taskName: updated.name,
                  columnName: updated.column.name
               }
            }
         })

         return updated
      })

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_MOVED', {
         workspaceId,
         boardId,
         actorId: userId,
         task: movedTask
      })

      const updatedCol = await this.prismaService.column.findUnique({
         where: {
            id: targetColId
         },
         include: {
            tasks: true
         }
      })

      return { updatedCol }
   }


   async createSubtask(
      workspaceRole: TWorkspaceRole,
      boardId: string,
      taskId: string,
      userId: string,
      dto: CreateSubTaskDto
   ) {
      const boardRole = await this.boardService.getBoardRole(boardId, userId)
      const task = await this.getTaskOrFail(taskId)

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
      const task = await this.getTaskOrFail(taskId)

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

   async getAttachments(taskId: string) {
      return this.prismaService.taskAttachment.findMany({
         where: {
            taskId
         }
      })
   }

   async presignTaskAttachmentUpload(args: {
      workspaceRole: TWorkspaceRole;
      boardId: string;
      taskId: string;
      userId: string;
      dto: PresignTaskAttachmentUploadDto;
   }) {
      const { workspaceRole, boardId, taskId, userId, dto } = args;

      const boardRole = await this.boardService.getBoardRole(boardId, userId);
      const task = await this.getTaskOrFail(taskId);


      // TODO убрать это
      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException('Нет доступа');
      }

      const MAX_SIZE = 25 * 1024 * 1024; // 25MB
      if (dto.size > MAX_SIZE) throw new ForbiddenException('Файл слишком большой');

      const key = this.buildAttachmentKey(taskId, dto.fileName);

      const attachment = await this.prismaService.taskAttachment.create({
         data: {
            taskId,
            key,
            filename: dto.fileName,
            mimeType: dto.mimeType || 'application/octet-stream',
            size: dto.size,
            status: 'PENDING',
         },
      });

      await this.boardService.updateDateBoard(boardId)

      const { url } = await this.r2.presignUpload({
         key,
         contentType: attachment.mimeType,
         expiresInSeconds: 300,
      });

      this.eventEmitter.emit('TASK_UPDATED', { colId: task.colId, boardId, actorId: userId, taskId });

      return {
         attachmentId: attachment.id,
         key,
         uploadUrl: url,
         method: 'PUT' as const,
      };
   }

   async completeTaskAttachmentUpload(args: {
      workspaceRole: TWorkspaceRole;
      boardId: string;
      taskId: string;
      attachmentId: string;
      userId: string;
   }) {
      const { workspaceRole, boardId, taskId, attachmentId, userId } = args;

      const boardRole = await this.boardService.getBoardRole(boardId, userId);
      const task = await this.getTaskOrFail(taskId);

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException('Нет доступа');
      }

      const attachment = await this.prismaService.taskAttachment.findUnique({
         where: { id: attachmentId },
      });

      if (!attachment || attachment.taskId !== taskId) {
         throw new NotFoundException('Вложение не найдено');
      }

      await this.r2.headObject(attachment.key);

      const updated = await this.prismaService.taskAttachment.update({
         where: { id: attachmentId },
         data: { status: 'READY' },
      });

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_UPDATED', { colId: task.colId, boardId, actorId: userId, taskId });

      return updated;
   }

   async presignTaskAttachmentDownload(args: {
      workspaceRole: TWorkspaceRole;
      boardId: string;
      taskId: string;
      attachmentId: string;
      userId: string;
   }) {
      const { workspaceRole, boardId, taskId, attachmentId, userId } = args;

      const boardRole = await this.boardService.getBoardRole(boardId, userId);
      const task = await this.getTaskOrFail(taskId);

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException('Нет доступа');
      }

      const attachment = await this.prismaService.taskAttachment.findUnique({
         where: { id: attachmentId },
      });

      if (!attachment || attachment.taskId !== taskId) {
         throw new NotFoundException('Вложение не найдено');
      }

      if (attachment.status !== 'READY') {
         throw new ForbiddenException('Файл ещё не загружен');
      }

      const { url } = await this.r2.presignDownload({
         key: attachment.key,
         expiresInSeconds: 300,
      });

      return { url, method: 'GET' as const };
   }

   async deleteTaskAttachment(args: {
      workspaceRole: TWorkspaceRole;
      boardId: string;
      taskId: string;
      attachmentId: string;
      userId: string;
   }) {
      const { workspaceRole, boardId, taskId, attachmentId, userId } = args;
      const boardRole = await this.boardService.getBoardRole(boardId, userId);
      const task = await this.getTaskOrFail(taskId);

      if (!canEditTask({ workspaceRole, boardRole })) {
         throw new ForbiddenException('Нет доступа');
      }

      const attachment = await this.prismaService.taskAttachment.findUnique({
         where: { id: attachmentId },
      });

      if (!attachment || attachment.taskId !== task.id) {
         throw new NotFoundException('Вложение не найдено');
      }
      const { ok } = await this.r2.deleteObject(attachment.key);

      if (!ok) {
         throw new Error('Не удалось удалить файл из хранилища');
      }

      const deletedAttachment = await this.prismaService.taskAttachment.delete({
         where: { id: attachmentId },
      });

      await this.boardService.updateDateBoard(boardId)

      return deletedAttachment;
   }
}
