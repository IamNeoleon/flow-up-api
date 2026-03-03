import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate {
   constructor(private jwtService: JwtService) { }

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const client: Socket = context.switchToWs().getClient();

      const token =
         client.handshake.auth?.token ||
         client.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
         throw new WsException("unauthorized");
      }

      try {
         const payload = this.jwtService.verify(token);
         client.data.user = payload;
         return true;
      } catch (e) {
         console.log("WsJwtGuard verify error:", e);
         throw new WsException("unauthorized");
      }
   }
}
