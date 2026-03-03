import { Column, Task, User, WorkspaceActivityType } from "@prisma/client";

export type WorkspaceEvents = {
   [WorkspaceActivityType.TASK_CREATED]: {
      workspaceId: string;
      boardId: string;
      actorId: string;
      task: Task
   },
   [WorkspaceActivityType.TASK_MOVED]: {
      workspaceId: string;
      boardId: string;
      actorId: string;
      task: Task
   },
   'TASK_UPDATED': {
      colId: string;
      boardId: string;
      actorId: string;
      taskId: string
   },
   'TASK_COMMENTED': {
      colId: string;
      boardId: string;
      actorId: string;
      taskId: string
   },
   [WorkspaceActivityType.TASK_DELETED]: {
      workspaceId: string;
      boardId: string;
      actorId: string;
      colId: string,
      task: Task
   },
   [WorkspaceActivityType.COLUMN_CREATED]: {
      workspaceId: string;
      boardId: string;
      actorId: string;
      column: Column
   },
   [WorkspaceActivityType.COLUMN_DELETED]: {
      workspaceId: string;
      boardId: string;
      actorId: string;
      column: Column
   },
   [WorkspaceActivityType.USER_JOINED]: {
      workspaceId: string;
      boardId: string;
      actorId: string;
      user: User
   },
   [WorkspaceActivityType.USER_LEFT]: {
      workspaceId: string;
      boardId: string;
      actorId: string;
      user: User
   },
}

