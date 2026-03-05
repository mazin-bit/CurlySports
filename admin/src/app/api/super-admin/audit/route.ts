import { NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/audit';
import { requireSuperAdminAccess } from '@/lib/require-role';

export async function GET() {
  const { payload, response } = await requireSuperAdminAccess();
  if (response) return response;
  const entries = getAuditLog(100);
  return NextResponse.json(entries);
}
