import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendEmail } from "@/lib/email";
import { parseBody, signupSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // Rate limit: 5 signup attempts per minute per IP
  const limited = await rateLimiters.auth(req);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(signupSchema, body);
  if (!parsed.success) return parsed.response;
  const { email, password, username } = parsed.data;

  // email_confirm: false — user must verify their email before logging in
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { username },
  });

  if (error) {
    logger.warn("signup failed", { email });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://curlysports.com";

  sendEmail({
    to: email,
    subject: "Welcome to Curly Sports — You're in the game!",
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0ebe0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ebe0;">
  <tr><td align="center" style="padding:32px 16px 40px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
      <tr><td style="border-radius:20px 20px 0 0;border:2px solid #0c0a1d;border-bottom:none;background:#c8ff3d;padding:32px 32px 28px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:28px;">
          <tr>
            <td style="vertical-align:middle;"><div style="width:40px;height:40px;background:#0c0a1d;border-radius:10px;text-align:center;line-height:40px;font-family:Georgia,serif;font-weight:900;font-size:22px;color:#c8ff3d;display:inline-block;">c</div></td>
            <td style="padding-left:10px;vertical-align:middle;"><span style="font-family:Arial,sans-serif;font-weight:900;font-size:20px;color:#0c0a1d;letter-spacing:-0.5px;">curly<span style="color:#ff5b3d;">.</span>sports</span></td>
          </tr>
        </table>
        <div style="width:150px;height:150px;border-radius:50%;background:#0c0a1d;border:3px solid #0c0a1d;box-shadow:6px 6px 0 #0c0a1d;overflow:hidden;display:inline-block;margin-bottom:16px;">
          <img src="${appUrl}/curly-guy.png" width="150" height="150" alt="Curly" style="width:150px;height:150px;display:block;object-fit:cover;"/>
        </div>
        <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#0c0a1d;letter-spacing:0.06em;margin:0 0 20px;opacity:0.6;text-transform:uppercase;">Your sports hub</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td style="padding:0 4px;"><div style="background:#0c0a1d;color:#c8ff3d;padding:5px 13px;border-radius:999px;font-size:11px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:0.04em;">EPL</div></td>
            <td style="padding:0 4px;"><div style="background:#0c0a1d;color:#fffdf7;padding:5px 13px;border-radius:999px;font-size:11px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:0.04em;">NBA</div></td>
            <td style="padding:0 4px;"><div style="background:#0c0a1d;color:#fffdf7;padding:5px 13px;border-radius:999px;font-size:11px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:0.04em;">NFL</div></td>
            <td style="padding:0 4px;"><div style="background:#0c0a1d;color:#fffdf7;padding:5px 13px;border-radius:999px;font-size:11px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:0.04em;">F1</div></td>
            <td style="padding:0 4px;"><div style="background:#0c0a1d;color:#fffdf7;padding:5px 13px;border-radius:999px;font-size:11px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:0.04em;">IPL</div></td>
            <td style="padding:0 4px;"><div style="background:rgba(12,10,29,0.15);color:#0c0a1d;padding:5px 13px;border-radius:999px;font-size:11px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:0.04em;">+145</div></td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="background:#0c0a1d;padding:10px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;color:#fffdf7;letter-spacing:0.08em;text-transform:uppercase;">&bull;&nbsp;<span style="color:#c8ff3d;">CURLY SPORTS</span>&nbsp;&middot;&nbsp;LIVE SCORES &amp; DEEP STATS</td>
          <td align="right" style="font-family:'Courier New',monospace;font-size:10px;color:rgba(255,253,247,0.38);text-transform:uppercase;letter-spacing:0.06em;">curlysports.com</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#fffdf7;border:2px solid #0c0a1d;border-top:none;padding:36px 40px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;"><tr>
          <td style="width:24px;height:2px;background:#ff5b3d;vertical-align:middle;font-size:0;">&nbsp;</td>
          <td style="padding-left:10px;font-family:'Courier New',monospace;font-size:11px;font-weight:700;color:#ff5b3d;letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;">WELCOME ABOARD</td>
        </tr></table>
        <div style="font-family:Georgia,'Times New Roman',serif;font-weight:900;font-size:44px;line-height:1.0;letter-spacing:-1.5px;color:#0c0a1d;margin-bottom:16px;">You're <em style="font-style:italic;background:#c8ff3d;padding:0 10px 3px;border-radius:10px;display:inline;">in the game.</em></div>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(12,10,29,0.7);line-height:1.65;margin:0 0 28px;">Your Curly Sports account is ready. Live scores, real stats, and debates backed by data — it's all waiting for you.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;"><tr><td style="border-radius:999px;">
          <a href="${appUrl}/dashboard" style="display:inline-block;background:#0c0a1d;color:#c8ff3d;font-family:Arial,sans-serif;font-size:15px;font-weight:800;padding:15px 40px;border-radius:999px;border:2px solid #0c0a1d;box-shadow:5px 5px 0 #ff5b3d;text-decoration:none;white-space:nowrap;">Go to my dashboard &rarr;</a>
        </td></tr></table>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(12,10,29,0.4);line-height:1.6;margin:0;">You received this because you signed up at <a href="${appUrl}" style="color:#0c0a1d;font-weight:600;">curlysports.com</a>.</p>
      </td></tr>
      <tr><td style="background:#0c0a1d;border:2px solid #0c0a1d;border-top:none;border-radius:0 0 20px 20px;padding:18px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,253,247,0.35);line-height:1.7;">
          &copy; 2026 Curly Sports &middot; <a href="${appUrl}" style="color:rgba(200,255,61,0.65);">curlysports.com</a><br/>
          <a href="${appUrl}/privacy" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Privacy</a>&nbsp;&middot;&nbsp;<a href="${appUrl}/terms" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Terms</a>&nbsp;&middot;&nbsp;<a href="mailto:support@curlysports.com" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Support</a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  }).catch((err) => logger.error("welcome email failed", { email, error: String(err) }));

  logger.info("user signup", { email });
  return NextResponse.json({ user: data.user });
}
