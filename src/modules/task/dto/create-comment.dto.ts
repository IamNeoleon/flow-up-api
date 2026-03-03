import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateCommentDto {
   @IsString()
   @IsNotEmpty()
   @MaxLength(3000)
   content: string
}