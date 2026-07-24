import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fix = url.searchParams.get("fix");

  try {
    // Check current columns
    const cols = await prisma.$queryRaw<Array<{column_name: string}>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `;
    const colNames = cols.map(c => c.column_name);

    // Try to add missing columns if fix=true
    let fixResult = null;
    if (fix === "true") {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firebaseUid" TEXT`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone")`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_firebaseUid_key" ON "users"("firebaseUid")`);

        // Re-check columns
        const newCols = await prisma.$queryRaw<Array<{column_name: string}>>`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users'
          ORDER BY ordinal_position
        `;
        fixResult = { success: true, newColumns: newCols.map(c => c.column_name) };
      } catch (e) {
        fixResult = { success: false, error: String(e) };
      }
    }

    // Test findUnique
    let findError = null;
    try {
      await prisma.user.findUnique({ where: { email: "nonexistent@test.com" } });
    } catch (e) {
      findError = String(e);
    }

    // Check connection info
    const connInfo = await prisma.$queryRaw<Array<{current_database: string, current_user: string, search_path: string}>>`
      SELECT current_database(), current_user, current_setting('search_path') as search_path
    `;

    return NextResponse.json({
      columns: colNames,
      hasPhone: colNames.includes("phone"),
      findUniqueError: findError,
      connection: connInfo[0],
      fixResult,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
