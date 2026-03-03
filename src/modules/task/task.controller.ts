import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TaskService } from './services/task.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { WorkspaceGuard } from 'src/common/guards/workspace.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubTaskDto } from './dto/create-subtask.dto';
import { UpdateSubTaskDto } from './dto/update-subtask.dto';
import { User } from 'src/common/decorators/user.decorator';
import { WorkspaceContext } from 'src/common/decorators/workspace-context.decorator';
import { type IWorkspaceContext } from 'src/common/types/workspace-context';
import { PresignTaskAttachmentUploadDto } from './dto/presign-attachment.dto';
import { TaskCommentService } from './services/task-comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { VerifiedGuard } from 'src/common/guards/verified.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard, VerifiedGuard)
@Controller('/boards/:boardId/columns/:colId/tasks')
export class TaskController {
   constructor(
      private readonly taskService: TaskService,
      private readonly taskComService: TaskCommentService
   ) { }

   @Get(':taskId')
   async findById(@Param('taskId') id: string) {
      return this.taskService.findById(id)
   }

   @Post()
   async create(
      @Param('boardId') boardId: string,
      @Param('colId') colId: string,
      @Body() dto: CreateTaskDto,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.create({
         boardId,
         colId,
         dto,
         userId: user.id,
         workspaceRole: workspace.workspaceRole,
         workspaceId: workspace.workspaceId
      })
   }

   @Patch(':taskId')
   async updateTask(
      @Param('taskId') taskId: string,
      @Param('colId') colId: string,
      @Param('boardId') boardId: string,
      @Body() dto: UpdateTaskDto,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.update({
         taskId,
         colId,
         dto,
         userId: user.id,
         boardId,
         workspaceId: workspace.workspaceId,
         workspaceRole: workspace.workspaceRole
      })
   }

   @Delete(':taskId')
   async deleteTask(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.delete(workspace.workspaceId, workspace.workspaceRole, boardId, taskId, user.id)
   }

   @Patch(':taskId/move')
   async moveTask(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @Body() dto: MoveTaskDto,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.moveTask({
         workspaceId: workspace.workspaceId,
         workspaceRole: workspace.workspaceRole,
         boardId: boardId,
         taskId: taskId,
         targetColId: dto.targetColId,
         newOrder: dto.newOrder,
         userId: user.id
      })
   }

   @Post(':taskId/subtasks')
   async createSubtask(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @User() user: Express.User,
      @Body() dto: CreateSubTaskDto,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.createSubtask(workspace.workspaceRole, boardId, taskId, user.id, dto)
   }

   @Patch(':taskId/subtasks/:subtaskId')
   async updateSubtask(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @Param('subtaskId') subtaskId: string,
      @User() user: Express.User,
      @Body() dto: UpdateSubTaskDto,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.updateSubtask(workspace.workspaceRole, boardId, taskId, subtaskId, user.id, dto)
   }

   @Delete(':taskId/subtasks/:subtaskId')
   async deleteSubtask(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @Param('subtaskId') subtaskId: string,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.deleteSubtask(workspace.workspaceRole, boardId, taskId, subtaskId, user.id)
   }

   @Get(':taskId/attachments')
   async getAttachments(@Param('taskId') taskId: string) {
      return this.taskService.getAttachments(taskId)
   }

   @Post(':taskId/attachments/presign-upload')
   async presignAttachmentUpload(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @Body() dto: PresignTaskAttachmentUploadDto,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.presignTaskAttachmentUpload({
         boardId,
         taskId,
         dto,
         userId: user.id,
         workspaceRole: workspace.workspaceRole,
      });
   }

   @Post(':taskId/attachments/:attachmentId/complete')
   async completeAttachmentUpload(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @Param('attachmentId') attachmentId: string,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.completeTaskAttachmentUpload({
         boardId,
         taskId,
         attachmentId,
         userId: user.id,
         workspaceRole: workspace.workspaceRole,
      });
   }

   @Get(':taskId/attachments/:attachmentId/presign-download')
   async presignAttachmentDownload(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @Param('attachmentId') attachmentId: string,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.presignTaskAttachmentDownload({
         boardId,
         taskId,
         attachmentId,
         userId: user.id,
         workspaceRole: workspace.workspaceRole,
      });
   }

   @Delete(':taskId/attachments/:attachmentId')
   async deleteAttachment(
      @Param('boardId') boardId: string,
      @Param('taskId') taskId: string,
      @Param('attachmentId') attachmentId: string,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskService.deleteTaskAttachment({
         boardId,
         taskId,
         attachmentId,
         userId: user.id,
         workspaceRole: workspace.workspaceRole,
      });
   }

   @Get(':taskId/comments')
   async getTaskComments(
      @Param('taskId') taskId: string,
   ) {
      return this.taskComService.getComments({ taskId })
   }

   @Post(':taskId/comments')
   async createComment(
      @Param('boardId') boardId: string,
      @Param('colId') colId: string,
      @Param('taskId') taskId: string,
      @User() user: Express.User,
      @Body() dto: CreateCommentDto,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskComService.create({ boardId, colId, taskId, userId: user.id, dto, workspaceRole: workspace.workspaceRole, workspaceId: workspace.workspaceId })
   }

   @Patch(':taskId/comments/:comId')
   async editComment(
      @Param('boardId') boardId: string,
      @Param('comId') comId: string,
      @User() user: Express.User,
      @Body() dto: CreateCommentDto,
   ) {
      return this.taskComService.edit({ boardId, userId: user.id, dto, commentId: comId })
   }

   @Delete(':taskId/comments/:comId')
   async deleteComment(
      @Param('boardId') boardId: string,
      @Param('comId') comId: string,
      @User() user: Express.User,
      @WorkspaceContext() workspace: IWorkspaceContext
   ) {
      return this.taskComService.delete({ boardId, userId: user.id, commentId: comId, workspaceRole: workspace.workspaceRole })
   }


}
