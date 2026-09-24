import { FileText } from "lucide-react";
import Link from "next/link";

const REPORT_STATS = [
  { label: "Completion", value: "83%" },
  { label: "Avg. Readiness", value: "68%" },
  { label: "Needs Attention", value: "2 athletes" },
  { label: "New PRs", value: "3" },
  { label: "Weekly Jump Volume", value: "412 jumps" }
];

export function LandingWeeklyReport() {
  return (
    <div className="panel landing-mock landing-weekly-report">
      <div className="landing-mock-header">
        <h3>
          <FileText size={20} /> Week 6 Report: Varsity Girls
        </h3>
        <span className="landing-mock-badge">Sample data</span>
      </div>

      <div className="landing-report-stats">
        {REPORT_STATS.map((stat) => (
          <div className="landing-report-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span className="muted">{stat.label}</span>
          </div>
        ))}
      </div>

      <p className="landing-report-note">
        <strong>Discomfort trend:</strong> knee discomfort reports are up slightly across the roster
        this week, worth a look before Saturday&apos;s tournament.
      </p>

      <p className="landing-report-note">
        <strong>Coach notes:</strong> jump volume trending up as planned heading into Power phase.
        Keep an eye on Maya and Priya&apos;s readiness before increasing load further.
      </p>

      <Link href="/login?mode=sign-up" className="btn secondary">
          View Sample Report
        </Link>
    </div>
  );
}
