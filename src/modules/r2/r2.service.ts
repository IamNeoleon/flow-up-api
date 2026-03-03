import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
   S3Client,
   PutObjectCommand,
   GetObjectCommand,
   DeleteObjectCommand,
   HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2Service {
   private readonly s3: S3Client;
   private readonly defaultBucket: string;

   constructor(private readonly config: ConfigService) {
      const endpoint = this.config.get<string>('R2_ENDPOINT');
      const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
      const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
      this.defaultBucket = this.config.get<string>('R2_BUCKET') ?? '';

      if (!endpoint || !accessKeyId || !secretAccessKey || !this.defaultBucket) {
         throw new Error('R2 env vars missing: R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET');
      }

      this.s3 = new S3Client({
         region: 'auto',
         endpoint,
         credentials: { accessKeyId, secretAccessKey },
         forcePathStyle: true,
      });
   }

   private bucketOrDefault(bucket?: string) {
      return bucket ?? this.defaultBucket;
   }

   publicUrlForKey(key: string) {
      const base = this.config.get<string>('R2_PUBLIC_BASE_URL') ?? '';
      if (!base) throw new Error('Missing R2_PUBLIC_BASE_URL');
      return `${base.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
   }

   async headObject(key: string, bucket?: string) {
      const cmd = new HeadObjectCommand({ Bucket: this.bucketOrDefault(bucket), Key: key });
      return this.s3.send(cmd);
   }

   async presignUpload(params: {
      key: string;
      contentType: string;
      expiresInSeconds?: number;
      bucket?: string;
   }) {
      const cmd = new PutObjectCommand({
         Bucket: this.bucketOrDefault(params.bucket),
         Key: params.key,
         ContentType: params.contentType,
      });

      const url = await getSignedUrl(this.s3, cmd, { expiresIn: params.expiresInSeconds ?? 300 });
      return { url, method: 'PUT' as const };
   }

   async presignDownload(params: { key: string; expiresInSeconds?: number; bucket?: string }) {
      const cmd = new GetObjectCommand({
         Bucket: this.bucketOrDefault(params.bucket),
         Key: params.key,
      });

      const url = await getSignedUrl(this.s3, cmd, { expiresIn: params.expiresInSeconds ?? 300 });
      return { url, method: 'GET' as const };
   }

   async deleteObject(key: string, bucket?: string) {
      const cmd = new DeleteObjectCommand({ Bucket: this.bucketOrDefault(bucket), Key: key });
      const res = await this.s3.send(cmd);
      return { ok: true, res };
   }
}
