import {
   Injectable,
   NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { R2Service } from 'src/modules/r2/r2.service';

@Injectable()
export class BoardImageService {
   constructor(
      private readonly prismaService: PrismaService,
      private readonly r2: R2Service,
      private readonly config: ConfigService
   ) { }

   private extractKeyFromPublicUrl(url: string): string {
      const { pathname } = new URL(url);
      return pathname.replace(/^\/+/, "");
   }

   private publicBucket() {
      const b = this.config.get<string>('R2_PUBLIC_BUCKET');
      if (!b) throw new Error('Missing R2_PUBLIC_BUCKET');
      return b;
   }

   private avatarKey(boardId: string, mimeType: string) {
      const ext =
         mimeType === "image/png" ? "png" :
            mimeType === "image/jpeg" ? "jpg" :
               mimeType === "image/webp" ? "webp" : "bin";

      return `board-images/${boardId}/${randomUUID()}.${ext}`;
   }

   async presignImageUpload(boardId: string, mimeType: string) {
      const board = await this.prismaService.board.findUnique({
         where: { id: boardId },
         select: {
            imageUrl: true
         }
      })

      if (!board) {
         throw new NotFoundException('Board not found')
      }

      const key = this.avatarKey(boardId, mimeType);

      const { url } = await this.r2.presignUpload({
         bucket: this.publicBucket(),
         key,
         contentType: mimeType || 'application/octet-stream',
         expiresInSeconds: 300,
      });

      const publicUrl = this.r2.publicUrlForKey(key);

      return { uploadUrl: url, publicUrl, key, method: 'PUT' as const };
   }

   async completeImageUpload(boardId: string, key: string) {
      await this.r2.headObject(key, this.publicBucket());

      const publicUrl = this.r2.publicUrlForKey(key);

      const board = await this.prismaService.board.findUnique({
         where: { id: boardId },
         select: { imageUrl: true },
      });

      if (!board) throw new NotFoundException('Board not found');

      const updated = await this.prismaService.board.update({
         where: { id: boardId },
         data: { imageUrl: publicUrl },
         select: { id: true, imageUrl: true },
      });

      if (board.imageUrl) {
         try {
            const oldKey = this.extractKeyFromPublicUrl(board.imageUrl);
            await this.r2.deleteObject(oldKey, this.publicBucket());
         } catch { }
      }

      return updated;
   }
}
