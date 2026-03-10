import { TBoardTemplateLabel, IBoardTemplateConfig } from "../types/board-template";

export const BOARD_TEMPLATES: Record<TBoardTemplateLabel, IBoardTemplateConfig> = {
   default: {
      columns: [
         {
            name: "To Do",
            status: 'TODO',
            color: "#64748b"
         },
         {
            name: "In Progress",
            status: "IN_PROGRESS",
            color: "#3b82f6"
         },
         {
            name: "Done",
            status: 'DONE',
            color: "#22c55e"
         }
      ]
   }
}