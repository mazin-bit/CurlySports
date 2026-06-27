import { z } from "zod";

// ─── Auth ───────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
});

// ─── Posts ───────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content must be 2000 characters or less")
    .transform((s) => s.trim()),
  sport: z.string().max(50).optional().default("football"),
  tag: z.string().max(50).optional().default("DEBATE"),
  image_url: z.string().url().max(2000).nullish(),
  poll: z
    .object({
      options: z.array(z.string().min(1).max(200)).min(2).max(6),
    })
    .nullish(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment is required")
    .max(1000, "Comment must be 1000 characters or less")
    .transform((s) => s.trim()),
});

export const voteSchema = z.object({
  optionIndex: z.number().int().min(0).max(10),
});

// ─── Debates ────────────────────────────────────────────────────────────────

export const createDebateSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question must be 500 characters or less"),
  optionA: z.string().min(1).max(200, "Option A must be 200 characters or less"),
  optionB: z.string().min(1).max(200, "Option B must be 200 characters or less"),
  sport: z.enum(["FOOTBALL", "BASKETBALL", "NFL", "TENNIS", "BASEBALL", "F1", "CRICKET", "HOCKEY", "GOLF", "BOXING"]).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const debateVoteSchema = z.object({
  option: z.enum(["A", "B"], { message: "option must be 'A' or 'B'" }),
});

// ─── Favorites ──────────────────────────────────────────────────────────────

export const favoriteSchema = z.object({
  teamId: z.string().max(100).nullish(),
  playerId: z.string().max(100).nullish(),
}).refine((d) => d.teamId || d.playerId, {
  message: "teamId or playerId is required",
});

// ─── Comment likes ──────────────────────────────────────────────────────────

export const commentLikeSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID"),
});

// ─── Admin ──────────────────────────────────────────────────────────────────

export const adminAuthSchema = z.object({
  password: z.string().min(1, "Password is required").max(200),
});

// ─── Helper to parse and return error response ──────────────────────────────

import { NextResponse } from "next/server";

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    return {
      success: false,
      response: NextResponse.json({ error: firstError }, { status: 400 }),
    };
  }
  return { success: true, data: result.data };
}
