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

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        email: email?.trim() || null,
        category: category.trim(),
        subject: subject.trim(),
        message: message.trim(),
        rating: rating ?? null,
      },
    });

    return NextResponse.json({ id: feedback.id, success: true });
  } catch (err) {
    console.error("Feedback error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to submit feedback", detail: msg }, { status: 500 });
  }
}
