import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
   constructor(
      private mailer: MailerService,
      private readonly prismaService: PrismaService
   ) { }

   private escapeHtml(input: string) {
      return input
         .replaceAll("&", "&amp;")
         .replaceAll("<", "&lt;")
         .replaceAll(">", "&gt;")
         .replaceAll('"', "&quot;")
         .replaceAll("'", "&#039;");
   }

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

   async sendFeedback(args: { email: string; message: string }) {
      const email = args.email.trim().toLowerCase();
      const message = args.message.trim();
      const to = process.env.FEEDBACK_TO ?? process.env.MAIL_USER;

      if (!to) throw new BadRequestException("Не настроен адрес получателя FEEDBACK_TO/MAIL_USER");

      try {
         await this.mailer.sendMail({
            to,
            subject: "Flow Up — Feedback",
            replyTo: email,
            html: `
               <h2>New feedback</h2>
               <p><strong>From:</strong> ${email}</p>
               <hr />
               <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
                  ${this.escapeHtml(message)}
               </p>
            `,
         });

         return { status: 200, message: "Sended" };
      } catch (error) {
         return { status: 500, message: "Error send", error: error?.message ?? String(error) };
      }
   }
}