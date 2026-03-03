import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateWorkspaceDto {
   @IsNotEmpty()
   @IsString()
   @MaxLength(100)
   name: string

   @IsOptional()
   @IsNotEmpty()
   @IsString()
   @MaxLength(100)
   icon?: string

   @IsOptional()
   @IsNotEmpty()
   @IsBoolean()
   isArchived?: boolean

   @IsOptional()
   @IsString()
   @MaxLength(500)
   description?: string
}