const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user) {
    return null; // SMTP is not configured
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Sends email or returns fallback link if SMTP is unconfigured.
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML body
 * @param {string} [options.fallbackUrl] - URL link for fallback UI display
 */
async function sendEmail({ to, subject, html, fallbackUrl }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[Email Service - Unconfigured SMTP]
--------------------------------------------------
To: ${to}
Subject: ${subject}
Fallback Link: ${fallbackUrl || 'N/A'}
--------------------------------------------------`);
    return {
      sent: false,
      configured: false,
      fallbackUrl: fallbackUrl || null,
      message: 'SMTP settings not configured in .env. Link displayed on-screen for manual copy.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Shadow AI Scanner" <noreply@shadowscan.local>',
      to,
      subject,
      html,
    });
    console.log(`[Email Sent] Message ID: ${info.messageId} to ${to}`);
    return {
      sent: true,
      configured: true,
      messageId: info.messageId,
      fallbackUrl: fallbackUrl || null,
    };
  } catch (err) {
    console.error('[Email Send Error]', err.message);
    return {
      sent: false,
      configured: true,
      error: err.message,
      fallbackUrl: fallbackUrl || null,
    };
  }
}

module.exports = {
  sendEmail,
};
