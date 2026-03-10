import { Column } from "@prisma/client";

export type TBoardTemplateLabel = 'default';

export interface IBoardTemplateConfig {
   columns: Pick<Column, 'name' | 'color' | 'status'>[]
}