import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/utils/supabase/admin";
import crypto from "crypto";

// POST /api/upload — upload an image to Supabase storage
export async function POST(req: NextRequest) {
  // Allow admin token OR logged-in user
  const adminPw = process.env.ADMIN_PASSWORD;
  const adminToken = req.headers.get("x-admin-token") || "";
  const isAdmin = adminPw && adminToken === adminPw;

  if (!isAdmin) {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
  }

  const fd = (await req.formData()) as unknown as globalThis.FormData;
  const file = fd.get("file") as File | null;

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabaseAdmin.storage
    .from("post-images")
    .upload(path, buffer, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("post-images")
    .getPublicUrl(data.path);

  return NextResponse.json({ url: urlData.publicUrl });
}
