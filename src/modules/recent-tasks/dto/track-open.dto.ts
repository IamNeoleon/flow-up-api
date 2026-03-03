import { IsNotEmpty, IsString } from "class-validator";

export class TrackOpenDto {
   @IsString()
   @IsNotEmpty()
   taskId: string
}