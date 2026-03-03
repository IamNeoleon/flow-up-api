import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { TJwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
		});
	}

	async validate(payload: TJwtPayload) {
		if (payload.type !== 'access') throw new UnauthorizedException('Wrong token type')

		const session = await this.prisma.authSession.findUnique({ where: { id: payload.sid } });
		if (!session || session.revokedAt) throw new UnauthorizedException('Session revoked');
		if (session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('Session expired');

		return { id: payload.sub, sessionId: payload.sid };
	}
}
