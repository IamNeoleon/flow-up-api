import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import { type Request } from "express";

export const WorkspaceContext = createParamDecorator(
   (_: unknown, ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest<Request>();

      if (!req.workspace) {
         throw new InternalServerErrorException(
            'Workspace context not found (WorkspaceGuard missing)',
         );
      }

      return req.workspace
   },
);
