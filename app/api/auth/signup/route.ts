import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, password, username } = await req.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Create user with email pre-confirmed — Supabase never sends its own email
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://curlysports.com";

  await sendEmail({
    to: email,
    subject: "Welcome to Curly Sports — You're in the game!",
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f6ede0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6ede0;">
  <tr><td align="center" style="padding:32px 16px 40px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
      <!-- Green header -->
      <tr><td style="border-radius:20px 20px 0 0;border:2.5px solid #0c0a1d;border-bottom:none;background:#c8ff3d;background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%3E%3Cpath%20d%3D%22M0%200h32v1H0zM0%200h1v32H0z%22%20fill%3D%22rgba(12%2C10%2C29%2C0.07)%22%2F%3E%3C%2Fsvg%3E');padding:36px 28px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:44px;height:44px;vertical-align:middle;"><div style="width:44px;height:44px;background:#0c0a1d;border-radius:12px;text-align:center;line-height:44px;font-family:Georgia,serif;font-weight:900;font-size:24px;color:#c8ff3d;display:inline-block;">c</div></td>
              <td style="padding-left:10px;vertical-align:middle;"><span style="font-family:Arial,sans-serif;font-weight:900;font-size:21px;color:#0c0a1d;letter-spacing:-0.5px;">curly<span style="color:#ff5b3d;">.</span>sports</span></td>
            </tr></table></td>
            <td align="right" valign="top"><div style="display:inline-block;background:#0c0a1d;color:#fffdf7;padding:10px 14px;border-radius:14px;box-shadow:5px 5px 0 #ff5b3d;font-family:Arial,sans-serif;"><div style="font-size:22px;font-weight:900;color:#c8ff3d;letter-spacing:-1px;line-height:1;">34k+</div><div style="font-size:9px;font-weight:700;opacity:0.65;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">FANS ON BOARD</div></div></td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="6" border="0" align="center">
          <tr>
            <td width="100" valign="bottom" align="right" style="padding-bottom:4px;padding-right:4px;"><span style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:13px;color:#0c0a1d;white-space:nowrap;">say hi to Curly &rarr;</span></td>
            <td width="64" align="center" valign="bottom" style="padding-bottom:2px;"><div style="width:56px;height:56px;border-radius:50%;background:#fffdf7;border:2.5px solid #0c0a1d;box-shadow:3px 3px 0 #0c0a1d;text-align:center;line-height:52px;font-family:Arial,sans-serif;font-weight:900;font-size:12px;color:#0c0a1d;">SOC</div></td>
            <td width="100">&nbsp;</td>
          </tr>
          <tr>
            <td align="right" valign="middle" style="padding-right:2px;"><div style="width:56px;height:56px;border-radius:50%;background:#fffdf7;border:2.5px solid #0c0a1d;box-shadow:3px 3px 0 #0c0a1d;text-align:center;line-height:52px;font-family:Arial,sans-serif;font-weight:900;font-size:12px;color:#0c0a1d;">NFL</div></td>
            <td align="center" valign="middle" width="140" height="140"><div style="width:140px;height:140px;border-radius:50%;background:#fffdf7;border:3px solid #0c0a1d;box-shadow:8px 8px 0 #0c0a1d;overflow:hidden;display:inline-block;"><img src="${appUrl}/curly-guy.png" width="140" height="140" alt="Curly" style="width:140px;height:140px;display:block;"/></div></td>
            <td align="left" valign="middle" style="padding-left:2px;"><div style="width:56px;height:56px;border-radius:50%;background:#fffdf7;border:2.5px solid #0c0a1d;box-shadow:3px 3px 0 #0c0a1d;text-align:center;line-height:52px;font-family:Arial,sans-serif;font-weight:900;font-size:12px;color:#0c0a1d;">NBA</div></td>
          </tr>
          <tr>
            <td align="right" valign="top" style="padding-top:4px;padding-right:4px;"><div style="display:inline-block;background:#0c0a1d;color:#fffdf7;padding:10px 14px;border-radius:14px;box-shadow:5px 5px 0 #ff5b3d;font-family:Arial,sans-serif;"><div style="font-size:22px;font-weight:900;color:#c8ff3d;letter-spacing:-1px;line-height:1;">2.3k</div><div style="font-size:9px;font-weight:700;opacity:0.65;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">DEBATES TODAY</div></div></td>
            <td align="center" valign="top" style="padding-top:2px;"><div style="width:56px;height:56px;border-radius:50%;background:#fffdf7;border:2.5px solid #0c0a1d;box-shadow:3px 3px 0 #0c0a1d;text-align:center;line-height:52px;font-family:Arial,sans-serif;font-weight:900;font-size:12px;color:#0c0a1d;">TEN</div></td>
            <td valign="top" style="padding-top:6px;padding-left:6px;"><span style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:13px;color:#0c0a1d;white-space:nowrap;">&larr; he's been waiting</span></td>
          </tr>
        </table>
      </td></tr>
      <!-- Ribbon -->
      <tr><td style="background:#0c0a1d;padding:11px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;color:#fffdf7;letter-spacing:0.08em;text-transform:uppercase;">&bull;&nbsp;<span style="color:#c8ff3d;">CURLY SPORTS</span>&nbsp;&middot;&nbsp;YOUR SPORTS HUB</td><td align="right" style="font-family:'Courier New',monospace;font-size:10px;color:rgba(255,253,247,0.38);text-transform:uppercase;letter-spacing:0.06em;">curlysports.com</td></tr></table></td></tr>
      <!-- Cream content -->
      <tr><td style="background:#fffdf7;border:2.5px solid #0c0a1d;border-top:none;padding:36px 40px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;"><tr><td style="width:24px;height:2px;background:#ff5b3d;vertical-align:middle;font-size:0;">&nbsp;</td><td style="padding-left:10px;font-family:'Courier New',monospace;font-size:11px;font-weight:700;color:#ff5b3d;letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;">WELCOME ABOARD</td></tr></table>
        <div style="font-family:Georgia,'Times New Roman',serif;font-weight:900;font-size:48px;line-height:1.0;letter-spacing:-1.5px;color:#0c0a1d;margin-bottom:14px;">You're <em style="font-style:italic;background:#c8ff3d;padding:0 10px 3px;border-radius:10px;display:inline;">in the game,</em><br/>${username}.</div>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:#2a2540;line-height:1.65;margin:0 0 28px;">Your Curly Sports account is ready. Live scores, hot debates, team stats — it's all waiting for you.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;"><tr><td style="border-radius:999px;"><a href="${appUrl}/dashboard" style="display:inline-block;background:#0c0a1d;color:#c8ff3d;font-family:Arial,sans-serif;font-size:15px;font-weight:800;padding:15px 40px;border-radius:999px;border:2px solid #0c0a1d;box-shadow:5px 5px 0 #ff5b3d;text-decoration:none;white-space:nowrap;">Go to my dashboard &rarr;</a></td></tr></table>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(12,10,29,0.45);line-height:1.6;margin:0;">You received this because you signed up at <a href="${appUrl}" style="color:#0c0a1d;font-weight:600;">curlysports.com</a>.</p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#0c0a1d;border:2.5px solid #0c0a1d;border-top:none;border-radius:0 0 20px 20px;padding:18px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,253,247,0.35);line-height:1.7;">&copy; 2025 Curly Sports &middot; <a href="${appUrl}" style="color:rgba(200,255,61,0.65);">curlysports.com</a><br/><a href="${appUrl}/privacy" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Privacy</a>&nbsp;&nbsp;<a href="${appUrl}/terms" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Terms</a>&nbsp;&nbsp;<a href="mailto:support@curlysports.com" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Support</a></td></tr></table></td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });

  return NextResponse.json({ user: data.user });
}
