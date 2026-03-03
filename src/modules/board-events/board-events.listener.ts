import { Injectable } from '@nestjs/common';
import { TypedEventEmitter } from 'src/modules/events/typed-event-emitter';

import { WorkspaceEvents } from '../workspace/types/workspace-events.types';
import { AppWsEmitter } from '../app-ws/app-ws-emitter.service';

@Injectable()
export class BoardEventsListener {
   constructor(
      private readonly gateway: AppWsEmitter,
      private readonly emitter: TypedEventEmitter<WorkspaceEvents>
   ) {
      this.emitter.on('TASK_CREATED', (event) => this.handleTaskCreated(event));
      this.emitter.on('TASK_UPDATED', (event) => this.handleTaskUpdated(event));
      this.emitter.on('TASK_DELETED', (event) => this.handleTaskDeleted(event));
      this.emitter.on('TASK_COMMENTED', (event) => this.handleTaskCommented(event));
      this.emitter.on('TASK_MOVED', (event) => this.handleTaskMoved(event));
      // TODO TASK MOVED
   }

   private handleTaskCreated(event: WorkspaceEvents['TASK_CREATED']) {
      this.gateway.board(event.boardId, 'TASK_CREATED', {
         boardId: event.boardId,
         colId: event.task.colId,
         actorId: event.actorId
      })

      console.log(`TASK_CREATED sent to board:${event.boardId}`);
   }

   private handleTaskUpdated(event: WorkspaceEvents['TASK_UPDATED']) {
      this.gateway.board(event.boardId, 'TASK_UPDATED', event)

      console.log(`TASK_UPDATED sent to board:${event.boardId}`);
   }

   private handleTaskDeleted(event: WorkspaceEvents['TASK_DELETED']) {
      this.gateway.board(event.boardId, 'TASK_DELETED', {
         boardId: event.boardId,
         colId: event.colId,
         actorId: event.actorId
      })

      console.log(`TASK_DELETED sent to board:${event.boardId}`);
   }

   private handleTaskCommented(event: WorkspaceEvents['TASK_COMMENTED']) {
      this.gateway.board(event.boardId, 'TASK_COMMENTED', {
         boardId: event.boardId,
         taskId: event.taskId,
         colId: event.colId,
         actorId: event.actorId
      })

      console.log(`TASK_COMMENTED sent to board:${event.boardId}`);
   }

   private handleTaskMoved(event: WorkspaceEvents['TASK_MOVED']) {
      this.gateway.board(event.boardId, 'TASK_MOVED', {
         boardId: event.boardId,
         taskId: event.task.id,
         colId: event.task.colId,
         actorId: event.actorId
      })

      console.log(`TASK_MOVED sent to board:${event.boardId}`);
   }
}
