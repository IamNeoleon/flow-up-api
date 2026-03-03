import { PermissionContext } from "../../common/types/permissions";

export const canCreateBoard = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER' || ctx.workspaceRole === 'EDITOR')
      return true
   return false
}

export const canEditBoard = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   return false
}

export const canDeleteBoard = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'OWNER')
      return true
   return false
}

export const canChangeBoardMember = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'OWNER')
      return true
   return false
}