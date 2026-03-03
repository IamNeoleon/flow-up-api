import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateColumnDto {
   @IsString()
   @IsNotEmpty()
   name: string

   @IsString()
   @IsNotEmpty()
   status: 'TODO' | 'IN_PROGRESS' | 'DONE'

   @IsOptional()
   @IsString()
   @MaxLength(7)
   color?: string
}