import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optionalAuth } from "@/lib/auth";

const CATEGORIES = ["bug", "feature", "ui", "performance", "other"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, subject, message, rating, email } = body;

    if (!category || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json({ error: "Subject must be at least 3 characters" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
    }
    if (rating !== undefined && rating !== null && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const user = await optionalAuth();
      userId = user?.id ?? null;
    } catch { /* not logged in */ }

    // Auto-create table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        "userId" TEXT,
        email TEXT,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        rating INTEGER,
        status TEXT NOT NULL DEFAULT 'open',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO feedback (id, "userId", email, category, subject, message, rating, status, "createdAt")
      VALUES (${id}, ${userId}, ${email?.trim() || null}, ${category.trim()}, ${subject.trim()}, ${message.trim()}, ${rating ?? null}, 'open', NOW())
    `;

    return NextResponse.json({ id, success: true });
  } catch (err) {
    console.error("Feedback error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to submit feedback", debug: msg }, { status: 500 });
  }
}
