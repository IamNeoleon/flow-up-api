import { Prisma, WorkspaceActivityType } from "@prisma/client";

export interface ICreateActivityBody {
   workspaceId: string,
   actorId: string,
   entityId: string,
   type: WorkspaceActivityType,
   metadata?: Prisma.InputJsonValue
}