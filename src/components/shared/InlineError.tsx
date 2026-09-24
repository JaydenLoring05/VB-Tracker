import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * In-panel error with a retry, for a section whose data failed to load. Use
 * this instead of falling through to an empty state: "no athletes yet" and
 * "we couldn't load your athletes" are very different things to a coach.
 */
export function InlineError({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="inline-error" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="ghost" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}
