import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signResetToken } from "@/lib/jwt";
import { sendEmail } from "@/lib/email";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const limited = await rateLimiters.auth(req);
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    redirectTo?: string;
  };
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Always respond with success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (user) {
    const resetToken = await signResetToken(user.email);
    const siteOrigin = req.nextUrl.origin;
    const resetUrl = `${siteOrigin}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendEmail({
      to: email,
      subject: "Reset your Curly Sports password",
      html: buildResetEmail(resetUrl),
    }).catch((err) =>
      logger.error("password reset email failed", { email, error: String(err) })
    );
  }

  return NextResponse.json({ success: true });
}

function buildResetEmail(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset your password · Curly Sports</title>
</head>
<body style="margin:0;padding:0;background:#f4ede0;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4ede0;min-height:100vh">
    <tr><td align="center" style="padding:40px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">

        <!-- Header -->
        <tr><td style="background:#07090b;border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;border:2px solid #07090b">
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
            <tr><td style="background:#c8ff3d;width:56px;height:56px;border-radius:16px;border:2.5px solid #c8ff3d;text-align:center;vertical-align:middle">
              <span style="font-family:Georgia,serif;font-size:28px;font-weight:900;color:#07090b;line-height:56px">C</span>
            </td></tr>
          </table>
          <div style="margin-top:14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c8ff3d">curlysports.com</div>
          <div style="margin-top:4px;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#555">password reset</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fffdf7;padding:40px 40px 36px;border-left:2px solid #07090b;border-right:2px solid #07090b">
          <h1 style="margin:0 0 8px;font-size:36px;font-weight:900;letter-spacing:-0.03em;color:#07090b;line-height:1.05;font-family:Georgia,serif">
            Reset your
          </h1>
          <h1 style="margin:0 0 24px;font-size:36px;font-weight:900;letter-spacing:-0.03em;color:#07090b;line-height:1.05;font-family:Georgia,serif">
            <span style="background:#c8ff3d;padding:2px 12px;border-radius:10px;display:inline-block">password.</span>
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#2a2540;line-height:1.65">
            We received a request to reset the password on your Curly Sports account.
            Click the button below to choose a new one.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px">
            <tr><td style="background:#07090b;border-radius:999px;box-shadow:4px 4px 0 #c8ff3d">
              <a href="${resetUrl}"
                 style="display:block;padding:16px 40px;color:#c8ff3d;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.02em;white-space:nowrap">
                Set new password →
              </a>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px">
            <tr><td style="background:#f4ede0;border-radius:10px;border:1.5px solid #e0d8cc;padding:14px 18px">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size:18px;vertical-align:top;padding-right:12px;width:24px">⏱</td>
                  <td style="font-size:13px;color:#2a2540;line-height:1.5">
                    This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your account is unchanged.
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
          <hr style="border:none;border-top:1.5px solid #ede5d8;margin:0 0 20px">
          <p style="margin:0;font-size:12px;color:#999;line-height:1.6">
            Button not working? Paste this link into your browser:<br>
            <a href="${resetUrl}" style="color:#999;word-break:break-all;font-size:11px">${resetUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#07090b;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border:2px solid #07090b">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444">
            CURLYSPORTS.COM &nbsp;·&nbsp; MADE IN A BEDROOM
          </p>
          <p style="margin:6px 0 0;font-size:10px;color:#333">
            You're receiving this because a password reset was requested for your account.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
