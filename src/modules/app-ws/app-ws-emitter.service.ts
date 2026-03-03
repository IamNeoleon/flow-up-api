import { Injectable } from "@nestjs/common";
import { AppWsGateway } from "./app-ws.gateway";
import { Server } from 'socket.io';

@Injectable()
export class AppWsEmitter {
   constructor(private readonly gateway: AppWsGateway) { }

   private get io(): Server | null {
      return this.gateway.server ?? null;
   }

   user(userId: string, event: string) {
      if (!this.io) return;
      this.io.to(`user:${userId}`).emit(event);
      console.log('send user notification')
   }

   workspace(workspaceId: string, event: string, payload: any) {
      this.gateway.server.to(`workspace:${workspaceId}`).emit(event, payload);
   }

   board(boardId: string, event: string, payload: any) {
      this.gateway.server.to(`board:${boardId}`).emit(event, payload);
   }
}
