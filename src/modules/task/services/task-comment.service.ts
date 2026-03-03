import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { BoardService } from "src/modules/board/services/board.service";
import { TWorkspaceRole } from "src/common/types/workspaceRole";
import { canCreateComment, canDeleteComment } from "../task.policy";
import { TypedEventEmitter } from "src/modules/events/typed-event-emitter";
import { WorkspaceEvents } from "src/modules/workspace/types/workspace-events.types";
import { NotificationService } from "src/modules/notification/notification.service";
import { extractUserMentions } from "src/common/utils/extract-user-mentions";
import { Task, TaskComment } from "@prisma/client";

@Injectable()
export class TaskCommentService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly boardService: BoardService,
      private readonly eventEmitter: TypedEventEmitter<WorkspaceEvents>,
      private readonly notificationService: NotificationService,
   ) { }

   private async handleMentions(content: string, task: Task, created: TaskComment, context: { boardId: string, workspaceId: string }) {
      const mentions = extractUserMentions(content);

      if (!mentions.length) return;

      for (const mention of mentions) {
         const user = await this.prismaService.user.findUnique({
            where: { username: mention },
            select: { id: true }
         });

         if (!user || user.id === created.authorId) continue;

         await this.notificationService.createNotification({
            type: 'COMMENT_MENTION',
            userId: user.id,
            sourceId: created.id,
            metadata: {
               colId: task.colId,
               taskId: task.id,
               taskName: task.name,
               actorId: created.authorId,
               boardId: context.boardId,
               workspaceId: context.workspaceId
            }
         });

         this.notificationService.sendUserNotificaion(user.id);
      }
   }

   async getComments(args: { taskId: string }) {
      const { taskId } = args

      return this.prismaService.taskComment.findMany({
         where: {
            taskId
         },
         include: {
            author: {
               select: {
                  id: true,
                  username: true,
                  avatar: true,
                  fullName: true
               }
            }
         }
      })
   }

   async create(args: {
      boardId: string,
      taskId: string,
      colId: string,
      userId: string,
      dto: CreateCommentDto,
      workspaceRole: TWorkspaceRole,
      workspaceId: string
   }) {
      const { boardId, colId, taskId, userId, dto, workspaceRole, workspaceId } = args
      const { content } = dto

      const task = await this.prismaService.task.findUnique({
         where: {
            id: taskId
         }
      })

      if (!task) throw new NotFoundException('Task not found')

      const boardRole = await this.boardService.getBoardRole(boardId, userId)

      if (!canCreateComment({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException()
      }

      const created = await this.prismaService.taskComment.create({
         data: {
            taskId,
            content,
            authorId: userId
         }
      })

      if (created) {
         await this.handleMentions(created.content, task, created, { boardId, workspaceId });
      }

      await this.boardService.updateDateBoard(boardId)

      this.eventEmitter.emit('TASK_COMMENTED', { boardId, colId, taskId, actorId: userId })

      return created
   }

   async edit(args: { commentId: string, boardId: string, userId: string, dto: CreateCommentDto }) {
      const { boardId, userId, dto, commentId } = args
      const { content } = dto

      const comment = await this.prismaService.taskComment.findUnique({
         where: {
            id: commentId
         },
         select: {
            authorId: true,
            id: true
         }
      })

      if (!comment) throw new NotFoundException('Comment not found')

      if (comment.authorId !== userId) {
         throw new ForbiddenException('You cannot edit this comment')
      }

      const updated = await this.prismaService.taskComment.update({
         where: {
            id: comment.id
         },
         data: {
            content,
         }
      })

      await this.boardService.updateDateBoard(boardId)

      return updated
   }

   async delete(args: {
      commentId: string,
      boardId: string,
      userId: string,
      workspaceRole: TWorkspaceRole,
   }) {
      const { boardId, userId, commentId, workspaceRole } = args

      const boardRole = await this.boardService.getBoardRole(boardId, userId)

      const comment = await this.prismaService.taskComment.findUnique({
         where: {
            id: commentId
         },
         select: {
            authorId: true,
            id: true
         }
      })

      if (!comment) throw new NotFoundException('Comment not found')

      const hasPermission = canDeleteComment({ workspaceRole, boardRole })
      const isAuthor = comment.authorId === userId

      if (!hasPermission && !isAuthor) {
         throw new ForbiddenException('You cannot delete this comment')
      }

      const deleted = await this.prismaService.taskComment.delete({
         where: {
            id: comment.id
         }
      })

      await this.boardService.updateDateBoard(boardId)

      return deleted
   }
}