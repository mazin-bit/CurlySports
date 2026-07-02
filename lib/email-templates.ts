import { readFileSync } from "fs";
import { join } from "path";

let _mascotBuffer: Buffer | null = null;

/** Returns the curly-guy.png as a Buffer (cached after first read). */
export function getMascotAttachment(): { filename: string; content: Buffer; cid: string } {
  if (!_mascotBuffer) {
    _mascotBuffer = readFileSync(join(process.cwd(), "public", "curly-guy.png"));
  }
  return { filename: "curly-guy.png", content: _mascotBuffer, cid: "curly-mascot" };
}

/** OTP verification email template — matches the existing Curly Sports brand style. */
export function buildOtpEmail(otp: string, appUrl: string): string {
  return `<!DOCTYPE html>
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
          <img src="cid:curly-mascot" width="150" height="150" alt="Curly" style="width:150px;height:150px;display:block;object-fit:cover;"/>
        </div>
        <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#0c0a1d;letter-spacing:0.06em;margin:0 0 20px;opacity:0.6;text-transform:uppercase;">Verification code</p>
      </td></tr>
      <tr><td style="background:#0c0a1d;padding:10px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;color:#fffdf7;letter-spacing:0.08em;text-transform:uppercase;">&bull;&nbsp;<span style="color:#c8ff3d;">CURLY SPORTS</span>&nbsp;&middot;&nbsp;EMAIL VERIFICATION</td>
          <td align="right" style="font-family:'Courier New',monospace;font-size:10px;color:rgba(255,253,247,0.38);text-transform:uppercase;letter-spacing:0.06em;">curlysports.com</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#fffdf7;border:2px solid #0c0a1d;border-top:none;padding:36px 40px 32px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-weight:900;font-size:44px;line-height:1.0;letter-spacing:-1.5px;color:#0c0a1d;margin-bottom:16px;">Your <em style="font-style:italic;background:#c8ff3d;padding:0 10px 3px;border-radius:10px;display:inline;">code.</em></div>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(12,10,29,0.7);line-height:1.65;margin:0 0 28px;">Enter this 6-digit code to verify your email and activate your Curly Sports account.</p>
        <div style="text-align:center;margin:0 0 28px;">
          <div style="display:inline-block;background:#0c0a1d;border:2px solid #0c0a1d;border-radius:14px;padding:18px 32px;box-shadow:5px 5px 0 #ff5b3d;letter-spacing:12px;font-family:'Courier New',monospace;font-size:36px;font-weight:900;color:#c8ff3d;">${otp}</div>
        </div>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(12,10,29,0.5);line-height:1.5;margin:0 0 20px;">This code expires in <strong>10 minutes</strong>. If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1.5px solid #ede5d8;margin:0 0 20px">
        <p style="margin:0;font-size:12px;color:#999;line-height:1.6">
          Do not share this code with anyone. Curly Sports will never ask you for it.
        </p>
      </td></tr>
      <tr><td style="background:#0c0a1d;border:2px solid #0c0a1d;border-top:none;border-radius:0 0 20px 20px;padding:18px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,253,247,0.35);line-height:1.7;">
          &copy; 2026 Curly Sports &middot; <a href="${appUrl}" style="color:rgba(200,255,61,0.65);">curlysports.com</a><br/>
          <a href="${appUrl}/privacy" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Privacy</a>&nbsp;&middot;&nbsp;<a href="${appUrl}/terms" style="color:rgba(255,253,247,0.3);text-decoration:underline;">Terms</a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
