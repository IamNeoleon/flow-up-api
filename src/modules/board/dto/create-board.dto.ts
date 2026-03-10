import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { TBoardTemplateLabel } from '../types/board-template';

export class CreateBoardDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  template?: TBoardTemplateLabel;
}