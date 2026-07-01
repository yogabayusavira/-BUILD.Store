/**
 * Profile visibility predicate.
 *
 * Codifies the visibility matrix locked in `future-modern.md`:
 *
 *   Tier                                 | Public discovery | Direct-link
 *   -------------------------------------|-----------------|------------
 *   Member                               | Yes             | Yes
 *   Partner (no active recognition)      | No              | Yes
 *   Partner (active recognition window)  | Yes             | Yes
 *   Prospect / Viewer                    | No              | Public-shaped
 *
 * Direct-link access is always available — Partners can distribute their
 * own `/u/[handle]` URL freely to clients. Discovery filtering applies
 * to platform-side surfaces (showcase, member directory, homepage
 * featured-talent sections, search results).
 *
 * Active recognition window: the user has at least one recognition row
 * whose period is current (current calendar month for monthly winners,
 * current calendar year for Constellation).
 */
import { activeRecognitionsForUser } from "@/lib/mock-data/future-modernist-recognitions";
import type { User } from "@/lib/types";

/**
 * Whether the user's profile should appear in public discovery surfaces
 * (showcase, member directory, homepage talent rails, search). Direct-
 * link access to `/u/[handle]` is separate and always available.
 *
 * Two gates compose:
 *   1. Tier eligibility — Member (always) OR Partner with active
 *      recognition window.
 *   2. `profilePublic` flag — even Member-tier profiles can opt out of
 *      discovery (or be opted out by admin for defensive reasons, e.g.,
 *      a Member in unresolved legal dispute).
 *
 * Both must hold for discovery to apply.
 */
export function publicProfileEligible(
  user: Pick<User, "id" | "membershipTier" | "profilePublic">,
): boolean {
  // Discovery gate first — opt-out applies regardless of tier.
  if (user.profilePublic === false) return false;
  if (user.membershipTier === "member") return true;
  const { month, year } = activeRecognitionsForUser(user.id);
  return month !== null || year !== null;
}

/**
 * Whether search engines should index a profile direct-link URL. Members
 * + recognized Partners → index. Everyone else → noindex (the URL still
 * works for direct sharing, but Google won't crawl it; Partners control
 * who sees the link).
 */
export function profileShouldIndex(
  user: Pick<User, "id" | "membershipTier" | "profilePublic">,
): boolean {
  return publicProfileEligible(user);
}

/**
 * Filter a list of users to only those public-discovery eligible. Use
 * on listing surfaces (showcase, member directory, homepage rails).
 */
export function filterToPublicProfiles<
  T extends Pick<User, "id" | "membershipTier" | "profilePublic">,
>(users: T[]): T[] {
  return users.filter((u) => publicProfileEligible(u));
}
