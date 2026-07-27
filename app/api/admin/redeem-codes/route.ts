import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureChallengeTables, cuid } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ── Admin auth ─────────────────────────────────────────────────────── */
function authorize(req: NextRequest): boolean {
  const adminPw = process.env.ADMIN_PASSWORD;
  const token = req.headers.get("x-admin-token") || req.headers.get("authorization")?.replace("Bearer ", "");
  return !!(adminPw && token === adminPw);
}

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface ReferralCodeRow {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  totalEntries: number;
  createdAt: Date;
  username: string | null;
  email: string | null;
  avatar: string | null;
  isPromo: boolean;
  label: string | null;
  disabled: boolean;
  maxUses: number | null;
}

interface ReferralRow {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  status: string;
  createdAt: Date;
  referrerUsername: string | null;
  referredUsername: string | null;
  referredEmail: string | null;
}

interface CountRow {
  count: number;
}

/* ── GET — List all referral/promo codes ────────────────────────────── */
export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // all | referral | promo
    const codeId = searchParams.get("codeId"); // get redemptions for a specific code

    // If codeId is provided, return redemption history for that code
    if (codeId) {
      const redemptions = await prisma.$queryRawUnsafe<ReferralRow[]>(
        `SELECT r.id, r."referrerUserId", r."referredUserId", r.status, r."createdAt",
                u1.username AS "referrerUsername",
                u2.username AS "referredUsername",
                u2.email AS "referredEmail"
         FROM referrals r
         LEFT JOIN users u1 ON r."referrerUserId" = u1.id
         LEFT JOIN users u2 ON r."referredUserId" = u2.id
         WHERE r."referralCodeId" = $1
         ORDER BY r."createdAt" DESC`,
        codeId
      );
      return NextResponse.json({ redemptions });
    }

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | boolean)[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(rc.code ILIKE $${paramIdx} OR COALESCE(u.username, '') ILIKE $${paramIdx} OR COALESCE(rc.label, '') ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (type === "promo") {
      conditions.push(`rc."isPromo" = true`);
    } else if (type === "referral") {
      conditions.push(`(rc."isPromo" = false OR rc."isPromo" IS NULL)`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countRows = await prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*)::int AS count FROM referral_codes rc LEFT JOIN users u ON rc."userId" = u.id ${where}`,
      ...params
    );
    const total = countRows[0]?.count ?? 0;

    // Get codes with user info
    const codes = await prisma.$queryRawUnsafe<ReferralCodeRow[]>(
      `SELECT rc.id, rc."userId", rc.code, rc."totalReferrals"::int AS "totalReferrals",
              rc."totalEntries"::int AS "totalEntries", rc."createdAt",
              u.username, u.email, u.avatar,
              COALESCE(rc."isPromo", false) AS "isPromo",
              rc.label, COALESCE(rc.disabled, false) AS disabled,
              rc."maxUses"::int AS "maxUses"
       FROM referral_codes rc
       LEFT JOIN users u ON rc."userId" = u.id
       ${where}
       ORDER BY rc."createdAt" DESC
       LIMIT 100`,
      ...params
    );

    return NextResponse.json({ codes, total });
  } catch (error) {
    console.error("[GET /api/admin/redeem-codes]", error);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

/* ── POST — Create a promo code ─────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const body = await req.json();
    const { code, label, maxUses } = body;

    if (!code || typeof code !== "string" || code.length < 3) {
      return NextResponse.json({ error: "Code must be at least 3 characters" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Check for collision
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM referral_codes WHERE code = $1`,
      cleanCode
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    }

    const id = cuid();
    // Promo codes use a unique generated userId (userId is UNIQUE in table)
    const systemUserId = `promo-${id}`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO referral_codes (id, "userId", code, "totalReferrals", "totalEntries", "createdAt", "isPromo", label, "maxUses")
       VALUES ($1, $2, $3, 0, 0, NOW(), true, $4, $5)`,
      id, systemUserId, cleanCode, label || null, maxUses || null
    );

    return NextResponse.json({ id, code: cleanCode, label, maxUses }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/redeem-codes]", error);
    return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
  }
}

/* ── PATCH — Update a code (disable/enable, update label) ───────────── */
export async function PATCH(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const body = await req.json();
    const { id, disabled, label, maxUses, action } = body;

    // Reset all referral data
    if (action === "reset-all") {
      await prisma.$executeRawUnsafe(`DELETE FROM referrals`);
      await prisma.$executeRawUnsafe(`UPDATE referral_codes SET "totalReferrals" = 0, "totalEntries" = 0`);
      await prisma.$executeRawUnsafe(`DELETE FROM challenge_entries`);
      return NextResponse.json({ success: true, message: "All referral data reset" });
    }

    if (!id) {
      return NextResponse.json({ error: "Code ID is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const params: (string | boolean | number | null)[] = [];
    let paramIdx = 1;

    if (typeof disabled === "boolean") {
      updates.push(`disabled = $${paramIdx}`);
      params.push(disabled);
      paramIdx++;
    }
    if (typeof label === "string") {
      updates.push(`label = $${paramIdx}`);
      params.push(label || null);
      paramIdx++;
    }
    if (typeof maxUses === "number" || maxUses === null) {
      updates.push(`"maxUses" = $${paramIdx}`);
      params.push(maxUses);
      paramIdx++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    params.push(id);
    await prisma.$executeRawUnsafe(
      `UPDATE referral_codes SET ${updates.join(", ")} WHERE id = $${paramIdx}`,
      ...params
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/redeem-codes]", error);
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  }
}

/* ── DELETE — Delete a code ─────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureChallengeTables();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Code ID is required" }, { status: 400 });
    }

    // Delete associated referrals first
    await prisma.$executeRawUnsafe(
      `DELETE FROM referrals WHERE "referralCodeId" = $1`,
      id
    );

    // Delete the code
    await prisma.$executeRawUnsafe(
      `DELETE FROM referral_codes WHERE id = $1`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/redeem-codes]", error);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}
