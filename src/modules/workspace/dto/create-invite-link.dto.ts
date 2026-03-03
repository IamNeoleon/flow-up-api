import { IsNumber, IsString } from "class-validator";

export class CreateInviteLinkDto {
   @IsString()
   role: 'MEMBER' | 'EDITOR'
   @IsNumber()
   expiresIn: number
}