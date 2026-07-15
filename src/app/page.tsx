import { Trophy } from "lucide-react";

import { DashboardCards } from "@/components/dashboard/DashboardCards";

import "@/styles/dashboard.css";

export default function DashboardPage() {
  return (
    <>
      <DashboardCards />

      <section className="panel" style={{ marginTop: 24 }}>
        <h2>
          <Trophy size={22} /> Version 17.1 Status
        </h2>

        <p className="muted">
          The tracker has been split into routes, components, hooks, and smaller stylesheets.
          Same features as before, now on an architecture that can actually grow.
        </p>
      </section>
    </>
  );
}
