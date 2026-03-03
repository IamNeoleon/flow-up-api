import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateTaskDto {
   @IsString()
   @IsNotEmpty()
   name: string

   @IsOptional()
   @IsString()
   description: string

   @IsOptional()
   @Type(() => Date)
   @IsDate()
   dueDate?: Date

   @IsOptional()
   @IsString()
   priorityId?: string

   @IsOptional()
   @IsString()
   assigneeId?: string
}