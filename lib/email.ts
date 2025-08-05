// Dynamically import nodemailer only when sendEmail is called. This avoids bundling
// the module and silences type-checker errors if nodemailer types aren't installed.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(opts: {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  if (!opts.to) throw new Error('No recipient email provided');
  if (!opts.subject) throw new Error('No email subject provided');
  if (!opts.html) throw new Error('No email html provided');

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'no-reply@daydreamersnyc.com',
    to: opts.to,
    cc: opts.cc,
    bcc: opts.bcc,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
} 