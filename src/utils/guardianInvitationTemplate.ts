const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!));

type GuardianInvitationEmail = {
  studentName: string;
  studentId: string;
  code: string;
  expiresAt: Date;
};

const formatExpiry = (date: Date) =>
  date.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  });

const BRAND = '#871dad';
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const step = (n: number, text: string) => `
                <tr>
                  <td width="38" valign="top" style="padding:0 0 14px">
                    <div style="width:26px;height:26px;line-height:26px;border-radius:13px;background:${BRAND};color:#ffffff;font-size:13px;font-weight:700;text-align:center">${n}</div>
                  </td>
                  <td valign="top" style="padding:3px 0 14px;font-size:15px;line-height:22px;color:#3f3a45">${text}</td>
                </tr>`;

/**
 * Guardian invitation email. Table-based layout with inline styles so it
 * renders consistently in Gmail, Outlook and mobile mail apps. Returns a
 * plain-text alternative too, which helps keep it out of spam.
 */
export function guardianInvitationEmail({ studentName, studentId, code, expiresAt }: GuardianInvitationEmail) {
  const name = escapeHtml(studentName);
  const id = escapeHtml(studentId);
  const safeCode = escapeHtml(code);
  const expiry = escapeHtml(formatExpiry(expiresAt));

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>AchieverPlus guardian invitation</title>
</head>
<body style="margin:0;padding:0;background:#f4eef7;font-family:${FONT}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your invitation code to link ${name} to your AchieverPlus parent account.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eef7">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(135,29,173,0.10)">
          <tr>
            <td align="center" style="background:${BRAND};background-image:linear-gradient(135deg,#9b2fc4,#6e17a0);padding:28px 24px">
              <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:0.5px">Achiever<span style="color:#ffd6f5">Plus</span></div>
              <div style="font-size:11px;color:#f1dcf8;letter-spacing:2px;text-transform:uppercase;margin-top:6px">Stronger schools &middot; Brighter futures</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:30px;color:#2b2233;font-weight:700">You&#39;re invited to connect with your child</h1>
              <p style="margin:0;font-size:15px;line-height:24px;color:#5b5363">
                Your school has invited you to link <strong style="color:#2b2233">${name}</strong> to your parent account in AchieverPlus.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf5fc;border:1px solid #ecd9f3;border-radius:12px">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #ecd9f3">
                    <div style="font-size:12px;color:#8a7f93;text-transform:uppercase;letter-spacing:1px">Student</div>
                    <div style="font-size:16px;color:#2b2233;font-weight:600;margin-top:4px">${name}</div>
                    <div style="font-size:14px;color:#5b5363;margin-top:2px">Student ID: <strong style="color:${BRAND}">${id}</strong></div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:22px 20px">
                    <div style="font-size:12px;color:#8a7f93;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Your invitation code</div>
                    <div style="display:inline-block;background:#ffffff;border:2px dashed ${BRAND};border-radius:10px;padding:12px 22px;font-family:'Courier New',Consolas,monospace;font-size:26px;font-weight:700;letter-spacing:4px;color:${BRAND}">${safeCode}</div>
                    <div style="font-size:13px;color:#8a7f93;margin-top:12px">Single use &middot; Valid for 72 hours<br>Expires ${expiry}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#2b2233;font-weight:700">How to link your child</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${step(1, 'Sign in to the <strong>AchieverPlus parent app</strong> using this email address.')}${step(2, 'Open <strong>My Students</strong> and tap <strong>+</strong>.')}${step(3, 'Enter the <strong>Student ID</strong> and <strong>invitation code</strong>, then tap <strong>Link student</strong>.')}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 32px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px">
                <tr>
                  <td style="padding:12px 16px;font-size:13px;line-height:20px;color:#7c4a03">
                    If you don&#39;t recognize this student, please contact the school and do not use this code.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:#faf5fc;border-top:1px solid #f0e4f5;padding:18px 24px;font-size:12px;line-height:18px;color:#9a8fa3">
              This email was sent by AchieverPlus on behalf of your school.<br>
              Please do not reply to this message.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "You're invited to connect with your child on AchieverPlus",
    '',
    `Your school has invited you to link ${studentName} to your parent account.`,
    '',
    `Student ID: ${studentId}`,
    `Invitation code: ${code}`,
    `Single use, valid for 72 hours. Expires ${formatExpiry(expiresAt)}.`,
    '',
    'How to link your child:',
    '1. Sign in to the AchieverPlus parent app using this email address.',
    '2. Open My Students and tap +.',
    '3. Enter the Student ID and invitation code, then tap Link student.',
    '',
    "If you don't recognize this student, contact the school and do not use this code.",
  ].join('\n');

  return { html, text };
}
