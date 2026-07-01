/**
 * Shared cooperative calendar — sandbox mock store.
 *
 * Three primitives:
 *   - MOCK_AVAILABILITY  : weekly recurring availability windows per Member.
 *   - MOCK_BLOCKS        : one-off blocks (out, focus time, personal).
 *   - MOCK_MEETINGS      : scheduled meetings (peer / external / governance).
 *
 * Per the locked architecture in `future-modern.md`:
 *   - Member-to-Member peer bookings are autonomous (both calendars sync
 *     when accepted).
 *   - External client → Member bookings route through the FM agent layer
 *     (the meeting carries a `pmUserId` referencing the account-owning
 *     admin who'll be in the loop).
 *   - Partners do NOT appear as bookable on the shared calendar; their
 *     bookings flow through FM agent as the standing posture.
 *   - Internal Member-to-Member meetings require minutes or recording
 *     (the rail is locked separately; the field `notesPreview` carries
 *     the sandbox stub).
 *
 * REPLACE WITH: `calendar_availability`, `calendar_blocks`,
 * `calendar_meetings` Drizzle tables + Cal.com self-hosted (or Google
 * Calendar API + Microsoft Graph) integration for the real availability
 * sync. See production-swap-checklist §7j.
 */
import type {
  CalendarAvailability,
  CalendarBlock,
  CalendarMeeting,
} from "@/lib/types";

/** Helper: minutes-from-midnight for a clock time. */
function hm(h: number, m: number = 0): number {
  return h * 60 + m;
}

/** Helper: ISO datetime N days from today at given hour. */
function daysFromNow(days: number, hour: number, minute: number = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/*  Weekly availability — seeded per Member                            */
/* ------------------------------------------------------------------ */

export const MOCK_AVAILABILITY: CalendarAvailability[] = [
  // Jamar — Mon-Thu 10am-5pm, Fri 10am-2pm.
  ...[1, 2, 3, 4].map((day, idx) => ({
    id: `av_jamar_${idx}`,
    userId: "u_jamar",
    dayOfWeek: day as 1 | 2 | 3 | 4,
    startMinute: hm(10),
    endMinute: hm(17),
    timezone: "America/New_York",
    createdAt: "2026-05-01T00:00:00Z",
  })),
  {
    id: "av_jamar_fri",
    userId: "u_jamar",
    dayOfWeek: 5 as const,
    startMinute: hm(10),
    endMinute: hm(14),
    timezone: "America/New_York",
    createdAt: "2026-05-01T00:00:00Z",
  },
  // BBG — Wed-Sat 12pm-7pm (creative-strategy schedule).
  ...[3, 4, 5, 6].map((day, idx) => ({
    id: `av_bbg_${idx}`,
    userId: "u_bbg",
    dayOfWeek: day as 3 | 4 | 5 | 6,
    startMinute: hm(12),
    endMinute: hm(19),
    timezone: "America/New_York",
    createdAt: "2026-05-01T00:00:00Z",
  })),
  // Tolgay — Mon-Wed 9am-3pm.
  ...[1, 2, 3].map((day, idx) => ({
    id: `av_tolgay_${idx}`,
    userId: "u_tolgay",
    dayOfWeek: day as 1 | 2 | 3,
    startMinute: hm(9),
    endMinute: hm(15),
    timezone: "Europe/Istanbul",
    createdAt: "2026-05-01T00:00:00Z",
  })),
  // Keyboard Kid — Tue/Thu evenings only (10pm-1am — provisional Member, casual).
  ...[2, 4].map((day, idx) => ({
    id: `av_kk_${idx}`,
    userId: "u_keyboard_kid",
    dayOfWeek: day as 2 | 4,
    startMinute: hm(22),
    endMinute: hm(25), // wraps; sandbox treats end > 1440 as next-day spillover
    timezone: "America/Los_Angeles",
    createdAt: "2026-05-01T00:00:00Z",
  })),
  // Sunny — Mon-Fri 11am-4pm (design lens works best in the middle of the day).
  ...[1, 2, 3, 4, 5].map((day, idx) => ({
    id: `av_sunny_${idx}`,
    userId: "u_sunny",
    dayOfWeek: day as 1 | 2 | 3 | 4 | 5,
    startMinute: hm(11),
    endMinute: hm(16),
    timezone: "America/New_York",
    createdAt: "2026-05-15T00:00:00Z",
  })),
];

/* ------------------------------------------------------------------ */
/*  One-off blocks                                                     */
/* ------------------------------------------------------------------ */

export const MOCK_BLOCKS: CalendarBlock[] = [
  {
    id: "blk_001",
    userId: "u_jamar",
    startsAt: daysFromNow(3, 13),
    endsAt: daysFromNow(3, 16),
    reason: "Focus block — newsletter draft",
    createdAt: "2026-06-25T00:00:00Z",
  },
  {
    id: "blk_002",
    userId: "u_tolgay",
    startsAt: daysFromNow(5, 9),
    endsAt: daysFromNow(7, 18),
    reason: "Travel",
    createdAt: "2026-06-20T00:00:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Scheduled meetings                                                 */
/* ------------------------------------------------------------------ */

export const MOCK_MEETINGS: CalendarMeeting[] = [
  // Peer internal: Jamar + BBG sync on creative strategy.
  {
    id: "mt_001",
    title: "Creative strategy weekly",
    description: "Weekly sync on EPK cohort + upcoming releases.",
    startsAt: daysFromNow(2, 14),
    endsAt: daysFromNow(2, 15),
    kind: "peer_internal",
    organizerId: "u_jamar",
    attendeeIds: ["u_jamar", "u_bbg"],
    confirmedByAttendeeIds: ["u_jamar", "u_bbg"],
    status: "confirmed",
    externalClientName: null,
    externalClientEmail: null,
    projectId: null,
    pmUserId: null,
    notesPreview: null,
    recordingUrl: null,
    createdAt: "2026-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
  },

  // Team governance: monthly cooperative meeting.
  {
    id: "mt_002",
    title: "Monthly cooperative meeting",
    description:
      "All-Member sync. MVP standing review, recognition selection, anything raised by Members.",
    startsAt: daysFromNow(6, 15),
    endsAt: daysFromNow(6, 16, 30),
    kind: "team_governance",
    organizerId: "u_jamar",
    attendeeIds: ["u_jamar", "u_bbg", "u_tolgay", "u_keyboard_kid"],
    confirmedByAttendeeIds: ["u_jamar", "u_bbg"],
    status: "pending",
    externalClientName: null,
    externalClientEmail: null,
    projectId: null,
    pmUserId: null,
    notesPreview: null,
    recordingUrl: null,
    createdAt: "2026-06-22T00:00:00Z",
    updatedAt: "2026-06-22T00:00:00Z",
  },

  // External client: URL Media discovery call (Jamar account-owning,
  // talent in delivery role).
  {
    id: "mt_003",
    title: "URL Media — next-issue scoping",
    description:
      "Scope the next editorial cycle. PM owns the brief; Aliza on for delivery context.",
    startsAt: daysFromNow(4, 16),
    endsAt: daysFromNow(4, 17),
    kind: "external_client",
    organizerId: "u_jamar",
    attendeeIds: ["u_jamar", "u_aliza"],
    confirmedByAttendeeIds: ["u_jamar"],
    status: "pending",
    externalClientName: "Devon Patel (URL Media)",
    externalClientEmail: "devon@url-media.example",
    projectId: "p_004",
    pmUserId: "u_jamar",
    notesPreview: null,
    recordingUrl: null,
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Read helpers                                                       */
/* ------------------------------------------------------------------ */

export function availabilityForUser(userId: string): CalendarAvailability[] {
  return MOCK_AVAILABILITY.filter((a) => a.userId === userId).sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek || a.startMinute - b.startMinute,
  );
}

export function blocksForUser(userId: string): CalendarBlock[] {
  return MOCK_BLOCKS.filter((b) => b.userId === userId).sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt),
  );
}

export function meetingsForUser(userId: string): CalendarMeeting[] {
  return MOCK_MEETINGS
    .filter((m) => m.attendeeIds.includes(userId))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function upcomingMeetingsForUser(
  userId: string,
  windowDays = 14,
): CalendarMeeting[] {
  const now = new Date().toISOString();
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + windowDays);
  const horizonIso = horizon.toISOString();
  return meetingsForUser(userId).filter(
    (m) => m.startsAt > now && m.startsAt < horizonIso,
  );
}

export function upcomingCooperativeMeetings(windowDays = 14): CalendarMeeting[] {
  const now = new Date().toISOString();
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + windowDays);
  const horizonIso = horizon.toISOString();
  return MOCK_MEETINGS
    .filter((m) => m.startsAt > now && m.startsAt < horizonIso)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function meetingById(id: string): CalendarMeeting | null {
  return MOCK_MEETINGS.find((m) => m.id === id) ?? null;
}
