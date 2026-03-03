import { IsInt, IsString, Min } from 'class-validator';

export class PresignTaskAttachmentUploadDto {
   @IsString()
   fileName: string;

   @IsString()
   mimeType: string;

   @IsInt()
   @Min(1)
   size: number;
}
