import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Test raw query
    const cols = await prisma.$queryRaw<Array<{column_name: string}>>`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    // Test findUnique
    let findError = null;
    try {
      await prisma.user.findUnique({ where: { email: "nonexistent@test.com" } });
    } catch (e) {
      findError = String(e);
    }
    
    return NextResponse.json({
      columns: cols.map(c => c.column_name),
      findUniqueError: findError,
      prismaVersion: require("@prisma/client").Prisma.prismaVersion,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
