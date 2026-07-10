import { WorkspaceRoles } from '@prisma/client';

export type PermissionContext = {
    workspaceRole?: WorkspaceRoles;
    isAssignee?: boolean;
};
