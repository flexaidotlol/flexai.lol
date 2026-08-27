import { env } from '../env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string }> {
  const { to, subject, html } = options;

  if (!env.RESEND_API_KEY) {
    // Graceful dev fallback
    return { success: true, id: 'dev-email-mock-' + Date.now() };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Failed to send Resend email:', err);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error dispatching transactional email:', error);
    // Emails must fail gracefully and not abort transactions
    return { success: false };
  }
}

export async function notifyBidSuccess(email: string, productName: string, amountDollars: string, rank: number) {
  return sendEmail({
    to: email,
    subject: `🔥 You flexed ${productName} to #${rank} on FlexAI!`,
    html: `
      <div style="font-family: sans-serif; background-color: #060813; color: #ffffff; padding: 32px; border-radius: 12px;">
        <h1 style="color: #8b5cf6; margin-bottom: 12px;">Flex Confirmed! 🚀</h1>
        <p style="font-size: 16px; color: #cbd5e1;">Your payment of <strong>${amountDollars}</strong> has been received and verified.</p>
        <div style="background: #11172e; padding: 20px; border-radius: 8px; border: 1px solid #1e293b; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;">🏆 Product: <strong>${productName}</strong></p>
          <p style="margin: 8px 0 0 0; font-size: 22px; color: #10b981;">Current Rank: <strong>#${rank}</strong></p>
        </div>
        <p><a href="${env.PUBLIC_SITE_URL}/ai/${encodeURIComponent(productName.toLowerCase())}" style="background: #8b5cf6; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">View on Leaderboard</a></p>
      </div>
    `,
  });
}
