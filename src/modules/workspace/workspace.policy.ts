import { PermissionContext } from "src/common/types/permissions"

export const canGetActions = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole)
      return true
   return false
}

export const canUpdateWorkspace = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER' || ctx.workspaceRole === 'EDITOR')
      return true
   return false
}


export const canDeleteWorkspace = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   return false
}

export const canCreateInvite = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER' || ctx.workspaceRole === 'EDITOR')
      return true
   return false
}

export const canChangeMemberRole = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   return false
}


export const canDeleteMember = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   return false
}