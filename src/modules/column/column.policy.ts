import { PermissionContext } from "../../common/types/permissions";

export const canCreateColumn = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   return false
}

export const canUpdateColumn = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   return false
}

export const canDeleteColumn = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'OWNER' || ctx.boardRole === 'EDITOR')
      return true
   return false
}

export const canMoveColumn = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   return false
}