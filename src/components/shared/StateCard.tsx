import type { LucideIcon } from "lucide-react";

/**
 * Branded card for full-page states (error, not found). Server-safe: no hooks,
 * so not-found.tsx can render it directly.
 */
export function StateCard({
  icon: Icon,
  title,
  children,
  actions,
  reference,
  headingLevel = 1,
  role
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  reference?: string;
  headingLevel?: 1 | 2;
  /** Set to "alert" for a failure that should be announced as it appears. */
  role?: "alert";
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <div className="panel state-card" role={role}>
      <div className="state-mark">
        <Icon size={26} aria-hidden="true" />
      </div>
      <Heading>{title}</Heading>
      <p className="muted">{children}</p>
      <div className="state-actions">{actions}</div>
      {reference && (
        <p className="state-reference">
          Reference: <code>{reference}</code>
        </p>
      )}
    </div>
  );
}
