import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TWorkspaceRole } from "src/common/types/workspaceRole";
import { BoardService } from "src/modules/board/services/board.service";
import { TypedEventEmitter } from "src/modules/events/typed-event-emitter";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { WorkspaceEvents } from "src/modules/workspace/types/workspace-events.types";
import { PresignTaskAttachmentUploadDto } from "../dto/presign-attachment.dto";
import { TaskService } from "./task.service";
import { canEditTask } from "../task.policy";
import { buildAttachmentKey } from "../utils/build-attachment-key";
import { R2Service } from "src/modules/r2/r2.service";
import { MAX_SIZE_ATTACHMENT } from "../constants/max-size-attachment";

@Injectable()
export class TaskAttachmentsService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly boardService: BoardService,
      private readonly eventEmitter: TypedEventEmitter<WorkspaceEvents>,
      private readonly taskService: TaskService,
      private readonly r2: R2Service
   ) { }

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
      const task = await this.taskService.getTaskOrFail(taskId);

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException();
      }

      if (dto.size > MAX_SIZE_ATTACHMENT) throw new BadRequestException('File is too large');

      const key = buildAttachmentKey(taskId, dto.fileName);

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
      const task = await this.taskService.getTaskOrFail(taskId);

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException();
      }

      const attachment = await this.prismaService.taskAttachment.findUnique({
         where: { id: attachmentId },
      });

      if (!attachment || attachment.taskId !== taskId) {
         throw new NotFoundException('Attachment not found');
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
      const task = await this.taskService.getTaskOrFail(taskId);

      if (!canEditTask({ workspaceRole, boardRole, isAssignee: task.assigneeId === userId })) {
         throw new ForbiddenException();
      }

      const attachment = await this.prismaService.taskAttachment.findUnique({
         where: { id: attachmentId },
      });

      if (!attachment || attachment.taskId !== taskId) {
         throw new NotFoundException('Attachment not found');
      }

      if (attachment.status !== 'READY') {
         throw new BadRequestException('File has not been uploaded yet');
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
      const task = await this.taskService.getTaskOrFail(taskId);

      if (!canEditTask({ workspaceRole, boardRole })) {
         throw new ForbiddenException();
      }

      const attachment = await this.prismaService.taskAttachment.findUnique({
         where: { id: attachmentId },
      });

      if (!attachment || attachment.taskId !== task.id) {
         throw new NotFoundException('Attachment not found');
      }
      const { ok } = await this.r2.deleteObject(attachment.key);

      if (!ok) {
         throw new Error('Failed to delete file from storage');
      }

      const deletedAttachment = await this.prismaService.taskAttachment.delete({
         where: { id: attachmentId },
      });

      await this.boardService.updateDateBoard(boardId)

      return deletedAttachment;
   }
}