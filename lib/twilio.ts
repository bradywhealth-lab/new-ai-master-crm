import { Twilio } from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials not configured')
}

export const twilioClient = new Twilio(accountSid, authToken)

export async function sendSMS(to: string, body: string) {
  try {
    const message = await twilioClient.messages.create({
      from: twilioPhoneNumber!,
      to: to,
      body,
    })

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    }
  } catch (error) {
    console.error('Twilio error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
