export type InviteEmailParams = {
  to: string;
  inviteUrl: string;
  accountName: string;
  inviterName: string;
  workspaceNames: string[];
  role: string;
};

function roleLabel(role: string): string {
  return role === 'admin' ? 'Admin' : 'Member';
}

function buildHtml(params: InviteEmailParams): string {
  const workspaces =
    params.workspaceNames.length > 0
      ? params.workspaceNames.join(', ')
      : 'your assigned workspaces';

  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1a1a1a;">
  <p>Hi,</p>
  <p><strong>${escapeHtml(params.inviterName)}</strong> invited you to join <strong>${escapeHtml(params.accountName)}</strong> on Silkview as ${roleLabel(params.role)}.</p>
  <p>You will have access to: ${escapeHtml(workspaces)}.</p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(params.inviteUrl)}" style="display: inline-block; background: #635bff; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Accept invitation</a>
  </p>
  <p style="font-size: 13px; color: #666;">This link expires in 7 days. If you did not expect this email, you can ignore it.</p>
  <p style="font-size: 12px; color: #999; margin-top: 32px;">Silkview — Stripe &amp; Xero sync for Excel</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type SendInviteEmailResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'api_error'; message?: string };

/**
 * Sends team invite email via Resend. If RESEND_API_KEY is unset, logs in dev and returns not_configured.
 */
export async function sendInviteEmail(
  params: InviteEmailParams
): Promise<SendInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        '[invite-email] RESEND not configured; invite link:',
        params.inviteUrl
      );
    }
    return { sent: false, reason: 'not_configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: `You're invited to join ${params.accountName} on Silkview`,
      html: buildHtml(params),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[invite-email] Resend error:', res.status, text);
    return {
      sent: false,
      reason: 'api_error',
      message: text || `HTTP ${res.status}`,
    };
  }

  return { sent: true };
}
