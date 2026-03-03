import { WorkspaceRoles } from "src/modules/workspace/constants/workspace.roles"

type BoardRole = 'OWNER' | 'EDITOR' | null
type WorkspaceRole = 'OWNER' | 'EDITOR' | 'MEMBER'

export type PermissionContext = {
   workspaceRole: WorkspaceRole
   boardRole: BoardRole
   isAssignee: boolean
}