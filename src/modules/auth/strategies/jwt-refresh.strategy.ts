import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { TJwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
   constructor(
      private readonly config: ConfigService,
      private readonly prisma: PrismaService,
   ) {
      super({
         jwtFromRequest: ExtractJwt.fromExtractors([
            (req: Request) => {
               return req?.cookies?.refresh_token
            },
         ]),
         secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
         passReqToCallback: true
      });
   }

   async validate(req: Request, payload: TJwtPayload) {
      if (payload.type !== 'refresh') throw new UnauthorizedException('Wrong token type')

      const token = req.cookies?.refresh_token;
      if (!token) throw new UnauthorizedException('No refresh token');

      const session = await this.prisma.authSession.findUnique({
         where: { id: payload.sid },
      });

      if (!session || session.revokedAt) {
         throw new UnauthorizedException('Session revoked');
      }

      if (session.expiresAt.getTime() <= Date.now()) {
         throw new UnauthorizedException('Session expired');
      }

      const ok = await argon2.verify(session.refreshTokenHash, token);
      if (!ok) {
         await this.prisma.authSession.update({
            where: { id: payload.sid },
            data: { revokedAt: new Date() },
         });
         throw new UnauthorizedException('Refresh reuse detected');
      }

      return {
         id: payload.sub,
         sessionId: payload.sid,
      };
   }
}
