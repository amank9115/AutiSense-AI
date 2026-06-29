import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SharedDocument } from '@prisma/client';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

// Type for multer file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

interface UploadDocumentDto {
  name: string;
  type: 'report' | 'assessment' | 'prescription' | 'image' | 'other';
  childId?: string;
  description?: string;
  tags?: string[];
  sharedWith?: string[];
}

interface ShareDocumentDto {
  userIds: string[];
  accessLevel: 'view' | 'download';
}

@Injectable()
export class DocumentSharingService {
  private readonly logger = new Logger(DocumentSharingService.name);
  private readonly uploadDir = process.env.DOCUMENT_UPLOAD_DIR || './uploads';
  private readonly encryptionKey =
    process.env.DOCUMENT_ENCRYPTION_KEY || 'default-encryption-key-32ch';

  constructor(private readonly prisma: PrismaService) {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'encrypted'), {
        recursive: true,
      });
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error}`);
    }
  }

  async uploadDocument(
    userId: string,
    file: MulterFile,
    dto: UploadDocumentDto,
  ): Promise<SharedDocument> {
    // Generate unique filename
    const fileId = crypto.randomUUID();
    const encryptedFilename = `${fileId}.enc`;
    const encryptedPath = path.join(
      this.uploadDir,
      'encrypted',
      encryptedFilename,
    );

    // Encrypt file content
    const encrypted = this.encrypt(file.buffer);
    await fs.writeFile(encryptedPath, encrypted);

    // Create document record
    const document = await this.prisma.sharedDocument.create({
      data: {
        name: dto.name || file.originalname,
        type: dto.type,
        fileSize: file.size,
        filePath: encryptedPath,
        uploadedById: userId,
        childId: dto.childId,
        description: dto.description,
        tags: dto.tags || [],
        sharedWith: dto.sharedWith || [],
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`Document ${document.id} uploaded by user ${userId}`);
    return document;
  }

  async downloadDocument(
    documentId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
    const document = await this.prisma.sharedDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check access
    const hasAccess =
      document.uploadedById === userId ||
      (document.sharedWith as string[])?.includes(userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this document');
    }

    // Read and decrypt
    const encrypted = await fs.readFile(document.filePath);
    const decrypted = this.decrypt(encrypted);

    // Determine mimetype
    const mimetypes: Record<string, string> = {
      report: 'application/pdf',
      assessment: 'application/pdf',
      prescription: 'application/pdf',
      image: 'image/jpeg',
      other: 'application/octet-stream',
    };

    return {
      buffer: decrypted,
      filename: document.name,
      mimetype: mimetypes[document.type] || 'application/octet-stream',
    };
  }

  async shareDocument(
    documentId: string,
    userId: string,
    dto: ShareDocumentDto,
  ): Promise<SharedDocument> {
    const document = await this.prisma.sharedDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploadedById !== userId) {
      throw new ForbiddenException('Only the owner can share this document');
    }

    const currentShared = (document.sharedWith as string[]) || [];
    const updatedShared = [...new Set([...currentShared, ...dto.userIds])];

    return this.prisma.sharedDocument.update({
      where: { id: documentId },
      data: {
        sharedWith: updatedShared,
        accessLevel: dto.accessLevel,
      },
    });
  }

  async revokeAccess(
    documentId: string,
    userId: string,
    targetUserId: string,
  ): Promise<SharedDocument> {
    const document = await this.prisma.sharedDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploadedById !== userId) {
      throw new ForbiddenException('Only the owner can revoke access');
    }

    const currentShared = (document.sharedWith as string[]) || [];
    const updatedShared = currentShared.filter((id) => id !== targetUserId);

    return this.prisma.sharedDocument.update({
      where: { id: documentId },
      data: { sharedWith: updatedShared },
    });
  }

  async getUserDocuments(userId: string): Promise<SharedDocument[]> {
    return this.prisma.sharedDocument.findMany({
      where: {
        OR: [
          { uploadedById: userId },
          // JSON array contains check - using string_contains as workaround for JSON field
          { sharedWith: { string_contains: userId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        child: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getChildDocuments(
    childId: string,
    userId: string,
  ): Promise<SharedDocument[]> {
    return this.prisma.sharedDocument.findMany({
      where: {
        childId,
        OR: [
          { uploadedById: userId },
          { sharedWith: { string_contains: userId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.prisma.sharedDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploadedById !== userId) {
      throw new ForbiddenException('Only the owner can delete this document');
    }

    // Delete file
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${error}`);
    }

    // Delete record
    await this.prisma.sharedDocument.delete({
      where: { id: documentId },
    });

    this.logger.log(`Document ${documentId} deleted`);
  }

  private encrypt(buffer: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const encrypted = Buffer.concat([
      iv,
      cipher.update(buffer),
      cipher.final(),
    ]);
    return encrypted;
  }

  private decrypt(encrypted: Buffer): Buffer {
    const iv = encrypted.subarray(0, 16);
    const data = encrypted.subarray(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    return Buffer.concat([decipher.update(data), decipher.final()]);
  }
}
