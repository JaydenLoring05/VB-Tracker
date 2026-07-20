import { AlertTriangle, Trophy, Users } from "lucide-react";

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

function recoverySlug(label: string) {
  return label.toLowerCase();
}

export function LandingDashboardMock() {
  return (
    <div className="panel landing-mock landing-dashboard-mock">
      <div className="landing-mock-header">
        <h3>
          <Users size={20} /> Varsity Girls Roster
        </h3>
        <span className="landing-mock-badge">Sample data</span>
      </div>

      <div className="roster-table landing-roster-mock">
        {SAMPLE_ROSTER.map((athlete) => (
          <div className="roster-row" key={athlete.name}>
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
            </div>

            <span className="muted landing-roster-completion">{athlete.completion}% this week</span>

            <span className={`pill roster-recovery roster-recovery-${recoverySlug(athlete.recoveryLabel)}`}>
              {athlete.recovery}% &middot; {athlete.recoveryLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
