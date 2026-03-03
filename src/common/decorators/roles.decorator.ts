import { SetMetadata } from "@nestjs/common"

export const ROLES_KEY = 'roles'
export const Roles = (...roles: ('OWNER' | 'EDITOR' | 'MEMBER')[]) => SetMetadata(ROLES_KEY, roles);
