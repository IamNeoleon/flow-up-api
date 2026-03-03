import { IsString } from 'class-validator';

export class PresignImageUploadDto {
   @IsString()
   mimeType: string;
}

export class CompleteImageUploadDto {
   @IsString()
   key: string
}