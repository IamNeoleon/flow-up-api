import { IsNotEmpty, IsString } from "class-validator";

export class CreateSubTaskDto {
   @IsString()
   @IsNotEmpty()
   title: string
}