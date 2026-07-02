/**
 * /trust — customer-facing security + privacy posture page.
 *
 * The page a security-conscious client visits during procurement.
 * Public route (no auth), reads-only, plain-spoken. Complements the
 * admin-only /admin/compliance dashboard (which is auditor-facing)
 * with a customer-facing summary at the right level of abstraction.
 *
 * Cross-references /policies/* + /profile/data-rights + the long-form
 * technical audit at deliverables/compliance/soc2-iso27001-readiness.md
 * (repo-only; not linked from here since it's development-facing).
 */
import Link from "next/link";
import { Card, CardEyebrow, CardTitle } from "@/components/Card";

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <CardEyebrow>Trust</CardEyebrow>
      <h1 className="mt-2 font-display text-4xl font-semibold">
        Security &amp; privacy
      </h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        We handle engagement briefs, contribution records, and financial
        data. Here&apos;s how we protect it, who has access, and what
        we log.
      </p>

      <Card className="mt-8">
        <CardEyebrow>Attestation posture</CardEyebrow>
        <p className="mt-3 text-sm text-ink-muted">
          Designed against{" "}
          <strong className="text-ink">SOC 2 Trust Services Criteria</strong>{" "}
          and{" "}
          <strong className="text-ink">ISO/IEC 27001:2022 Annex A</strong>.
          Type I attestation lands three months after production launch;
          Type II at twelve. Controls are already in code.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Need us to complete a VSA / CAIQ / SIG Lite? Send it. The
          architecture answers most questions substantively.
        </p>
      </Card>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          What we do
        </h2>

        <div className="mt-4 space-y-3">
          <Pillar
            title="Every consequential change is logged, immutably"
            body={
              "Sign-ins, permission changes, compensation decisions, recognitions, canonizations — all written to an append-only audit trail with actor, action, and before/after state. Production revokes UPDATE and DELETE grants at the database role and ships a replica to WORM archive within one business day. Twelve months hot; seven years cold for financial records."
            }
            evidence="SOC 2 CC7.2 · ISO 27001 A.12.4"
          />

          <Pillar
            title="Role-based access, least privilege by default"
            body={
              "Every admin action carries a server-side permission check. Discovery is gated separately from tier, so a Member's public visibility can be controlled independently. Production splits admin into finance, membership, and moderation scopes with quarterly review."
            }
            evidence="SOC 2 CC5.2 + CC5.3 · ISO 27001 A.9.2"
          />

          <Pillar
            title="Confidentiality by design"
            body={
              "Full names, emails, and legal identity live on admin surfaces only. Public routes show first-name only. Members control their own discoverability. Direct messages stay cooperative-internal; external clients never see talent contact details directly."
            }
            evidence="SOC 2 C1.1"
          />

          <Pillar
            title="Compensation with a receipts trail"
            body={
              "Every base pay release, bonus decision, and revenue split is a distinct audit entry carrying the gate rationale — client rating, PM rating, peer composite, whichever applied. Talent sees the full record on their wallet; admins see the same across the cooperative."
            }
            evidence="SOC 2 CC7.2 · Processing Integrity"
          />

          <Pillar
            title="You control your data"
            body={
              "Members can request a JSON export of their data or erase their account. Erasure runs a 30-day soft-delete then hard-delete, with financial records retained per business-records law. Both requests hit the audit log."
            }
            evidence="SOC 2 P5.1 · GDPR Art. 15 + 17 · CCPA §1798.100 + 105"
            href="/profile/data-rights"
            hrefLabel="Self-service surface (Members) →"
          />

          <Pillar
            title="Subprocessors are named, and additions require notice"
            body={
              "The list of third parties the cooperative shares data with is published. Adding a new subprocessor requires 30 days of advance notice to Members, during which they can object or exercise their data rights. Every subprocessor on the production roster carries a signed Data Processing Addendum."
            }
            evidence="ISO 27001 A.15.1 · GDPR Art. 28"
            href="/policies/subprocessors"
            hrefLabel="Subprocessor Registry →"
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">
          Landing with production
        </h2>
        <p className="mt-3 text-sm text-ink-muted">
          Infrastructure hardening below lands at production deployment:
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Row
            title="Encryption at rest + in transit"
            body="TLS 1.3 minimum at the edge with HSTS + preload. Managed Postgres with encryption on. S3 Server-Side Encryption. KMS-managed keys with annual rotation."
          />
          <Row
            title="Backup + disaster recovery"
            body="Point-in-time recovery ≥ 14 days. Daily off-region snapshot with 90-day retention. Quarterly restore drills documented."
          />
          <Row
            title="Vulnerability management"
            body="Dependabot on the repo. Weekly npm audit in CI. Software composition analysis on the main branch. Critical CVEs patched within 7 days."
          />
          <Row
            title="Incident response"
            body="Documented severity ladder + communication tree. Public status page for SEV1/SEV2. Post-incident retros filed publicly-with-redactions."
          />
          <Row
            title="Change management"
            body="Branch protection on main. Required review from at least one non-author on any audit-log-writing code path. CI gates on typecheck + test + lint."
          />
          <Row
            title="Anomaly detection"
            body="Alerts on failed-sign-in bursts, unusual admin action rates, any hard-delete verb. Reviewed weekly by the compliance-admin scope."
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Policies</h2>
        <p className="mt-3 text-sm text-ink-muted">
          How the cooperative operates, in the words we bind ourselves to:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <Link
              href="/policies/privacy"
              className="text-brand-magenta hover:underline"
            >
              Privacy Policy →
            </Link>{" "}
            <span className="text-ink-muted">
              — what we collect, why, and your rights.
            </span>
          </li>
          <li>
            <Link
              href="/policies/covenant"
              className="text-brand-magenta hover:underline"
            >
              Cooperative Covenant →
            </Link>{" "}
            <span className="text-ink-muted">
              — the behavior expected of every Member and Partner.
            </span>
          </li>
          <li>
            <Link
              href="/policies/subprocessors"
              className="text-brand-magenta hover:underline"
            >
              Subprocessor Registry →
            </Link>{" "}
            <span className="text-ink-muted">
              — third parties we share data with.
            </span>
          </li>
          <li>
            <Link
              href="/policies"
              className="text-brand-magenta hover:underline"
            >
              All policies →
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Questions</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Engagement-specific questions route through the account admin
          on your deal. Policy questions go to{" "}
          <code className="text-brand-magenta">security@buildstore</code>{" "}
          (production) or{" "}
          <Link href="/contact" className="text-brand-magenta hover:underline">
            /contact
          </Link>{" "}
          (sandbox).
        </p>
      </section>

      <div className="mt-12 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-elevated)] px-5 py-4 text-xs text-ink-muted">
        <p>
          Auditors: the control-by-control mapping is at{" "}
          <code>/admin/compliance</code> (auth required); the long-form
          audit is at{" "}
          <code>deliverables/compliance/soc2-iso27001-readiness.md</code>.
        </p>
      </div>
    </div>
  );
}

function Pillar({
  title,
  body,
  evidence,
  href,
  hrefLabel,
}: {
  title: string;
  body: string;
  evidence: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          {evidence}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
      {href && hrefLabel && (
        <Link
          href={href}
          className="mt-2 inline-block text-xs text-brand-magenta hover:underline"
        >
          {hrefLabel}
        </Link>
      )}
    </Card>
  );
}

function Row({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardTitle className="text-base">{title}</CardTitle>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
    </Card>
  );
}
