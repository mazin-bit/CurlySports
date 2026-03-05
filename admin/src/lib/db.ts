import { PrismaClient } from '@prisma/client';
import type { Role } from '@/types';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/** Map Prisma Role enum (MEMBER | ADMIN | SUPER_ADMIN) to our Role type */
export function mapPrismaRole(role: string): Role {
  if (role === 'SUPER_ADMIN') return 'super_admin';
  if (role === 'ADMIN') return 'admin';
  return 'member';
}
