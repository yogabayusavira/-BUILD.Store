/**
 * EPK calendar booking flow.
 *
 * Locked three-step posture (`future-modern.md`):
 *   1. Requester picks slot from EPK, provides brief + contact, submits.
 *      Lands in /admin/inbound as a `booking_request`.
 *      A pending external_client meeting gets created with the FM agent
 *      (defaults to the artist's account-owning admin, or the first
 *      admin available) as the PM in the loop.
 *   2. Admin reviews the brief in /admin/inbound; approve via the
 *      inbound triage actions, or decline.
 *   3. On admin approve (status flips to "in_triage" → "converted"),
 *      the meeting carries forward; the artist sees it on their
 *      /profile/calendar and confirms or declines via the standard
 *      calendar flow.
 *
 * Sandbox: this action is public — any visitor can request a booking
 * since EPKs are public artifacts. Anti-spam and rate-limiting layer at
 * production via Cloudflare + the inbound queue.
 */
"use server";

import { revalidatePath } from "next/cache";
import { MOCK_USERS } from "@/lib/mock-data/users";
import { epkForUser } from "@/lib/mock-data/artist-epk";
import { MOCK_MEETINGS } from "@/lib/mock-data/calendar";
import { pushInboundSubmission } from "@/lib/mock-data/inbound-submissions";
import type { CalendarMeeting } from "@/lib/types";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 5)}`;
}

/**
 * Pick the FM agent for an EPK booking. In production, this comes from
 * the artist's `accountOwnerId` (admin-assigned) or falls back to a
 * round-robin among active admins. Sandbox: the first admin that exists.
 */
function pickAgent(): string {
  const admin = MOCK_USERS.find((u) => u.isAdmin);
  if (!admin) throw new Error("No admin available to route booking");
  return admin.id;
}

export async function createEpkBookingRequest(formData: FormData) {
  const artistId = String(formData.get("artistId") ?? "").trim();
  const requesterName = String(formData.get("requesterName") ?? "").trim();
  const requesterEmail = String(formData.get("requesterEmail") ?? "").trim();
  const requesterCompany = String(
    formData.get("requesterCompany") ?? "",
  ).trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();

  if (!artistId) throw new Error("Artist is required.");
  if (!requesterName || !requesterEmail) {
    throw new Error("Your name and email are required.");
  }
  if (brief.length < 30) {
    throw new Error(
      "Tell us about the engagement (≥ 30 chars). FM's agent reviews the brief before routing.",
    );
  }
  if (!startsAt || !endsAt || endsAt <= startsAt) {
    throw new Error("Pick a start and end time (end must be after start).");
  }

  const artist = MOCK_USERS.find((u) => u.id === artistId);
  if (!artist) throw new Error("Artist not found");
  const epk = epkForUser(artistId);
  if (!epk || epk.status !== "published") {
    throw new Error(
      "This artist doesn't have a published EPK and isn't accepting bookings through the cooperative.",
    );
  }

  const agentId = pickAgent();

  // Tentative external_client meeting on FM agent's calendar — artist
  // included as attendee. Status stays pending; admin approval routes it
  // forward, artist confirmation moves it to confirmed.
  const meeting: CalendarMeeting = {
    id: newId("mt"),
    title: `Booking request — ${requesterName}${requesterCompany ? ` (${requesterCompany})` : ""}`,
    description: brief,
    startsAt,
    endsAt,
    kind: "external_client",
    organizerId: agentId,
    attendeeIds: [agentId, artistId],
    confirmedByAttendeeIds: [],
    status: "pending",
    externalClientName: requesterName,
    externalClientEmail: requesterEmail,
    projectId: null,
    pmUserId: agentId,
    notesPreview: null,
    recordingUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_MEETINGS.push(meeting);

  // Inbound submission so admin triages the brief alongside other
  // inbound. Status starts "new"; admin moves it through in_triage →
  // converted as they handle.
  pushInboundSubmission({
    kind: "booking_request",
    status: "new",
    title: `Booking request for ${artist.firstName ?? artist.handle} from ${requesterName}`,
    submitter: requesterName,
    submitterEmail: requesterEmail || null,
    submitterCompany: requesterCompany || null,
    pillarTags: artist.primaryIndustry ? [artist.primaryIndustry] : [],
    keywordTags: artist.skills ?? [],
    body: brief + `\n\nProposed slot: ${startsAt} → ${endsAt}`,
    attachments: [],
    assignedAdminId: agentId,
    triageNote: `Tentative meeting created (id ${meeting.id}). Approve to forward to ${artist.firstName ?? artist.handle} for confirmation; decline to reject the brief.`,
    deepLinkHref: "/admin/team-meetings",
    derived: false,
  });

  revalidatePath(`/u/${artist.handle}`);
  revalidatePath("/admin/inbound");
  revalidatePath("/profile/calendar");
}
