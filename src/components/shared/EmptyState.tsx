import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import "@/styles/first-run.css";

/**
 * A purposeful empty state: what this area is for, one primary action, and
 * optionally a muted preview of what it looks like once it has data.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  preview,
  compact = false
}: {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** Decorative sample of the populated screen. Hidden from assistive tech. */
  preview?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-panel${compact ? " empty-panel-compact" : ""}`}>
      <div className="empty-panel-main">
        {Icon && (
          <span className="empty-panel-icon" aria-hidden="true">
            <Icon size={compact ? 18 : 22} />
          </span>
        )}
        <div className="empty-panel-body">
          <h3 className="empty-panel-title">{title}</h3>
          <p className="muted empty-panel-text">{description}</p>
          {actions && <div className="empty-panel-actions">{actions}</div>}
        </div>
      </div>

      {preview && (
        <div className="empty-panel-preview" aria-hidden="true">
          <span className="empty-panel-preview-label">Preview</span>
          {preview}
        </div>
      )}
    </div>
  );
}
