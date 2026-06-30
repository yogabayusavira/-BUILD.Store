/**
 * TradingCard — visual primitive for the cooperative's player-card aesthetic.
 *
 * Renders a card-shaped surface with FM brand backdrop, watermark logo,
 * and a bg-removed portrait foreground. Three visual tiers map to the
 * recognition / standing ladder:
 *
 *   - standard     : Partners, Prospects, good-standing Members. Calm
 *                    brand gradient, no animation. Already beautiful
 *                    enough to send a client.
 *   - elevated     : Future Modernist pool, promotion-eligible. Richer
 *                    gradient, slight visual lift.
 *   - holographic  : Champion's Court (top 10% Members AND OVR >= 90).
 *                    Animated conic-gradient + diagonal sheen. Real
 *                    holo-card energy without being garish.
 *
 * Graceful fallback: when `user.avatarPortraitUrl` is null, falls back to
 * the existing Avatar component (initials or profile photo) rendered
 * inside the same card frame. Sandbox phase has no bg-removed portraits
 * yet — the visual lands cleanly without them and gets richer once the
 * photo pipeline is in place.
 *
 * Composition: pass `children` to layer additional content over the
 * card (e.g., MvpCard renders OVR + sub-ratings; /u/[handle] hero
 * renders name + tier badges). The card itself is the visual frame +
 * portrait + brand backdrop.
 */
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/Avatar";
import type { User } from "@/lib/types";

export type TradingCardTier = "standard" | "elevated" | "holographic";

interface TradingCardProps {
  user: Pick<
    User,
    | "id"
    | "firstName"
    | "lastName"
    | "handle"
    | "profileImageUrl"
    | "avatarPortraitUrl"
  >;
  tier?: TradingCardTier;
  /** Optional content composed on top of the card (name, badges, etc.). */
  children?: React.ReactNode;
  /** Width override. Default fluid. */
  className?: string;
  /** Aspect ratio of the card. Default 3/4 (taller than wide, sports-card shape). */
  aspectRatio?: "3/4" | "4/5" | "square";
}

export function TradingCard({
  user,
  tier = "standard",
  children,
  className,
  aspectRatio = "3/4",
}: TradingCardProps) {
  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "4/5"
        ? "aspect-[4/5]"
        : "aspect-[3/4]";

  const bgClass =
    tier === "holographic"
      ? "fm-holo-bg"
      : tier === "elevated"
        ? "fm-card-bg-elevated"
        : "fm-card-bg-standard";

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border bg-[var(--surface-elevated)]",
        aspectClass,
        className,
      )}
      style={{
        borderColor:
          tier === "holographic"
            ? "rgba(0, 112, 72, 0.7)"
            : tier === "elevated"
              ? "rgba(80, 112, 240, 0.5)"
              : "var(--surface-border)",
      }}
    >
      {/* Backdrop layer */}
      <div
        className={cn("absolute inset-0", bgClass)}
        aria-hidden
      />

      {/* FM logo watermark — top-right corner, faint */}
      <div
        className="pointer-events-none absolute right-4 top-4 select-none text-[10px] font-bold uppercase tracking-[0.2em] text-white/30"
        aria-hidden
      >
        Future Modern
      </div>

      {/* Portrait foreground — bg-removed full/3-quarter shot when available;
          falls back to Avatar with initials/profile photo inside a contained box. */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        {user.avatarPortraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarPortraitUrl}
            alt=""
            aria-hidden="true"
            className="h-full max-h-[90%] w-auto object-contain object-bottom"
          />
        ) : (
          <div className="mb-6 flex h-32 w-32 items-center justify-center">
            <Avatar user={user} size="xl" />
          </div>
        )}
      </div>

      {/* Holographic sheen overlay — only on Court tier */}
      {tier === "holographic" && (
        <div
          className="pointer-events-none absolute inset-0 fm-holo-sheen mix-blend-screen"
          aria-hidden
        />
      )}

      {/* Composed content on top of the card */}
      {children && (
        <div className="relative z-10 flex h-full flex-col p-5">
          {children}
        </div>
      )}
    </div>
  );
}
