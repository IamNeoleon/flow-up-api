import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

export function getToken(client: Socket) {
   return (
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.toString()?.replace("Bearer ", "")
   );
}

export function attachUser(client: Socket, jwt: JwtService) {
   const token = getToken(client);
   if (!token) throw new WsException("unauthorized");

   const payload = jwt.verify(token);
   client.data.user = payload;
}
