import { BoardRoles } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeMemberRoleDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  targetUserId: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  targetRole: BoardRoles | 'VIEWER';
}
