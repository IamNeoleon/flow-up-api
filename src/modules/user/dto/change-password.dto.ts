import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
   @IsString()
   @IsNotEmpty()
   @MinLength(6)
   @MaxLength(250)
   oldPassword: string;

   @IsString()
   @IsNotEmpty()
   @MinLength(8)
   @MaxLength(250)
   newPassword: string;
}