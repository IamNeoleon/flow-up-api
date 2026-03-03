import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UserService } from 'src/modules/user/user.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { type Request, type Response } from 'express';
import * as argon2 from 'argon2'
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { generateUsername } from 'src/common/utils/generate-username';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService
	) { }

	private async createUserWithUsername(args: { email: string, displayName: string }, tx: PrismaClient | Prisma.TransactionClient) {
		const { email, displayName } = args

		for (let attempt = 1; attempt <= 3; attempt++) {
			const username = generateUsername(displayName);

			try {
				const user = await tx.user.create({
					data: {
						fullName: displayName,
						username,
						email
					},
				});

				console.log('✅ User created:', user);
				return user;
			} catch (err: any) {
				if (err.code === 'P2002' && err.meta?.target?.includes('username')) {
					console.warn(`⚠️ Попытка #${attempt}: username уже существует, пробуем другой`);
					continue;
				}

				throw err;
			}
		}

		throw new Error('❌ Не удалось создать пользователя после 3 попыток');
	}

	async rotateTokens(user: Express.User, res: Response) {
		const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
		const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
		const accessTtl = (this.configService.get<string>('JWT_ACCESS_TTL') ?? '10m') as JwtSignOptions['expiresIn'];
		const refreshTtl = (this.configService.get<string>('JWT_REFRESH_TTL') ?? '7d') as JwtSignOptions['expiresIn'];

		const session = await this.prismaService.authSession.findUnique({ where: { id: user.sessionId } });
		if (!session || session.revokedAt) throw new UnauthorizedException('Session revoked');
		if (session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('Session expired');

		const accessToken = await this.jwtService.signAsync(
			{ sub: user.id, sid: user.sessionId, type: 'access' },
			{ secret: accessSecret, expiresIn: accessTtl },
		);

		const refreshToken = await this.jwtService.signAsync(
			{ sub: user.id, sid: user.sessionId, type: 'refresh', jti: randomUUID() },
			{ secret: refreshSecret, expiresIn: refreshTtl },
		);

		const refreshTokenHash = await argon2.hash(refreshToken);

		await this.prismaService.authSession.update({
			where: { id: user.sessionId },
			data: {
				refreshTokenHash,
				lastUsedAt: new Date(),
			},
		});

		res.cookie('refresh_token', refreshToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return { accessToken };
	}

	async register(dto: CreateUserDto, req: Request, res: Response) {
		const email = dto.email.trim().toLowerCase()

		const existing = await this.prismaService.user.findUnique({ where: { email } });
		if (existing) throw new ConflictException('Такой email уже используется');

		const hashedPassword = await argon2.hash(dto.password)

		const user = await this.prismaService.user.create({
			data: {
				email,
				password: hashedPassword,
				username: dto.username,
				fullName: dto.fullName
			}
		})

		const session = await this.prismaService.authSession.create({
			data: {
				userId: user.id,
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				ip: req.ip,
				userAgent: req.headers['user-agent'],
				lastUsedAt: new Date(),
				refreshTokenHash: 'tmp',
			},
		});

		return this.rotateTokens({ id: user.id, sessionId: session.id }, res)
	}

	async login(dto: LoginDto, req: Request, res: Response) {
		const { email, password } = dto

		const user = await this.userService.findByEmail(email)

		if (!user || !password || !user.password) throw new UnauthorizedException('Неверный логин или пароль')

		const isValid = await argon2.verify(user.password, password)
		if (!isValid) throw new UnauthorizedException('Неверный логин или пароль')

		const session = await this.prismaService.authSession.create({
			data: {
				userId: user.id,
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				ip: req.ip,
				userAgent: req.headers['user-agent'],
				lastUsedAt: new Date(),
				refreshTokenHash: 'tmp',
			},
		});

		return this.rotateTokens({ id: user.id, sessionId: session.id }, res)
	}

	async validateGoogleUser(args: {
		providerAccountId: string;
		email: string,
		displayName: string
	}) {
		const { providerAccountId, email, displayName } = args

		const byOauth = await this.prismaService.oAuthAccount.findUnique({
			where: { provider_providerAccountId: { provider: 'GOOGLE', providerAccountId } },
			include: { user: true },
		});
		if (byOauth) return byOauth.user;

		const byEmail = await this.prismaService.user.findUnique({ where: { email } });
		if (byEmail) {
			await this.prismaService.oAuthAccount.create({
				data: { provider: 'GOOGLE', providerAccountId, userId: byEmail.id },
			});
			return byEmail;
		}

		return this.prismaService.$transaction(async (tx) => {
			const created = await this.createUserWithUsername({ displayName, email }, tx)

			await tx.oAuthAccount.create({
				data: { provider: 'GOOGLE', providerAccountId, userId: created.id },
			});
			return created;
		});
	}

	async loginGoogle(userId: string, res: Response) {
		const user = await this.prismaService.user.findUnique({
			where: {
				id: userId
			}
		})

		if (!user) throw new NotFoundException()

		const session = await this.prismaService.authSession.create({
			data: {
				userId: user.id,
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				lastUsedAt: new Date(),
				refreshTokenHash: 'tmp',
			},
		});

		return this.rotateTokens({ id: user.id, sessionId: session.id }, res);
	}

	async logout(args: { userId: string, sid: string }) {
		const { userId, sid } = args

		return this.prismaService.authSession.delete({
			where: {
				userId,
				id: sid
			}
		})
	}
}
