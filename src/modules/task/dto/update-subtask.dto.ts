import { PartialType } from "@nestjs/mapped-types";
import { CreateSubTaskDto } from "./create-subtask.dto";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateSubTaskDto {
   @IsOptional()
   @IsString()
   title?: string;
   @IsOptional()
   @IsBoolean()
   completed?: boolean
}