import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OllamaEmbeddings } from '@langchain/ollama';
import * as fs from 'fs';
import * as pdfImport from 'pdf-parse';
import * as mammoth from 'mammoth';

// Use a local interface to avoid issues with library type resolution in some environments
interface PdfParseResult {
  text: string;
}

const pdf = pdfImport as unknown as (data: Buffer) => Promise<PdfParseResult>;

export interface IngestionJobData {
  documentId: string;
  fileUrl: string;
  mimetype: string;
}

@Injectable()
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);
  private embeddings: OllamaEmbeddings;

  constructor(private readonly prisma: PrismaService) {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    });
  }

  async processDocument(
    data: IngestionJobData,
  ): Promise<{ success: boolean; chunksProcessed: number }> {
    const { documentId, fileUrl, mimetype } = data;
    this.logger.log(`Processing document ingestion for ID: ${documentId}`);

    try {
      // 1. Read file content
      let text = '';
      const fileBuffer = fs.readFileSync(fileUrl);

      if (mimetype === 'application/pdf') {
        const pdfData = await pdf(fileBuffer);
        text = pdfData.text;
      } else if (
        mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else {
        text = fileBuffer.toString('utf-8');
      }

      // 2. Chunk text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.createDocuments([text]);

      // 3. Embed and store chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i].pageContent;
        // Generate embedding
        const vector = await this.embeddings.embedQuery(chunkContent);

        // Convert vector array to formatted string for pgvector: '[v1, v2, ...]'
        const vectorString = `[${vector.join(',')}]`;

        // Store chunk in db using raw query because of vector field
        await this.prisma.$executeRaw`
          INSERT INTO "DocumentChunk" ("id", "content", "embedding", "documentId", "chunkIndex")
          VALUES (gen_random_uuid(), ${chunkContent}, ${vectorString}::vector, ${documentId}, ${i})
        `;
      }

      this.logger.log(
        `Successfully processed and embedded document: ${documentId}`,
      );
      return { success: true, chunksProcessed: chunks.length };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing document ${documentId}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
