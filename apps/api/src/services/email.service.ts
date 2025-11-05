import nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import { env } from '../config/env';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: SMTPConfig | null = null;

  /**
   * Load SMTP configuration from database or environment variables
   */
  async loadConfig(): Promise<SMTPConfig | null> {
    try {
      // Try to get from database first
      // Check if table exists first to avoid errors if migration not applied
      let settings = null;
      try {
        settings = await prisma.systemSettings.findUnique({
          where: { key: 'smtp' },
        });
      } catch (dbError: any) {
        // If table doesn't exist yet, silently fall back to env vars
        if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
          console.log('SystemSettings table not found, using environment variables');
        } else {
          throw dbError;
        }
      }

      if (settings && settings.value) {
        const smtpConfig = settings.value as any;
        if (smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
          this.config = {
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.secure === true || smtpConfig.port === 465,
            auth: {
              user: smtpConfig.user,
              pass: smtpConfig.pass,
            },
            from: smtpConfig.from || smtpConfig.user,
          };
          return this.config;
        }
      }

      // Fallback to environment variables
      if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
        this.config = {
          host: env.SMTP_HOST,
          port: parseInt(env.SMTP_PORT || '587', 10),
          secure: env.SMTP_PORT === '465' || env.SMTP_PORT === '25',
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
          from: env.SMTP_FROM || env.SMTP_USER,
        };
        return this.config;
      }

      return null;
    } catch (error) {
      console.error('Error loading SMTP config:', error);
      return null;
    }
  }

  /**
   * Initialize transporter with current configuration
   */
  async initialize(): Promise<boolean> {
    const config = await this.loadConfig();
    
    if (!config) {
      console.warn('⚠️  SMTP configuration not found. Email service disabled.');
      console.warn('   Please configure SMTP settings in Settings → SMTP/Email tab');
      return false;
    }

    try {
      console.log(`📧 Initializing SMTP connection to ${config.host}:${config.port}`);
      console.log(`   Secure: ${config.secure ? 'Yes (TLS/SSL)' : 'No (STARTTLS)'}`);
      console.log(`   User: ${config.user}`);
      
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error: any) {
      console.error('❌ SMTP connection failed:');
      console.error('   Error:', error.message || error);
      if (error.code) {
        console.error('   Error Code:', error.code);
      }
      if (error.response) {
        console.error('   Server Response:', error.response);
      }
      if (error.responseCode) {
        console.error('   Response Code:', error.responseCode);
      }
      if (error.command) {
        console.error('   Command:', error.command);
      }
      if (error.stack && process.env.NODE_ENV === 'development') {
        console.error('   Stack:', error.stack);
      }
      this.transporter = null;
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Initialize if not already done
      if (!this.transporter) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('❌ Cannot send email: SMTP not configured or connection failed');
          return false;
        }
      }

      if (!this.config) {
        await this.loadConfig();
      }

      const mailOptions = {
        from: this.config?.from || 'noreply@hrsystem.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      console.log(`📧 Sending email to: ${mailOptions.to}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      
      const info = await this.transporter!.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response || 'No response'}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending email:');
      console.error('   Error:', error.message || error);
      if (error.code) {
        console.error('   Error Code:', error.code);
      }
      if (error.response) {
        console.error('   Server Response:', error.response);
      }
      if (error.responseCode) {
        console.error('   Response Code:', error.responseCode);
      }
      if (error.command) {
        console.error('   Command:', error.command);
      }
      if (error.stack && process.env.NODE_ENV === 'development') {
        console.error('   Stack:', error.stack);
      }
      return false;
    }
  }

  /**
   * Send leave request notification
   */
  async sendLeaveRequestNotification(
    employeeEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    days: number,
    approverEmail?: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Leave Request Submitted</h2>
        <p>Dear ${employeeName},</p>
        <p>Your leave request has been submitted successfully:</p>
        <ul>
          <li><strong>Leave Type:</strong> ${leaveType}</li>
          <li><strong>Start Date:</strong> ${startDate}</li>
          <li><strong>End Date:</strong> ${endDate}</li>
          <li><strong>Days:</strong> ${days}</li>
        </ul>
        <p>You will be notified once your request is reviewed.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email from HR Management System.</p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: `Leave Request Submitted - ${leaveType}`,
      html,
    });
  }

  /**
   * Send leave approval/rejection notification
   */
  async sendLeaveStatusNotification(
    employeeEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    status: 'APPROVED' | 'REJECTED',
    approverName?: string,
    reason?: string
  ): Promise<boolean> {
    const statusText = status === 'APPROVED' ? 'Approved' : 'Rejected';
    const statusColor = status === 'APPROVED' ? '#10b981' : '#ef4444';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">Leave Request ${statusText}</h2>
        <p>Dear ${employeeName},</p>
        <p>Your leave request has been <strong style="color: ${statusColor};">${statusText}</strong>:</p>
        <ul>
          <li><strong>Leave Type:</strong> ${leaveType}</li>
          <li><strong>Start Date:</strong> ${startDate}</li>
          <li><strong>End Date:</strong> ${endDate}</li>
          ${approverName ? `<li><strong>Approved by:</strong> ${approverName}</li>` : ''}
          ${reason && status === 'REJECTED' ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
        </ul>
        <p style="color: #666; font-size: 12px;">This is an automated email from HR Management System.</p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: `Leave Request ${statusText} - ${leaveType}`,
      html,
    });
  }

  /**
   * Send attendance reminder
   */
  async sendAttendanceReminder(
    employeeEmail: string,
    employeeName: string,
    reminderType: 'clock_in' | 'clock_out'
  ): Promise<boolean> {
    const action = reminderType === 'clock_in' ? 'Clock In' : 'Clock Out';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Attendance Reminder</h2>
        <p>Dear ${employeeName},</p>
        <p>This is a reminder to <strong>${action}</strong> for today.</p>
        <p>Please log in to the HR Management System to record your attendance.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email from HR Management System.</p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: `Attendance Reminder - ${action}`,
      html,
    });
  }

  /**
   * Send welcome email to new employee
   */
  async sendWelcomeEmail(
    employeeEmail: string,
    employeeName: string,
    employeeCode: string,
    password?: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to HR Management System</h2>
        <p>Dear ${employeeName},</p>
        <p>Welcome! Your account has been created:</p>
        <ul>
          <li><strong>Employee Code:</strong> ${employeeCode}</li>
          <li><strong>Email:</strong> ${employeeEmail}</li>
          ${password ? `<li><strong>Temporary Password:</strong> ${password}</li>` : ''}
        </ul>
        ${password ? '<p><strong>Please change your password after first login.</strong></p>' : ''}
        <p>You can now log in to the HR Management System to access your dashboard.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email from HR Management System.</p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: 'Welcome to HR Management System',
      html,
    });
  }

  /**
   * Test email configuration
   */
  async testEmail(to: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🧪 Testing SMTP configuration - sending test email to: ${to}`);
      
      const initialized = await this.initialize();
      if (!initialized) {
        const errorMsg = 'SMTP configuration is invalid or connection failed. Check the backend logs for details.';
        console.error(`❌ ${errorMsg}`);
        return { success: false, message: errorMsg };
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p>If you received this email, your SMTP settings are configured properly!</p>
          <p style="color: #666; font-size: 12px;">This is an automated test email from HR Management System.</p>
        </div>
      `;

      const sent = await this.sendEmail({
        to,
        subject: 'SMTP Configuration Test',
        html,
      });

      if (sent) {
        const successMsg = `Test email sent successfully to ${to}! Please check your inbox.`;
        console.log(`✅ ${successMsg}`);
        return { success: true, message: successMsg };
      } else {
        const errorMsg = 'Failed to send test email. Check the backend logs for detailed error information.';
        console.error(`❌ ${errorMsg}`);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Error sending test email. Check the backend logs for details.';
      console.error(`❌ Test email error: ${errorMsg}`);
      if (error.stack && process.env.NODE_ENV === 'development') {
        console.error('   Stack:', error.stack);
      }
      return { success: false, message: errorMsg };
    }
  }
}

export const emailService = new EmailService();

