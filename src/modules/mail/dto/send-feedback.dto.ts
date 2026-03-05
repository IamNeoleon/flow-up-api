import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class SendFeedbackDto {
   @IsNotEmpty()
   @IsEmail()
   @MaxLength(100)
   email: string

   @IsNotEmpty()
   @IsString()
   @MinLength(10)
   @MaxLength(2000)
   message: string
}