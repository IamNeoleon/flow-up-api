import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class MoveTaskDto {
   @IsNotEmpty()
   @IsString()
   targetColId: string;
   @IsNotEmpty()
   @IsNumber()
   newOrder: number
}