import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { AccessContextResolver, AccessContext } from 'src/modules/access-context-resolver/access-context-resolver';

@Injectable()
export class WorkspaceGuard implements CanActivate {
	constructor(private readonly resolver: AccessContextResolver) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req: Request = context.switchToHttp().getRequest();

		if (!req.user || !req.user.id) {
			throw new ForbiddenException('Нет доступа');
		}

		const userId = req.user.id;
		const { workspaceId, boardId, colId, taskId } = req.params;

		const accessContext: AccessContext | null = await this.resolver.resolve(userId, {
			workspaceId,
			boardId,
			colId,
			taskId
		});

		if (!accessContext) {
			throw new ForbiddenException('Нет доступа или ресурс не найден');
		}

		req.workspace = {
			workspaceId: accessContext.workspaceId,
			workspaceRole: accessContext.workspaceRole
		};

		return true;
	}
}
