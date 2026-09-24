import { Repeat, Timer } from "lucide-react";

import "@/styles/workout-mode.css";

export function LandingWorkoutMock() {
  return (
    <div className="panel landing-mock landing-workout-mock">
      <div className="landing-mock-header">
        <h3>Tuesday: Lower Body Power</h3>
        <span className="landing-mock-badge">Sample data</span>
      </div>

      <div className="landing-workout-mock-meta">
        <span className="muted">Est. 45-60 min</span>
        <span className="muted">Purpose: build explosive lower-body power for approach jumps</span>
      </div>

      <div className="exercise-dots landing-mock-dots">
        <span className="exercise-dot done" />
        <span className="exercise-dot done" />
        <span className="exercise-dot active" />
        <span className="exercise-dot" />
        <span className="exercise-dot" />
      </div>

      <div className="landing-workout-mock-exercise">
        <h4>Depth Jumps</h4>
        <p className="muted">Target: 3x5 quality landings</p>
        <p className="muted last-time">Last time: 18in box x 5</p>

        <div className="landing-workout-mock-cue">
          <strong>Coaching cue:</strong> land soft, absorb through the hips, stick it.
        </div>

        <button type="button" className="ghost landing-workout-mock-substitute" disabled>
          <Repeat size={14} /> Swap exercise
        </button>
      </div>

      <div className="landing-workout-mock-rest">
        <Timer size={16} />
        <span>Rest: 0:42 remaining</span>
      </div>
    </div>
  );
}
