/**
 * Server-side mount gate for the floating ChatWidget.
 *
 * Only renders the client widget for logged-out visitors. Logged-in
 * members + admins have richer rails (Member↔Member direct messages
 * via dm-actions.ts, notifications, project applications, peer review,
 * etc.) and don't need a public-facing chat surface. The visitor-admin
 * chat lane stays separate from the Member-to-Member peer messaging
 * unlocked 2026-06-29 — different audiences, different rails.
 */
import { getCurrentUser } from "@/lib/auth-stub";
import { ChatWidget } from "@/components/ChatWidget";

export async function ChatWidgetMount() {
  const user = await getCurrentUser();
  if (user) return null;
  return <ChatWidget />;
}
