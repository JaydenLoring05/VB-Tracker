import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { GuardianPrompt } from "@/components/guardian/GuardianPrompt";

import "@/styles/dashboard.css";
import "@/styles/onboarding.css";

export default function DashboardPage() {
  return (
    <>
      <GuardianPrompt />
      <DashboardCards />
    </>
  );
}
