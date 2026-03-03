import { IsEnum, IsString } from "class-validator";

export class ChangeRoleDto {
   @IsString()
   @IsEnum(['EDITOR', 'MEMBER', 'OWNER'], { message: 'Role must be either EDITOR, MEMBER, OWNER' })
   role: 'EDITOR' | 'MEMBER' | 'OWNER'
}