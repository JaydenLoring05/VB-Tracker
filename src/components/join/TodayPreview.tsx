import { ArrowRight, Flame } from "lucide-react";

/**
 * A static picture of the athlete's Today screen for /join (L-01): today's
 * workout, the big Start button, streak and level. Sample content, not live
 * data; it uses the same class names as the real card so it looks the same.
 */
export function TodayPreview() {
  return (
    <div className="join-today-preview" aria-label="Preview of the Today screen" role="img">
      <div className="panel today-hero" aria-hidden="true">
        <p className="micro micro-gold">Today &middot; Tuesday</p>
        <p className="today-title join-today-title">Jump Power + Speed</p>
        <p className="muted today-meta">
          6 exercises · 30-45 min
          <span className="dashboard-streak">
            <Flame size={14} />
            12-day streak
          </span>
        </p>
        <ul className="today-exercises">
          <li>Approach Jumps</li>
          <li>Box Jumps</li>
          <li>Broad Jumps</li>
          <li>Lateral Bounds</li>
          <li className="muted">+2 more</li>
        </ul>
        <span className="btn dashboard-hero-cta">
          Start Today&apos;s Workout
          <ArrowRight size={22} />
        </span>
        <div className="today-level">
          <div className="today-level-row">
            <strong>Varsity</strong>
            <span className="muted">320 XP to All-Conference</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "87%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
