import { Trophy } from "lucide-react";

import { DashboardCards } from "@/components/dashboard/DashboardCards";

import "@/styles/dashboard.css";

export default function DashboardPage() {
  return (
    <>
      <DashboardCards />

      <section className="panel" style={{ marginTop: 24 }}>
        <h2>
          <Trophy size={22} /> Version 18.5 Status
        </h2>

        <p className="muted">
          Accounts, cloud sync, and Workout Mode are live: start a session, log sets with a rest
          timer, and get a summary when you finish.
        </p>
      </section>
    </>
  );
}
