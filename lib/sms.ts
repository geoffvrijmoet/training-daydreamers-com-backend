import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSms(to: string, body: string) {
  await client.messages.create({
    to,
    body,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
  });
}
