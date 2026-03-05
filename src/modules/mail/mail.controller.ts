import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { User } from 'src/common/decorators/user.decorator';
import { VerifyCodeDto } from '../auth/dto/verify-code.dto';
import { SendFeedbackDto } from './dto/send-feedback.dto';

@Controller('mail')
export class MailController {
   constructor(private readonly mailService: MailService) { }

   @UseGuards(JwtAuthGuard)
   @Post('send-code')
   async sendCode(@User() user: Express.User) {
      return this.mailService.sendVerificationCode(user.id);
   }

   @UseGuards(JwtAuthGuard)
   @Post('verify-code')
   async verifyCode(@User() user: Express.User, @Body() dto: VerifyCodeDto) {
      return this.mailService.verifyCode(user.id, dto.code);
   }

   @Post('send-feedback')
   async sendFeedback(@Body() dto: SendFeedbackDto) {
      return this.mailService.sendFeedback({ email: dto.email, message: dto.message })
   }
}