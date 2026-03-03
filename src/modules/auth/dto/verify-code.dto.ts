import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class VerifyCodeDto {
   @IsNotEmpty()
   @IsString()
   @MaxLength(6)
   code: string
}
