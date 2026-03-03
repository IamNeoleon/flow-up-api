import { PermissionContext } from "../../common/types/permissions";

export const canEditTask = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   if (ctx.isAssignee)
      return true
   return false
}

export const canDeleteTask = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true

   return false
}

export const canCreateTask = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true

   return false
}

export const canMoveTask = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   if (ctx.isAssignee)
      return true

   return false
}

export const canCreateComment = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   if (ctx.isAssignee)
      return true

   return false
}

export const canEditComment = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true
   if (ctx.isAssignee)
      return true

   return false
}

export const canDeleteComment = (ctx: PermissionContext): boolean => {
   if (ctx.workspaceRole === 'OWNER')
      return true
   if (ctx.boardRole === 'EDITOR' || ctx.boardRole === 'OWNER')
      return true

   return false
}

