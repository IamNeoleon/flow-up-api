import { TWorkspaceRole } from "src/common/types/workspaceRole";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

export interface TaskCreateArgs {
   boardId: string,
   colId: string,
   userId: string,
   workspaceId: string,
   workspaceRole: TWorkspaceRole
   dto: CreateTaskDto,
}

export interface TaskUpdateArgs {
   workspaceId: string,
   workspaceRole: TWorkspaceRole
   boardId: string,
   colId: string,
   taskId: string,
   userId: string,
   dto: UpdateTaskDto
}