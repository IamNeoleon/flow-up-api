export type NotificationMetaMap = {
   DEADLINE_SOON: {
      taskId: string,
      colId: string,
      taskName: string
      dueAt: string,
      boardId: string,
      workspaceId: string
   },
   DEADLINE_OVERDUE: {
      taskId: string,
      colId: string,
      taskName: string
      dueAt: string,
      boardId: string,
      workspaceId: string
   },
   STATUS_CHANGE: {
      colId: string,
      taskId: string,
      taskName: string,
      newStatus: string,
      boardId: string,
      workspaceId: string
   },
   ADD_ASSIGMENT: {
      colId: string,
      taskId: string,
      taskName: string,
      boardId: string,
      workspaceId: string
   },
   REMOVE_ASSIGMENT: {
      colId: string,
      taskId: string,
      taskName: string,
      boardId: string,
      workspaceId: string
   },
   COMMENT_MENTION: {
      colId: string,
      taskId: string,
      taskName: string,
      actorId: string,
      boardId: string,
      workspaceId: string
   }
};

export type Notification = {
   [K in keyof NotificationMetaMap]: {
      id: string;
      userId: string;
      type: K;
      metadata: NotificationMetaMap[K];
      sourceId: string;
      read: boolean;
      createdAt: Date;
   };
}[keyof NotificationMetaMap];

export type CreateNotificationArgs<T extends keyof NotificationMetaMap> = {
   type: T;
   userId: string;
   sourceId: string;
   metadata: NotificationMetaMap[T];
};
