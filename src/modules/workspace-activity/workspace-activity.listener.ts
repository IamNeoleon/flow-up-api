import { Injectable } from "@nestjs/common";
import { WorkspaceEvents } from "src/modules/workspace/types/workspace-events.types";
import { TypedEventEmitter } from "src/modules/events/typed-event-emitter";
import { AppWsEmitter } from "src/modules/app-ws/app-ws-emitter.service";

@Injectable()
export class WorkspaceActivityListener {
   constructor(
      private readonly gateway: AppWsEmitter,
      private readonly emitter: TypedEventEmitter<WorkspaceEvents>,
   ) {
      this.registerEvents()
   }

   private registerEvents() {
      this.emitter.on('TASK_CREATED', (event) => this.emitUpdate(event.workspaceId));
      this.emitter.on('TASK_MOVED', (event) => this.emitUpdate(event.workspaceId));
      this.emitter.on('TASK_DELETED', (event) => this.emitUpdate(event.workspaceId));
      this.emitter.on('COLUMN_CREATED', (event) => this.emitUpdate(event.workspaceId));
      this.emitter.on('COLUMN_DELETED', (event) => this.emitUpdate(event.workspaceId));
      this.emitter.on('USER_JOINED', (event) => this.emitUpdate(event.workspaceId));
      this.emitter.on('USER_LEFT', (event) => this.emitUpdate(event.workspaceId));
   }

   private emitUpdate(workspaceId: string) {
      this.gateway.workspace(workspaceId, 'WORKSPACE_UPDATED', {
         workspaceId: workspaceId,
      })

      console.log(`WORKSPACE_UPDATED sent to workspace:${workspaceId}`);
   }
}
