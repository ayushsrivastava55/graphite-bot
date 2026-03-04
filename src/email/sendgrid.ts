import sgMail from '@sendgrid/mail';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

sgMail.setApiKey(config.sendgridApiKey);

export async function sendReport(to: string, subject: string, html: string): Promise<void> {
  log.info(`Sending email: "${subject}" to ${to}`);

  await sgMail.send({
    to,
    from: config.sendgridFromEmail,
    subject,
    html,
  });

  log.info('Email sent successfully');
}
