type BoardRole = 'OWNER' | 'EDITOR' | 'VIEWER' | null
type WorkspaceRole = 'OWNER' | 'EDITOR' | 'MEMBER'

export type PermissionContext = {
   workspaceRole?: WorkspaceRole
   boardRole?: BoardRole
   isAssignee?: boolean
}