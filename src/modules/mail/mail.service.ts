import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
   constructor(
      private mailer: MailerService,
      private readonly prismaService: PrismaService
   ) { }

   async sendVerificationCode(userId: string) {
      const user = await this.prismaService.user.findUnique({
         where: {
            id: userId
         },
         select: {
            email: true,
            isEmailVerified: true
         }
      })

      if (!user) throw new NotFoundException()

      if (user.isEmailVerified === true) {
         throw new ConflictException("User is already verified")
      }

      const { email } = user

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.prismaService.verificationCode.upsert({
         where: { email },
         update: { code, expiresAt, attempts: 0 },
         create: { email, code, expiresAt },
      });

      try {
         await this.mailer.sendMail({
            to: email,
            subject: 'Код подтверждения',
            html: `
               <h2>Email Confirm</h2>
               <p>Your code: <strong style="font-size: 24px">${code}</strong></p>
               <p>The code is valid for 10 minutes</p>
            `,
         });
         return { status: 200, message: 'Письмо отправлено' };
      } catch (error) {
         return { status: 500, message: 'Ошибка отправки', error: error.message };
      }
   }

   async verifyCode(userId: string, code: string) {
      const user = await this.prismaService.user.findUnique({
         where: {
            id: userId
         },
         select: {
            email: true
         }
      })

      if (!user) throw new NotFoundException()

      const { email } = user

      const record = await this.prismaService.verificationCode.findUnique({
         where: { email },
      });

      if (!record) {
         throw new BadRequestException('Сначала запросите код');
      }

      if (record.attempts >= 3) {
         throw new BadRequestException('Слишком много попыток, запросите новый код');
      }

      if (new Date() > record.expiresAt) {
         throw new BadRequestException('Код истёк, запросите новый');
      }

      if (record.code !== code) {
         await this.prismaService.verificationCode.update({
            where: { email },
            data: { attempts: { increment: 1 } },
         });
         throw new BadRequestException(`Неверный код, осталось попыток: ${2 - record.attempts}`);
      }

      await this.prismaService.user.update({
         where: { email },
         data: {
            isEmailVerified: true
         }
      })

      await this.prismaService.verificationCode.delete({ where: { email } });

      return { message: 'Email verified' };
   }
}