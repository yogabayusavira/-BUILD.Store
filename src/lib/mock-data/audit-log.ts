/**
 * Audit log — SOC 2 CC7.2 / ISO 27001 A.12.4 sandbox implementation.
 *
 * Append-only in memory. Server actions call `logAuditEvent()` after
 * every security/financial/compliance-adjacent mutation. The
 * `/admin/audit-log` and `/admin/compliance` surfaces read from here.
 *
 * PRODUCTION SWAP:
 *   - Replace this in-memory array with a Drizzle `audit_log` table.
 *   - Revoke UPDATE/DELETE grants on the database role that the app
 *     uses; only the DBA break-glass role can perform maintenance,
 *     and any exercise of it is itself audited (out-of-band).
 *   - Ship a copy of every insert to a WORM (write-once-read-many)
 *     store — S3 Object Lock in Compliance mode, or equivalent —
 *     within one business day (SOC 2 CC7.2 evidence).
 *   - Retention: 12 months hot, 7 years cold for financial subset
 *     (any `contract.*` or `mvp.compliance_*` action).
 *   - IP-hint field must last-octet-mask before writing.
 */
import type {
  AuditLogAction,
  AuditLogEntry,
  AuditLogResourceKind,
  MembershipTier,
} from "@/lib/types";

/** Append-only sandbox store. NEVER mutate existing entries in place. */
export const MOCK_AUDIT_LOG: AuditLogEntry[] = [];

/** Monotonically increasing id counter for sandbox entries. */
let _auditSeq = 0;
function nextAuditId(): string {
  _auditSeq += 1;
  return `audit_${Date.now()}_${_auditSeq.toString().padStart(6, "0")}`;
}

/**
 * Snapshot the role from the actor at the moment of the action so
 * historical entries stay meaningful even if the actor's role
 * changes later.
 */
export function snapshotActorRole(
  actor: { membershipTier: MembershipTier; isAdmin?: boolean | null } | null,
): AuditLogEntry["actorRoleSnapshot"] {
  if (actor === null) return "system";
  if (actor.isAdmin) return "admin";
  return actor.membershipTier;
}

/**
 * Mask an IP address to its /24 prefix. Called at write time — full
 * IPs never enter the log store. Sandbox stub just passes through
 * whatever the caller provided; production wraps `req.ip` or the
 * X-Forwarded-For header parse.
 */
export function maskIpHint(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // IPv4 last-octet mask
  const v4 = raw.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (v4) return `${v4[1]}.0`;
  // IPv6 first-64-bit prefix mask (sandbox-simple)
  const parts = raw.split(":");
  if (parts.length > 4) return `${parts.slice(0, 4).join(":")}::/64`;
  return raw;
}

/**
 * Write one audit entry. All fields required except:
 *   - actorUserId + actorRoleSnapshot: null/"system" for system events
 *   - before: null for creation and sign-in events
 *   - after: null for deletion and sign-in events
 *   - ipHint, sessionHint, reason: null when unavailable
 *
 * Never call this from a component render path — only from server
 * actions or API routes where the mutation is actually committed.
 */
export function logAuditEvent(input: {
  actorUserId: string | null;
  actorRoleSnapshot: AuditLogEntry["actorRoleSnapshot"];
  action: AuditLogAction;
  resourceKind: AuditLogResourceKind;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipHint?: string | null;
  sessionHint?: string | null;
  reason?: string | null;
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: nextAuditId(),
    actorUserId: input.actorUserId,
    actorRoleSnapshot: input.actorRoleSnapshot,
    action: input.action,
    resourceKind: input.resourceKind,
    resourceId: input.resourceId,
    before: input.before ?? null,
    after: input.after ?? null,
    ipHint: maskIpHint(input.ipHint),
    sessionHint: input.sessionHint ?? null,
    reason: input.reason ?? null,
    createdAt: new Date().toISOString(),
  };
  MOCK_AUDIT_LOG.push(entry);
  return entry;
}

/** Read helper — reverse-chron, admin-only caller responsibility. */
export function readAuditLog(options?: {
  actorUserId?: string;
  action?: AuditLogAction;
  resourceKind?: AuditLogResourceKind;
  resourceId?: string;
  since?: string;
  limit?: number;
}): AuditLogEntry[] {
  const filtered = MOCK_AUDIT_LOG.filter((e) => {
    if (options?.actorUserId && e.actorUserId !== options.actorUserId) {
      return false;
    }
    if (options?.action && e.action !== options.action) return false;
    if (options?.resourceKind && e.resourceKind !== options.resourceKind) {
      return false;
    }
    if (options?.resourceId && e.resourceId !== options.resourceId) {
      return false;
    }
    if (options?.since && e.createdAt < options.since) return false;
    return true;
  });
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (options?.limit && options.limit > 0) {
    return filtered.slice(0, options.limit);
  }
  return filtered;
}
