import { IsString } from 'class-validator';

export class PresignAvatarUploadDto {
   @IsString()
   mimeType: string;
}

export class CompleteAvatarUploadDto {
   @IsString()
   key: string
}
