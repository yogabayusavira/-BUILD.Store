/**
 * Meeting minutes / recording rail — sandbox mock store.
 *
 * One row per captured minute. Each row carries either a free-text
 * body (`format === "notes"`) or a recording URL (`format ===
 * "recording"`). Other attendees can append corrections to the row.
 *
 * Routing context (`project_scoped` / `team_governance` /
 * `peer_one_on_one`) determines which log surfaces this minute beyond
 * the originating meeting view.
 *
 * REPLACE WITH: `meeting_minutes` Drizzle table + `meeting_minute_corrections`
 * append-only table.
 */
import type { MeetingMinute } from "@/lib/types";

export const MOCK_MEETING_MINUTES: MeetingMinute[] = [];

export function minuteForMeeting(meetingId: string): MeetingMinute | null {
  return MOCK_MEETING_MINUTES.find((m) => m.meetingId === meetingId) ?? null;
}

export function minutesByRouting(
  routing: MeetingMinute["routing"],
): MeetingMinute[] {
  return MOCK_MEETING_MINUTES
    .filter((m) => m.routing === routing)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export function recentMinutes(limit = 20): MeetingMinute[] {
  return [...MOCK_MEETING_MINUTES]
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .slice(0, limit);
}
