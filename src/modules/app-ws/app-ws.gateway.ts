import { UseGuards } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/common/guards/ws-jwt.guard';
import { WsWorkspaceGuard } from 'src/common/guards/ws-workspace.guard';
import { attachUser } from './utils/ws-auth.utils';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
	namespace: '/ws',
	cors: {
		origin: [
			'http://localhost:5173',
			'http://localhost:4173'
		],
		credentials: true,
		methods: ['GET', 'POST'],
	},
})

export class AppWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(private readonly jwtService: JwtService) { }

	@WebSocketServer()
	server: Server;

	afterInit(server: Server) {
		server.use((client, next) => {
			try {
				attachUser(client as Socket, this.jwtService);
				console.log(
					`[WS AUTH OK] socket=${(client as Socket).id} user=${(client as Socket).data.user?.sub}`
				);
				next();
			} catch (e) {
				next(e as Error);
			}
		});
	}

	handleConnection(client: Socket) {
		const userId = client.data.user?.sub;

		if (!userId) {
			console.warn(`[WS CONNECT BLOCKED] socket=${client.id}`);
			client.disconnect(true);
			return;
		}

		client.join(`user:${userId}`);

		console.log(
			`[WS CONNECTED] socket=${client.id} user=${userId} joined=user:${userId}`
		);
	}

	handleDisconnect(client: Socket) {
		const userId = client.data.user?.sub;
		console.log(
			`[WS DISCONNECTED] socket=${client.id} user=${userId}`
		);
	}

	@UseGuards(WsWorkspaceGuard)
	@SubscribeMessage('JOIN_WORKSPACE_ROOM')
	joinWorkspace(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { workspaceId: string }
	) {
		if (!data?.workspaceId) return;

		const room = `workspace:${data.workspaceId}`;
		client.join(room);

		console.log(
			`[WS JOIN] socket=${client.id} user=${client.data.user?.sub} room=${room}`
		);
	}

	@UseGuards(WsWorkspaceGuard)
	@SubscribeMessage('LEAVE_WORKSPACE_ROOM')
	leaveWorkspace(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { workspaceId: string }
	) {
		if (!data?.workspaceId) return;

		const room = `workspace:${data.workspaceId}`;
		client.leave(room);

		console.log(
			`[WS LEAVE] socket=${client.id} user=${client.data.user?.sub} room=${room}`
		);
	}

	@UseGuards(WsWorkspaceGuard)
	@SubscribeMessage('JOIN_BOARD_ROOM')
	joinBoard(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { boardId: string }
	) {
		if (!data?.boardId) return;

		const room = `board:${data.boardId}`;
		client.join(room);

		console.log(
			`[WS JOIN] socket=${client.id} user=${client.data.user?.sub} room=${room}`
		);
	}

	@UseGuards(WsWorkspaceGuard)
	@SubscribeMessage('LEAVE_BOARD_ROOM')
	leaveBoard(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { boardId: string }
	) {
		if (!data?.boardId) return;

		const room = `board:${data.boardId}`;
		client.leave(room);

		console.log(
			`[WS LEAVE] socket=${client.id} user=${client.data.user?.sub} room=${room}`
		);
	}
}
