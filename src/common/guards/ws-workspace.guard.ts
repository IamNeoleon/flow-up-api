import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { AccessContextResolver } from "src/modules/access-context-resolver/access-context-resolver";

@Injectable()
export class WsWorkspaceGuard implements CanActivate {
   constructor(private readonly resolver: AccessContextResolver) { }

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const client: Socket = context.switchToWs().getClient();
      const data = context.switchToWs().getData();

      const userId = client.data.user.sub;

      if (!userId) {
         console.log("❌ No user in socket");
         throw new WsException("Нет доступа: пользователь не найден");
      }

      const { workspaceId, boardId, colId, taskId } = data ?? {};

      const accessContext = await this.resolver.resolve(userId, {
         workspaceId,
         boardId,
         colId,
         taskId,
      })

      if (!accessContext) {
         throw new WsException("Нет доступа");
      }

      client.data.workspaceRole = accessContext.workspaceRole;

      return true;
   }
}