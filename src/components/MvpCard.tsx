/**
 * MvpCard — visual rendering of an MVP Score snapshot.
 *
 * Two render modes (per locked visibility rules in `future-modern.md`
 * "MVP Score" section):
 *
 *   - **mode="self"** — Member sees their own card. Full sub-rating
 *     breakdown, active penalty trail with reasons (admin-supplied
 *     reason text), period stamp.
 *
 *   - **mode="peer"** — Member viewing another Member's card. OVR + band
 *     + active penalty count only. No sub-breakdown (preserves dignity
 *     around individual weak spots); no penalty reasons (admin-only
 *     text). Anonymous viewers should not be passed snapshots at all —
 *     MVP is a cooperative-internal instrument.
 *
 * Aesthetic anchor: 2K player card / baseball card. Big OVR on the
 * right, name + handle + band badge on the left, sub-ratings as a
 * compact ladder. Magenta/blue/green per the locked palette.
 *
 * Self vs peer is the runtime gate; this component does not check
 * permissions on its own. Callers must pass the correct mode.
 */
import { cn } from "@/lib/cn";
import {
  MVP_SUB_RATING_LABELS,
  type MvpScore,
  type MvpStandingBand,
  type MvpSubRating,
  type User,
} from "@/lib/types";
import { peerView, standingBand } from "@/lib/mvp-score";
import { Avatar } from "@/components/Avatar";

interface MvpCardProps {
  snapshot: MvpScore;
  user: Pick<
    User,
    | "id"
    | "firstName"
    | "lastName"
    | "handle"
    | "profileImageUrl"
    | "discipline"
    | "membershipTier"
  >;
  mode: "self" | "peer";
  className?: string;
}

export function MvpCard({ snapshot, user, mode, className }: MvpCardProps) {
  const band = standingBand(snapshot.ovr);
  const accent = BAND_ACCENT[band];
  const peer = mode === "peer" ? peerView(snapshot) : null;
  const ovrTextSize = "text-6xl";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[var(--surface-elevated)] p-5",
        className,
      )}
      style={{ borderColor: accent.border }}
    >
      {/* Top accent stripe — matches the player-card aesthetic */}
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: accent.bar }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-ink-faint">
              MVP Score
            </div>
            <div className="font-display text-lg font-semibold leading-tight">
              {user.firstName ?? user.handle}
            </div>
            {user.discipline && (
              <div className="mt-0.5 text-xs text-ink-muted">
                {user.discipline}
              </div>
            )}
            <BandBadge band={band} />
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">
            OVR
          </div>
          <div
            className={cn("font-display font-bold leading-none", ovrTextSize)}
            style={{ color: accent.ovr }}
          >
            {snapshot.ovr}
          </div>
        </div>
      </div>

      {mode === "self" ? (
        <SelfBody snapshot={snapshot} accent={accent} />
      ) : (
        <PeerBody peer={peer!} accent={accent} />
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] text-ink-faint">
        <span>
          Published {new Date(snapshot.publishedAt).toLocaleDateString()}
        </span>
        <span>
          Period {new Date(snapshot.periodStart).toLocaleDateString()}{" "}
          → {new Date(snapshot.periodEnd).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function SelfBody({
  snapshot,
  accent,
}: {
  snapshot: MvpScore;
  accent: BandAccent;
}) {
  const subKeys = Object.keys(MVP_SUB_RATING_LABELS) as MvpSubRating[];
  return (
    <>
      <div className="mt-5 grid gap-x-4 gap-y-1 md:grid-cols-2">
        {subKeys.map((k) => (
          <SubRatingRow
            key={k}
            label={MVP_SUB_RATING_LABELS[k]}
            value={snapshot.subRatings[k] ?? 0}
            accent={accent}
          />
        ))}
      </div>

      {snapshot.activePenalties.length > 0 && (
        <div
          className="mt-4 rounded-lg p-3 text-xs"
          style={{ backgroundColor: "rgba(216, 40, 160, 0.08)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-brand-magenta">
              Active compliance penalties
            </span>
            <span className="text-[11px] font-medium text-brand-magenta">
              {snapshot.activePenalties.length} ×{" "}
              {snapshot.activePenalties[0]?.ovrImpact} OVR
            </span>
          </div>
          <ul className="mt-2 space-y-1.5 text-ink">
            {snapshot.activePenalties.map((p) => (
              <li key={p.id} className="text-[11px]">
                <span className="text-ink-muted">
                  {new Date(p.appliedAt).toLocaleDateString()} →{" "}
                  {new Date(p.expiresAt).toLocaleDateString()}
                </span>{" "}
                — {p.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function PeerBody({
  peer,
  accent,
}: {
  peer: ReturnType<typeof peerView>;
  accent: BandAccent;
}) {
  void accent;
  return (
    <div className="mt-5">
      <div className="rounded-lg bg-[var(--surface)] p-3 text-xs text-ink-muted">
        Sub-rating breakdown is self-only by cooperative policy. Peers see
        OVR + standing band + any active compliance signal.
      </div>
      {peer.activePenaltyCount > 0 && (
        <div
          className="mt-3 rounded-lg p-3 text-xs"
          style={{ backgroundColor: "rgba(216, 40, 160, 0.08)" }}
        >
          <span className="text-[11px] uppercase tracking-wider text-brand-magenta">
            Active compliance signal
          </span>
          <p className="mt-1 text-ink">
            {peer.activePenaltyCount} active penalt
            {peer.activePenaltyCount === 1 ? "y" : "ies"} on file.
            Cooperative members can see this exists; the underlying
            details are admin-only.
          </p>
        </div>
      )}
    </div>
  );
}

function SubRatingRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: BandAccent;
}) {
  const pct = Math.max(0, Math.min(99, value));
  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <span className="w-24 text-ink-muted">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-inset)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${(pct / 99) * 100}%`,
            backgroundColor: accent.bar,
          }}
        />
      </div>
      <span className="w-7 text-right font-mono text-[11px]">{pct}</span>
    </div>
  );
}

function BandBadge({ band }: { band: MvpStandingBand }) {
  const accent = BAND_ACCENT[band];
  return (
    <span
      className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
      style={{ backgroundColor: accent.bg, color: accent.fg }}
    >
      {BAND_LABEL[band]}
    </span>
  );
}

const BAND_LABEL: Record<MvpStandingBand, string> = {
  champions_court_eligible: "Champion's Court eligible",
  future_modernist_pool: "Future Modernist pool",
  promotion_eligible: "Promotion eligible",
  good_standing: "Good standing",
  probation_review: "Probation review",
  removal_accelerated: "Removal review",
};

interface BandAccent {
  /** Card border color. */
  border: string;
  /** Top stripe / sub-rating bar color. */
  bar: string;
  /** OVR number color. */
  ovr: string;
  /** Badge background. */
  bg: string;
  /** Badge foreground. */
  fg: string;
}

/**
 * Palette mapping per band. Top bands ride the green / blue accents;
 * mid bands stay neutral; review bands flag magenta to signal attention
 * without going scarlet-letter.
 */
const BAND_ACCENT: Record<MvpStandingBand, BandAccent> = {
  champions_court_eligible: {
    border: "rgba(0, 112, 72, 0.5)",
    bar: "#007048",
    ovr: "#007048",
    bg: "rgba(0, 112, 72, 0.12)",
    fg: "#007048",
  },
  future_modernist_pool: {
    border: "rgba(80, 112, 240, 0.5)",
    bar: "#5070F0",
    ovr: "#5070F0",
    bg: "rgba(80, 112, 240, 0.12)",
    fg: "#5070F0",
  },
  promotion_eligible: {
    border: "rgba(80, 112, 240, 0.35)",
    bar: "#5070F0",
    ovr: "#5070F0",
    bg: "rgba(80, 112, 240, 0.10)",
    fg: "#5070F0",
  },
  good_standing: {
    border: "var(--surface-border)",
    bar: "#666666",
    ovr: "var(--ink)",
    bg: "rgba(102, 102, 102, 0.12)",
    fg: "#666666",
  },
  probation_review: {
    border: "rgba(216, 40, 160, 0.5)",
    bar: "#D828A0",
    ovr: "#D828A0",
    bg: "rgba(216, 40, 160, 0.12)",
    fg: "#D828A0",
  },
  removal_accelerated: {
    border: "rgba(216, 40, 160, 0.6)",
    bar: "#D828A0",
    ovr: "#D828A0",
    bg: "rgba(216, 40, 160, 0.18)",
    fg: "#D828A0",
  },
};
