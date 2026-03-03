export interface BoardEvents {
   'board.updated': { boardId: string, authorId: string };
   'board.deleted': { boardId: string, authorId: string };
   'task.created': { boardId: string; colId: string; authorId: string };
   'task.deleted': { boardId: string; colId: string; authorId: string };
   'task.updated': { boardId: string; colId: string; taskId: string, authorId: string };
   'task.move': { boardId: string; authorId: string };
}
