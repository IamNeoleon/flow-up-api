import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class VerifiedGuard implements CanActivate {
   constructor(
      private readonly prismaService: PrismaService
   ) { }

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const req: Request = context.switchToHttp().getRequest();

      if (!req.user || !req.user.id) {
         throw new ForbiddenException('Forbidden');
      }

      const userId = req.user.id;

      const user = await this.prismaService.user.findUnique({
         where: { id: userId },
         select: {
            isEmailVerified: true
         }
      })

      if (!user || user.isEmailVerified === false) {
         throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Email is not verified',
         });
      }

      return true;
   }
}
