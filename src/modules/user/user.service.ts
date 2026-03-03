import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { R2Service } from '../r2/r2.service';
import { ConfigService } from '@nestjs/config';
import { ALLOWED_MIME_TYPES } from './constants/allowed-mime-types-avatar';
import { randomUUID } from "crypto";
import { ChangeNameDto } from './dto/change-name.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as argon2 from 'argon2'

@Injectable()
export class UserService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly r2: R2Service,
		private readonly config: ConfigService,
	) { }

	async getMe(userId: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				id: userId
			},
			select: {
				id: true,
				username: true,
				fullName: true,
				avatar: true,
				email: true,
				oauthAccounts: {
					select: {
						provider: true
					}
				}
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		return user
	}

	async changeName(args: { userId: string, dto: ChangeNameDto }) {
		const { userId, dto } = args

		return this.prismaService.user.update({
			where: {
				id: userId
			},
			data: {
				fullName: dto.name
			}
		})
	}

	async changePassword(args: { userId: string, dto: ChangePasswordDto }) {
		const { userId, dto } = args
		const { oldPassword, newPassword } = dto

		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				password: true
			}
		})

		if (!user) throw new NotFoundException('User not found')
		if (!user.password) throw new ConflictException('The user does not have a password')

		const isValid = await argon2.verify(user.password, oldPassword)

		if (!isValid) throw new ConflictException('Incorrect credentials')

		const newHashedPassword = await argon2.hash(newPassword)

		return this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				password: newHashedPassword
			}
		})
	}

	async findByEmail(email: string) {
		return this.prismaService.user.findUnique({
			where: { email }
		})
	}

	private extractKeyFromPublicUrl(url: string): string {
		const { pathname } = new URL(url);
		return pathname.replace(/^\/+/, "");
	}

	private publicBucket() {
		const b = this.config.get<string>('R2_PUBLIC_BUCKET');
		if (!b) throw new Error('Missing R2_PUBLIC_BUCKET');
		return b;
	}

	private avatarKey(userId: string, mimeType: string) {
		const ext =
			mimeType === "image/png" ? "png" :
				mimeType === "image/jpeg" ? "jpg" :
					mimeType === "image/webp" ? "webp" : "bin";

		return `avatars/${userId}/${randomUUID()}.${ext}`;
	}

	async presignAvatarUpload(userId: string, mimeType: string) {
		if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
			throw new ConflictException('Формат изображений должен быть .png, .jpg, .webp')
		}

		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			select: {
				avatar: true
			}
		})

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		const key = this.avatarKey(userId, mimeType);

		const { url } = await this.r2.presignUpload({
			bucket: this.publicBucket(),
			key,
			contentType: mimeType || 'application/octet-stream',
			expiresInSeconds: 300,
		});

		const publicUrl = this.r2.publicUrlForKey(key);

		return { uploadUrl: url, publicUrl, key, method: 'PUT' as const };
	}

	async completeAvatarUpload(userId: string, key: string) {
		await this.r2.headObject(key, this.publicBucket());

		const publicUrl = this.r2.publicUrlForKey(key);

		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			select: { avatar: true },
		});

		if (!user) throw new NotFoundException('Пользователь не найден');

		const updated = await this.prismaService.user.update({
			where: { id: userId },
			data: { avatar: publicUrl },
			select: { id: true, avatar: true },
		});

		if (user.avatar) {
			try {
				const oldKey = this.extractKeyFromPublicUrl(user.avatar);
				await this.r2.deleteObject(oldKey, this.publicBucket());
			} catch { }
		}

		return updated;
	}
}
