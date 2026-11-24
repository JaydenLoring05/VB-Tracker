import type { Week1Preview } from "@/lib/week1Preview";

/** Read-only look at Week 1, shown at the end of onboarding before the paywall. */
export function Week1Card({ preview }: { preview: Week1Preview }) {
  return (
    <section className="week1-preview" aria-label="Your week 1 preview">
      <h3>Your Week 1</h3>
      {preview.summary && <p className="muted">{preview.summary}</p>}
      <ol className="week1-days">
        {preview.days.map((day) => (
          <li key={day.day}>
            <strong>{day.day}</strong>
            {day.rest ? (
              <span className="muted">Rest</span>
            ) : (
              <span>
                {day.title}
                {day.minutes ? <span className="muted"> · {day.minutes} min</span> : null}
                {day.highlights.length > 0 && (
                  <span className="muted week1-highlights">
                    {day.highlights.join(", ")}
                    {day.moreCount > 0 ? ` +${day.moreCount} more` : ""}
                  </span>
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
