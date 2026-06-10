import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Generate a password recovery link — no email sent by Supabase
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await sendEmail({
    to: email,
    subject: "Reset your Curly Sports password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#111">Reset your password</h2>
        <p>We received a request to reset the password for your Curly Sports account.</p>
        <a href="${data.properties.action_link}"
           style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset password →
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px">
          This link expires in 1 hour. If you didn't request a reset, ignore this email.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
