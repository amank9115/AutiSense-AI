import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_dev');
    this.fromEmail = process.env.EMAIL_FROM || 'MannSaathi <noreply@mannsaathi.com>';
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
    baseUrl: string = 'http://localhost:3000', // Defaulting to frontend port
  ): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3e684a 0%, #176876 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3e684a 0%, #176876 100%); color: white !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MannSaathi!</h1>
            <p>Your journey to understanding starts here</p>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for creating an account with MannSaathi. Please verify your email address to activate your account.</p>

            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify & Log In Automatically</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #176876; font-size: 12px;">${verifyUrl}</p>

            <div class="warning">
              <strong>⚠️ Important:</strong> This verification link acts as a secure magic link and will log you in immediately. It will expire in 24 hours for security reasons.
            </div>

            <p>If you didn't create this account, please ignore this email.</p>

            <p>Best regards,<br>The MannSaathi Team</p>
          </div>
          <div class="footer">
            <p>MannSaathi - Autism Screening Platform</p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (!process.env.RESEND_API_KEY) {
         this.logger.warn(`Resend API Key missing. Simulating sending email to ${to}`);
         this.logger.debug(`Verification URL: ${verifyUrl}`);
         return {
           success: true,
           message: 'Simulated verification email sent successfully',
         }
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Verify your email - MannSaathi',
        html: htmlContent,
      });

      if (error) {
        this.logger.error('Failed to send verification email with Resend:', error);
        return {
          success: false,
          message: error.message,
        };
      }

      this.logger.log(`Verification email sent to ${to}. Message ID: ${data?.id}`);
      return {
        success: true,
        message: 'Verification email sent successfully',
      };
    } catch (error: any) {
      this.logger.error('Unexpected error sending email:', error);
      return {
        success: false,
        message: 'Internal error occurred while sending email.',
      };
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
    baseUrl: string = 'http://localhost:3000',
  ): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #176876 0%, #3e684a 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #176876 0%, #3e684a 100%); color: white !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset the password for your MannSaathi account.</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #176876; font-size: 12px;">${resetUrl}</p>

            <div class="warning">
              <strong>⚠️ Important:</strong> This password reset link will expire in 1 hour. If you did not request this, you can safely ignore this email. Your password will remain unchanged.
            </div>

            <p>Best regards,<br>The MannSaathi Team</p>
          </div>
          <div class="footer">
            <p>MannSaathi - Autism Screening Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (!process.env.RESEND_API_KEY) {
         this.logger.warn(`Resend API Key missing. Simulating sending password reset email to ${to}`);
         this.logger.debug(`Reset URL: ${resetUrl}`);
         return {
           success: true,
           message: 'Simulated password reset email sent successfully',
         }
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Reset your password - MannSaathi',
        html: htmlContent,
      });

      if (error) {
        this.logger.error('Failed to send password reset email with Resend:', error);
        return {
          success: false,
          message: error.message,
        };
      }

      this.logger.log(`Password reset email sent to ${to}. Message ID: ${data?.id}`);
      return {
        success: true,
        message: 'Password reset email sent successfully',
      };
    } catch (error: any) {
      this.logger.error('Unexpected error sending email:', error);
      return {
        success: false,
        message: 'Internal error occurred while sending email.',
      };
    }
  }

  async sendReport(
    to: string,
    childName: string,
    pdfBuffer: ArrayBuffer,
  ): Promise<{ success: boolean; message: string }> {
    const htmlContent = `
      <html><body>
        <h2>Your MannSaathi Screening Report</h2>
        <p>Dear Parent, please find attached the screening report for ${childName}.</p>
        <p>This is a screening tool only — results must be confirmed by a clinical professional.</p>
        <p>Best regards,<br>The MannSaathi Team</p>
      </body></html>
    `;

    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn(`Resend API Key missing. Simulating sending report to ${to}`);
        return { success: true, message: 'Simulated report email sent' };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: `MannSaathi Screening Report — ${childName}`,
        html: htmlContent,
        attachments: [
          {
            filename: `MannSaathi_Report_${childName}.pdf`,
            content: Buffer.from(pdfBuffer),
          },
        ],
      });

      if (error) {
        this.logger.error('Failed to send report email:', error);
        return { success: false, message: error.message };
      }

      this.logger.log(`Report email sent to ${to}. Message ID: ${data?.id}`);
      return { success: true, message: 'Report sent successfully' };
    } catch (error: any) {
      this.logger.error('Unexpected error sending report:', error);
      return { success: false, message: 'Internal error occurred' };
    }
  }
}
