import { AlertTriangle, Trophy } from "lucide-react";

import { Avatar } from "@/components/shared/Avatar";
import { StatusLabel } from "@/components/shared/StatusLabel";

type SampleAthlete = {
  name: string;
  recovery: number;
  recoveryLabel: "Elite" | "Good" | "Caution" | "Low";
  completion: number;
  painAlert: string | null;
  newPR: string | null;
};

const SAMPLE_ROSTER: SampleAthlete[] = [
  { name: "Ava Thompson", recovery: 88, recoveryLabel: "Elite", completion: 100, painAlert: null, newPR: "Vertical Jump: 27in" },
  { name: "Maya Chen", recovery: 54, recoveryLabel: "Caution", completion: 71, painAlert: "Knee, 3 days running", newPR: null },
  { name: "Jordan Park", recovery: 63, recoveryLabel: "Good", completion: 86, painAlert: null, newPR: null },
  { name: "Sam Rivera", recovery: 71, recoveryLabel: "Good", completion: 43, painAlert: null, newPR: null },
  { name: "Priya Patel", recovery: 38, recoveryLabel: "Low", completion: 57, painAlert: "Shoulder, elevated", newPR: null }
];

const TEAM_SCORE = Math.round(SAMPLE_ROSTER.reduce((sum, athlete) => sum + athlete.recovery, 0) / SAMPLE_ROSTER.length);
const NEED_ATTENTION = SAMPLE_ROSTER.filter((athlete) => athlete.painAlert).length;

export function LandingDashboardMock() {
  return (
    <div className="panel landing-mock landing-dashboard-mock">
      <div className="landing-mock-header">
        <div>
          <p className="micro micro-gold">Morning readiness</p>
          <h2>Varsity Girls</h2>
        </div>
        <span className="landing-mock-badge">Sample data</span>
      </div>

      <div className="roster-table landing-roster-mock">
        {SAMPLE_ROSTER.map((athlete) => (
          <div className="roster-row" key={athlete.name}>
            <Avatar name={athlete.name} />

            <div className="roster-athlete-name">
              <strong>{athlete.name}</strong>
              {athlete.painAlert && (
                <span className="pill roster-flag">
                  <AlertTriangle size={12} /> {athlete.painAlert}
                </span>
              )}
              {athlete.newPR && (
                <span className="pill landing-pr-flag">
                  <Trophy size={12} /> {athlete.newPR}
                </span>
              )}
              <span className="muted roster-last-active">{athlete.completion}% of workouts this week</span>
            </div>

            <StatusLabel label={athlete.recoveryLabel} className="roster-status" />
            <span className="roster-score">{athlete.recovery}</span>
          </div>
        ))}
      </div>

      <div className="landing-mock-tiles">
        <div className="stat-tile stat-tile-accent">
          <p className="stat-label">Team score</p>
          <p className="stat-value">
            {TEAM_SCORE}
            <small>%</small>
          </p>
        </div>
        <div className="stat-tile">
          <p className="stat-label">Need attention</p>
          <p className="stat-value">{NEED_ATTENTION}</p>
          <p className="stat-delta is-alert">Review now</p>
        </div>
      </div>
    </div>
  );
}
