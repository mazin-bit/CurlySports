import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { cuid } from "@/lib/ensure-challenge-tables";

export const dynamic = "force-dynamic";

/* ── Admin auth ─────────────────────────────────────────────────────── */
function isAdmin(req: Request): boolean {
  const tok = req.headers.get("x-admin-token") ?? "";
  const pw = process.env.ADMIN_PASSWORD ?? "";
  if (!pw || tok.length !== pw.length) return false;
  return timingSafeEqual(Buffer.from(tok), Buffer.from(pw));
}

/* ── Ensure table ───────────────────────────────────────────────────── */
let tableEnsured = false;

async function ensureLuckyDrawTable() {
  if (tableEnsured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS lucky_draws (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Lucky Draw',
      "prizeName" TEXT NOT NULL,
      "prizeValue" TEXT,
      "prizeImage" TEXT,
      "scheduledAt" TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      "winnerId" TEXT,
      "winnerName" TEXT,
      "winnerReferrals" INTEGER,
      "winnerAvatar" TEXT,
      "drawnAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    )
  `);
  tableEnsured = true;
}

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface LuckyDrawRow {
  id: string;
  title: string;
  prizeName: string;
  prizeValue: string | null;
  prizeImage: string | null;
  scheduledAt: Date;
  status: string;
  winnerId: string | null;
  winnerName: string | null;
  winnerReferrals: number | null;
  winnerAvatar: string | null;
  drawnAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReferralUser {
  userId: string;
  username: string;
  avatar: string | null;
  totalReferrals: number;
}

/* ── GET — List all draws ───────────────────────────────────────────── */
export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureLuckyDrawTable();

  const draws = await prisma.$queryRawUnsafe<LuckyDrawRow[]>(`
    SELECT * FROM lucky_draws ORDER BY "scheduledAt" DESC
  `);

  return NextResponse.json({ draws });
}

/* ── POST — Create a new draw ───────────────────────────────────────── */
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureLuckyDrawTable();

  const body = await req.json();
  const { title, prizeName, prizeValue, prizeImage, scheduledAt } = body;

  if (!prizeName || !scheduledAt) {
    return NextResponse.json(
      { error: "prizeName and scheduledAt are required" },
      { status: 400 }
    );
  }

  const id = cuid();
  const drawTitle = title || "Lucky Draw";

  await prisma.$executeRawUnsafe(
    `INSERT INTO lucky_draws (id, title, "prizeName", "prizeValue", "prizeImage", "scheduledAt", status)
     VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')`,
    id,
    drawTitle,
    prizeName,
    prizeValue || null,
    prizeImage || null,
    new Date(scheduledAt)
  );

  const rows = await prisma.$queryRawUnsafe<LuckyDrawRow[]>(
    `SELECT * FROM lucky_draws WHERE id = $1`,
    id
  );

  return NextResponse.json({ draw: rows[0] });
}

/* ── PATCH — Update/Action on draw ──────────────────────────────────── */
export async function PATCH(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: "id and action are required" },
      { status: 400 }
    );
  }

  switch (action) {
    case "spin": {
      try {
        // Set status to spinning
        await prisma.$executeRawUnsafe(
          `UPDATE lucky_draws SET status = 'spinning', "updatedAt" = now() WHERE id = $1`,
          id
        );

        // Fetch all eligible users: referral_codes with totalReferrals >= 1, not promo
        let participants: ReferralUser[] = [];
        try {
          participants = await prisma.$queryRawUnsafe<ReferralUser[]>(`
            SELECT
              rc."userId",
              COALESCE(u.username, u.name, 'Unknown') AS username,
              u.avatar,
              rc."totalReferrals"
            FROM referral_codes rc
            LEFT JOIN users u ON u.id = rc."userId"
            WHERE rc."totalReferrals" >= 1
              AND (rc."isPromo" IS NOT TRUE)
          `);
        } catch {
          // isPromo column might not exist — retry without it
          participants = await prisma.$queryRawUnsafe<ReferralUser[]>(`
            SELECT
              rc."userId",
              COALESCE(u.username, u.name, 'Unknown') AS username,
              u.avatar,
              rc."totalReferrals"
            FROM referral_codes rc
            LEFT JOIN users u ON u.id = rc."userId"
            WHERE rc."totalReferrals" >= 1
          `);
        }

        if (participants.length === 0) {
          // Reset status back
          await prisma.$executeRawUnsafe(
            `UPDATE lucky_draws SET status = 'scheduled', "updatedAt" = now() WHERE id = $1`,
            id
          );
          return NextResponse.json(
            { error: "No eligible participants found" },
            { status: 400 }
          );
        }

        // Weighted random selection: each user gets tickets = totalReferrals
        const totalTickets = participants.reduce(
          (sum, p) => sum + Number(p.totalReferrals),
          0
        );
        let randomTicket = Math.floor(Math.random() * totalTickets);
        let winner: ReferralUser = participants[0];

        for (const p of participants) {
          randomTicket -= Number(p.totalReferrals);
          if (randomTicket < 0) {
            winner = p;
            break;
          }
        }

        // Save winner info to DB so public API can read it during spinning state
        await prisma.$executeRawUnsafe(
          `UPDATE lucky_draws SET "winnerId" = $1, "winnerName" = $2, "winnerReferrals" = $3, "winnerAvatar" = $4, "updatedAt" = now() WHERE id = $5`,
          winner.userId,
          winner.username,
          Number(winner.totalReferrals),
          winner.avatar || null,
          id
        );

        return NextResponse.json({
          winner: {
            userId: winner.userId,
            username: winner.username,
            avatar: winner.avatar,
            referrals: Number(winner.totalReferrals),
          },
          participants: participants.map((p) => ({
            userId: p.userId,
            username: p.username,
            avatar: p.avatar,
            referrals: Number(p.totalReferrals),
          })),
        });
      } catch (err: unknown) {
        // Reset status on error
        await prisma.$executeRawUnsafe(
          `UPDATE lucky_draws SET status = 'scheduled', "updatedAt" = now() WHERE id = $1`,
          id
        ).catch(() => {});
        const msg = err instanceof Error ? err.message : "Spin failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    case "cancel": {
      await prisma.$executeRawUnsafe(
        `UPDATE lucky_draws SET status = 'cancelled', "updatedAt" = now() WHERE id = $1`,
        id
      );
      return NextResponse.json({ success: true });
    }

    case "complete": {
      const { winnerId, winnerName, winnerReferrals } = body;

      await prisma.$executeRawUnsafe(
        `UPDATE lucky_draws
         SET status = 'completed',
             "winnerId" = $2,
             "winnerName" = $3,
             "winnerReferrals" = $4,
             "drawnAt" = now(),
             "updatedAt" = now()
         WHERE id = $1`,
        id,
        winnerId || null,
        winnerName || null,
        winnerReferrals ?? null
      );

      const rows = await prisma.$queryRawUnsafe<LuckyDrawRow[]>(
        `SELECT * FROM lucky_draws WHERE id = $1`,
        id
      );

      return NextResponse.json({ draw: rows[0] });
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
  }
}

/* ── DELETE — Delete a draw ─────────────────────────────────────────── */
export async function DELETE(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.$executeRawUnsafe(
    `DELETE FROM lucky_draws WHERE id = $1`,
    id
  );

  return NextResponse.json({ success: true });
}
