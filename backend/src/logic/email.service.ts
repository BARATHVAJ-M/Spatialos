import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Standard secure SMTP transport. Fallback to mock test credentials if env is missing.
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
      },
    });
  }

  private async sendMail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    if (!process.env.SMTP_HOST) {
      this.logger.warn(`No SMTP_HOST configured. MOCK EMAIL SENT to ${mailOptions.to}. Content: ${mailOptions.text || mailOptions.subject}`);
      return;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email successfully sent to ${mailOptions.to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${mailOptions.to}`, error.stack);
      throw error; // Let BullMQ handle retries and backoff
    }
  }

  async sendAccessRequestEmail(
    supportEmail: string,
    requestDetails: { name: string; email: string; role: string; id: string }
  ) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">SpatialOS Access Request</h2>
        <p style="color: #475569;">A new user has requested access to the SpatialOS dashboard.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Name:</strong> ${requestDetails.name}</p>
          <p><strong>Email:</strong> ${requestDetails.email}</p>
          <p><strong>Requested Role:</strong> ${requestDetails.role}</p>
        </div>

        <p style="color: #475569;">Please log into the Admin Dashboard to approve or reject this request.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Request ID: ${requestDetails.id}</p>
      </div>
    `;

    try {
      if (process.env.SMTP_HOST) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"SpatialOS Admin" <no-reply@spatialos.com>',
          to: supportEmail,
          subject: `New Access Request: ${requestDetails.name}`,
          html: htmlContent,
        });
        this.logger.log(`Access request email sent to ${supportEmail}`);
      } else {
        // Log the mock if SMTP is not configured
        this.logger.warn(`No SMTP_HOST configured. MOCK EMAIL SENT to ${supportEmail}`);
        this.logger.debug(htmlContent);
      }
    } catch (error) {
        this.logger.error(`Failed to send email to ${supportEmail}`, error);
    }
  }

  async sendVerificationEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"SpatialOS Security" <no-reply@spatialos.com>',
      to,
      subject: 'Verify your email for SpatialOS',
      text: `Your verification code is: ${otp}. This code is valid for 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to SpatialOS</h2>
          <p>Please verify your email address by entering the following 6-digit code in the app:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${otp}</span>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This code is valid for 24 hours. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"SpatialOS Security" <no-reply@spatialos.com>',
      to,
      subject: 'Password Reset Request',
      text: `Your password reset code is: ${otp}. This code is valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Enter the following 6-digit code in the app to proceed:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${otp}</span>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This code is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }
}
