import { CONFIG } from '../config/env.js';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  // In development, log the email action and verification link/code to console
  if (CONFIG.NODE_ENV !== 'production' || !CONFIG.EMAIL_PROVIDER_API_KEY) {
    console.log(`\n================== [SIMULATED EMAIL] ==================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log(`=======================================================\n`);
    return true;
  }

  // Production provider integration placeholder (e.g. Resend, Sendgrid, Postmark)
  return true;
}

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  const verifyUrl = `${CONFIG.APP_BASE_URL}/verify-email?token=${token}`;
  const html = `
    <h2>Welcome to PassVault</h2>
    <p>Please verify your email address to activate your account:</p>
    <p><a href="${verifyUrl}" style="padding:10px 16px;background:#0284c7;color:#fff;text-decoration:none;border-radius:4px;">Verify Email</a></p>
    <p>Or use verification code: <strong>${token}</strong></p>
    <p>This code will expire in 24 hours.</p>
  `;
  return sendEmail({ to, subject: 'PassVault - Verify Your Email', html });
}

export async function sendMfaEmailCode(to: string, code: string): Promise<boolean> {
  const html = `
    <h2>PassVault Authentication</h2>
    <p>Your one-time security verification code is:</p>
    <h1 style="letter-spacing: 4px; color: #0284c7;">${code}</h1>
    <p>This code is single-use and will expire in 10 minutes.</p>
  `;
  return sendEmail({ to, subject: 'PassVault - One-Time Security Code', html });
}
