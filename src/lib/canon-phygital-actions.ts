/**
 * Phygital canonization-card request — sandbox stub.
 *
 * Per production-swap-checklist §7m (phygital marketplace, v1.1+):
 * physical cards print on-demand via card printer integration (Make-
 * playingcards / DriveThruCards / custom) with NFC or QR scan-to-verify
 * tied to the on-chain ERC-6551 TBA. Members buy their own at near-cost;
 * outsiders buy as collectibles at market rate; Champion's Court
 * legendary cards command premium pricing with real holographic foil.
 *
 * Sandbox stub: this action just pushes a notification to admins
 * acknowledging the request. Production layers Stripe payment intent +
 * fulfillment routing to the print partner.
 */
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-stub";
import { MOCK_USERS } from "@/lib/mock-data/users";
import { MOCK_CANONIZATIONS } from "@/lib/mock-data/canonizations";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data/notifications";
import type { Notification } from "@/lib/types";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 5)}`;
}

export async function requestPhygitalCanonCard(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) throw new Error("Sign in required");
  const canonId = String(formData.get("canonId") ?? "").trim();
  const shippingNote = String(formData.get("shippingNote") ?? "").trim();

  const canon = MOCK_CANONIZATIONS.find((c) => c.id === canonId);
  if (!canon) throw new Error("Canonization not found");
  if (canon.userId !== me.id) {
    throw new Error(
      "Members can request phygital prints of their own cards. Outsider purchases route through the public marketplace (v1.1+).",
    );
  }

  // Sandbox stub: notify admin pool that a phygital request is in queue.
  // Production swap: dispatches Stripe payment intent + print-partner job.
  for (const admin of MOCK_USERS.filter((u) => u.isAdmin)) {
    const ntf: Notification = {
      id: newId("ntf_phygital"),
      userId: admin.id,
      kind: "direct_message",
      title: `Phygital request: ${me.firstName ?? me.handle}, ${canon.year} card`,
      body: `${me.firstName ?? me.handle} requested a phygital print of their ${canon.year} canonization (tier: ${canon.tier}). ${shippingNote ? `Notes: ${shippingNote}` : "No additional notes."} Production swap dispatches to print partner.`,
      href: "/admin",
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    MOCK_NOTIFICATIONS.push(ntf);
  }

  revalidatePath("/profile/canon");
  revalidatePath("/notifications");
}
