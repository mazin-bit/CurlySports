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
    subject: "Welcome to Curly Sports! 🏆",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#111">Welcome to Curly Sports, ${username}!</h2>
        <p>Your account is ready. Jump in and start arguing with actual data.</p>
        <a href="${appUrl}/login"
           style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Go to Curly Sports →
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px">
          You received this because you signed up at curlysports.com.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ user: data.user });
}
