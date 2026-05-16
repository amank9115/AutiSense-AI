import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MlService } from '../ml/ml.service';
import { EmailService } from '../email/email.service';
import { REPORT_QUEUE } from './queue.module';

interface ReportJobData {
  sessionKey: string;
  childName?: string;
  parentEmail?: string;
  parentName?: string;
  parentPhone?: string;
  city?: string;
  state?: string;
}

@Processor(REPORT_QUEUE)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private mlService: MlService,
    private emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<ReportJobData>): Promise<void> {
    const {
      sessionKey,
      childName,
      parentEmail,
      parentName,
      parentPhone,
      city,
      state,
    } = job.data;

    this.logger.log(`Processing report for session: ${sessionKey}`);

    try {
      // Generate PDF from ML service
      const childInfo: Record<string, string> = {};
      if (childName) childInfo.child_name = childName;
      if (parentName) childInfo.parent_name = parentName;
      if (parentEmail) childInfo.parent_email = parentEmail;
      if (parentPhone) childInfo.parent_phone = parentPhone;
      if (city) childInfo.city = city;
      if (state) childInfo.state = state;

      const pdfBuffer = await this.mlService.generateReport(
        sessionKey,
        childInfo,
      );

      this.logger.log(
        `PDF generated for session: ${sessionKey} (${pdfBuffer.byteLength} bytes)`,
      );

      // If parent email is available, send it
      if (parentEmail) {
        await this.emailService.sendReport(
          parentEmail,
          childName || 'Child',
          pdfBuffer,
        );
        this.logger.log(`Report emailed to: ${parentEmail}`);
      }

      await job.updateProgress(100);
    } catch (error) {
      this.logger.error(
        `Report processing failed for session ${sessionKey}`,
        error,
      );
      throw error;
    }
  }
}
