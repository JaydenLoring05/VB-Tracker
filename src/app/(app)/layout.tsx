import { redirect } from "next/navigation";

import { AccessGate } from "@/components/layout/AccessGate";
import { LoadErrorBanner } from "@/components/layout/LoadErrorBanner";
import { ReferralRedeemer } from "@/components/layout/ReferralRedeemer";
import { Sidebar } from "@/components/layout/Sidebar";
import { SyncErrorToast } from "@/components/layout/SyncErrorToast";
import { Topbar } from "@/components/layout/Topbar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { TrackerProvider } from "@/context/TrackerContext";
import { needsPlan } from "@/lib/access";
import { readBillingConfig, type BillingStatus } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const billingEnabled = readBillingConfig(process.env) !== null;
  const [{ data: profile }, membership, billing] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    billingEnabled
      ? supabase.from("team_members").select("team_id").eq("user_id", user.id).limit(1)
      : Promise.resolve(null),
    billingEnabled
      ? supabase.from("athlete_billing").select("status").eq("user_id", user.id).maybeSingle()
      : Promise.resolve(null)
  ]);

  // P-02: after the free trial, solo athletes need a plan. See needsPlan for who's exempt.
  const status = (billing?.data?.status as BillingStatus | undefined) ?? null;
  const locked = needsPlan({
    billingEnabled,
    onTeam: (membership?.data?.length ?? 0) > 0,
    status,
    billingLoadFailed: Boolean(membership?.error || billing?.error)
  });

  return (
    <TrackerProvider userId={user.id}>
      <div className="app-shell">
        <Sidebar />

        <main id="main-content" tabIndex={-1} className="main">
          <Topbar userEmail={user.email ?? "Athlete"} displayName={profile?.display_name} />
          <LoadErrorBanner />
          <ReferralRedeemer />
          <AccessGate locked={locked} status={status}>
            {children}
          </AccessGate>
        </main>
      </div>

      <SyncErrorToast />
      <InstallPrompt />
    </TrackerProvider>
  );
}
