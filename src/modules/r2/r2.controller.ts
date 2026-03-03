import { Controller, Get, Query } from '@nestjs/common';
import { R2Service } from './r2.service';

@Controller('r2')
export class R2Controller {
   constructor(private readonly r2: R2Service) { }

   @Get('presign-upload')
   presignUpload(@Query('key') key: string, @Query('type') type: string) {
      return this.r2.presignUpload({ key, contentType: type });
   }
}
