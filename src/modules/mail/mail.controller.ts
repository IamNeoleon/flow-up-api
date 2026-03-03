import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { User } from 'src/common/decorators/user.decorator';
import { VerifyCodeDto } from '../auth/dto/verify-code.dto';

@UseGuards(JwtAuthGuard)
@Controller('mail')
export class MailController {
   constructor(private readonly mailService: MailService) { }

   @Post('send-code')
   async sendCode(@User() user: Express.User) {
      return this.mailService.sendVerificationCode(user.id);
   }

   @Post('verify-code')
   async verifyCode(@User() user: Express.User, @Body() dto: VerifyCodeDto) {
      return this.mailService.verifyCode(user.id, dto.code);
   }
}
