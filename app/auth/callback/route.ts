import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") ?? "/dashboard";
  const safeNext =
    state.startsWith("/") && !state.startsWith("//") ? state : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=google_token_failed`);
    }

    const { access_token } = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        `${origin}/login?error=google_userinfo_failed`
      );
    }

    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Upsert user in Prisma
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: googleUser.email }] },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.id,
          name: user.name || googleUser.name,
          avatar: user.avatar || googleUser.picture,
          emailVerified: true,
        },
      });
    } else {
      const baseUsername = googleUser.email.split("@")[0];
      const username = `${baseUsername}_${Date.now().toString(36)}`;
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          username,
          googleId: googleUser.id,
          name: googleUser.name,
          avatar: googleUser.picture,
          emailVerified: true,
        },
      });
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user),
      signRefreshToken(user.id),
    ]);

    const response = NextResponse.redirect(`${origin}${safeNext}`);
    return setAuthCookies(response, accessToken, refreshToken);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }
}
