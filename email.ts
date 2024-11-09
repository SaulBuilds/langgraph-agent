import nodemailer from 'nodemailer';
import { EmailTemplate } from './email-template';

export type EmailConfig = {
  auth: {
    user: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.auth.user,
        clientId: config.auth.clientId,
        clientSecret: config.auth.clientSecret,
        refreshToken: config.auth.refreshToken,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string) {
    try {
      console.log('Attempting to send email to:', to);
      
      const htmlContent = EmailTemplate.getEmailTemplate(subject, text);
      
      const mailOptions = {
        from: this.config.auth.user,
        to,
        subject,
        text, // Plain text version
        html: htmlContent, // HTML version
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error details:', error);
      throw error;
    }
  }
}