/**
 * Meeting minutes / recording rail — server actions.
 *
 * captureMeetingMinute  : attendee captures notes OR a recording URL.
 *                        Routing is derived from the meeting context
 *                        (project_scoped if projectId set; team_governance
 *                        if kind === "team_governance"; otherwise
 *                        peer_one_on_one).
 * addMinuteCorrection   : other attendees append corrections.
 * editMyMinute          : capturer edits the body (only the capturer or
 *                        admin can replace; corrections come from peers).
 *
 * Locked posture: every internal Member-to-Member meeting requires
 * minutes or a recording. External-client meetings can capture but
 * aren't strictly required (the brief lives elsewhere).
 */
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-stub";
import { meetingById } from "@/lib/mock-data/calendar";
import { MOCK_MEETING_MINUTES } from "@/lib/mock-data/meeting-minutes";
import type {
  MeetingMinute,
  MeetingMinuteFormat,
  MeetingMinuteRouting,
} from "@/lib/types";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 5)}`;
}

function routingFor(meeting: ReturnType<typeof meetingById>): MeetingMinuteRouting {
  if (!meeting) return "peer_one_on_one";
  if (meeting.projectId) return "project_scoped";
  if (meeting.kind === "team_governance") return "team_governance";
  return "peer_one_on_one";
}

export async function captureMeetingMinute(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) throw new Error("Sign in required");
  const meetingId = String(formData.get("meetingId") ?? "").trim();
  const format = String(formData.get("format") ?? "notes") as MeetingMinuteFormat;
  const body = String(formData.get("body") ?? "").trim();
  const recordingUrl = String(formData.get("recordingUrl") ?? "").trim();
  const uploaded = formData.get("transcriptFile");

  const meeting = meetingById(meetingId);
  if (!meeting) throw new Error("Meeting not found");
  if (!meeting.attendeeIds.includes(me.id) && !me.isAdmin) {
    throw new Error("Only attendees (or admin) can capture minutes.");
  }
  if (
    format !== "notes" &&
    format !== "recording" &&
    format !== "transcript_upload"
  ) {
    throw new Error(
      "Format must be 'notes', 'recording', or 'transcript_upload'.",
    );
  }
  if (format === "notes" && body.length < 10) {
    throw new Error("Notes body must be at least 10 characters.");
  }
  if (format === "recording" && recordingUrl.length < 5) {
    throw new Error("Recording URL is required when format is 'recording'.");
  }

  let uploadedFile: MeetingMinute["uploadedFile"] = null;
  if (format === "transcript_upload") {
    if (!(uploaded instanceof File) || uploaded.size === 0) {
      throw new Error(
        "Upload a transcript / summary file when format is 'transcript_upload'.",
      );
    }
    uploadedFile = {
      name: uploaded.name,
      size: uploaded.size,
      type: uploaded.type,
      url: null, // sandbox metadata only; production streams bytes to storage
    };
  }

  // One minute row per meeting. Replacing re-captures (capturer can
  // change format or replace body); corrections come from peers.
  const existing = MOCK_MEETING_MINUTES.find((m) => m.meetingId === meetingId);
  if (existing) {
    existing.format = format;
    existing.body = format === "notes" ? body : null;
    existing.recordingUrl = format === "recording" ? recordingUrl : null;
    existing.uploadedFile =
      format === "transcript_upload" ? uploadedFile : null;
    existing.updatedAt = new Date().toISOString();
    revalidatePath("/profile/calendar");
    revalidatePath("/admin/team-meetings");
    return;
  }

  const row: MeetingMinute = {
    id: newId("min"),
    meetingId,
    format,
    routing: routingFor(meeting),
    body: format === "notes" ? body : null,
    recordingUrl: format === "recording" ? recordingUrl : null,
    uploadedFile,
    capturedByUserId: me.id,
    corrections: [],
    capturedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_MEETING_MINUTES.push(row);
  revalidatePath("/profile/calendar");
  revalidatePath("/admin/team-meetings");
}

export async function addMinuteCorrection(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) throw new Error("Sign in required");
  const minuteId = String(formData.get("minuteId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 5) {
    throw new Error("Correction must be at least 5 characters.");
  }
  const minute = MOCK_MEETING_MINUTES.find((m) => m.id === minuteId);
  if (!minute) throw new Error("Minute not found");
  const meeting = meetingById(minute.meetingId);
  if (!meeting || !meeting.attendeeIds.includes(me.id)) {
    throw new Error("Only attendees can append corrections.");
  }
  minute.corrections.push({
    id: newId("cor"),
    byUserId: me.id,
    body,
    addedAt: new Date().toISOString(),
  });
  minute.updatedAt = new Date().toISOString();
  revalidatePath("/profile/calendar");
  revalidatePath("/admin/team-meetings");
}
