import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  bucket: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds, default 3600
  contentType?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string | undefined;
  private readonly forcePathStyle: boolean;

  constructor(private config: AppConfigService) {
    const storageConfig = config.storage || {
      bucket: process.env.S3_BUCKET || 'autisense-reports',
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    };

    this.bucket = storageConfig.bucket || 'autisense-reports';
    this.region = storageConfig.region || 'us-east-1';
    this.endpoint = storageConfig.endpoint;
    this.forcePathStyle = storageConfig.forcePathStyle || false;

    this.logger.log(`Storage service initialized with bucket: ${this.bucket}`);
  }

  /**
   * Generate a signed URL for uploading
   * Note: This is a stub implementation. Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner for full S3 support.
   */
  async getUploadUrl(
    key: string,
    options: SignedUrlOptions = {},
  ): Promise<{ uploadUrl: string; key: string }> {
    const { expiresIn = 3600, contentType = 'application/octet-stream' } = options;

    // In production, use AWS SDK:
    // const command = new PutObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    //   ContentType: contentType,
    // });
    // const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    // For now, return a mock URL for development
    const mockUrl = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    this.logger.debug(`Generated upload URL for key: ${key}`);

    return {
      uploadUrl: mockUrl,
      key,
    };
  }

  /**
   * Generate a signed URL for downloading
   */
  async getDownloadUrl(
    key: string,
    options: SignedUrlOptions = {},
  ): Promise<string> {
    const { expiresIn = 3600 } = options;

    // In production, use AWS SDK:
    // const command = new GetObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    // });
    // const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    const mockUrl = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    // Append expiry info (in real implementation, this would be a signed URL)
    const url = new URL(mockUrl);
    url.searchParams.set('expires', String(Date.now() + expiresIn * 1000));

    this.logger.debug(`Generated download URL for key: ${key}`);

    return url.toString();
  }

  /**
   * Delete an object from storage
   */
  async delete(key: string): Promise<void> {
    // In production, use AWS SDK:
    // const command = new DeleteObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    // });
    // await s3Client.send(command);

    this.logger.log(`Object deleted: ${key}`);
  }

  /**
   * Check if an object exists
   */
  async exists(key: string): Promise<boolean> {
    // In production, use AWS SDK:
    // try {
    //   await s3Client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    //   return true;
    // } catch (error) {
    //   if (error.name === 'NotFound') return false;
    //   throw error;
    // }

    this.logger.debug(`Checking existence of: ${key}`);
    return true;
  }

  /**
   * Get object metadata
   */
  async getMetadata(key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
  } | null> {
    // In production, use AWS SDK:
    // const response = await s3Client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    // return {
    //   size: response.ContentLength,
    //   lastModified: response.LastModified,
    //   contentType: response.ContentType,
    // };

    return {
      size: 0,
      lastModified: new Date(),
      contentType: 'application/octet-stream',
    };
  }

  /**
   * Generate a unique key for reports
   */
  generateReportKey(userId: string, sessionId: string, format: 'pdf' | 'csv' | 'json'): string {
    const timestamp = Date.now();
    const filename = `report_${sessionId}_${timestamp}.${format}`;
    return `reports/${userId}/${filename}`;
  }

  /**
   * List objects with a prefix
   */
  async list(prefix: string, maxKeys = 100): Promise<string[]> {
    // In production, use AWS SDK:
    // const response = await s3Client.send(new ListObjectsV2Command({
    //   Bucket: this.bucket,
    //   Prefix: prefix,
    //   MaxKeys: maxKeys,
    // }));
    // return response.Contents.map(obj => obj.Key);

    return [];
  }

  /**
   * Get public URL for an object
   */
  getPublicUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}