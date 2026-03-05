import { type AuditEntry } from '@/types';

// In production, persist to DB (e.g. Firestore, Postgres). Here we keep in-memory for demo.
const auditLog: AuditEntry[] = [];

export function logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  auditLog.push({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
}

export function getAuditLog(limit = 100): AuditEntry[] {
  return [...auditLog].reverse().slice(0, limit);
}
