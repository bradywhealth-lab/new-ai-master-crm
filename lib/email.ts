import nodemailer from 'nodemailer'

// Email configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

export function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter(smtpConfig)
  }
  return transporter
}

export interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    const transporter = getTransporter()
    const fromAddress = options.from || process.env.SMTP_FROM || process.env.SMTP_EMAIL || 'noreply@insureassist.com'

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Test email connection
export async function testEmailConnection(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const transporter = getTransporter()
    await transporter.verify()
    return { success: true }
  } catch (error) {
    console.error('Email connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
