import { redirect } from "next/navigation";

import { LoadErrorBanner } from "@/components/layout/LoadErrorBanner";
import { Sidebar } from "@/components/layout/Sidebar";
import { SyncErrorToast } from "@/components/layout/SyncErrorToast";
import { Topbar } from "@/components/layout/Topbar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { TrackerProvider } from "@/context/TrackerContext";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <TrackerProvider userId={user.id}>
      <div className="app-shell">
        <Sidebar />

        <main className="main">
          <Topbar userEmail={user.email ?? "Athlete"} displayName={profile?.display_name} />
          <LoadErrorBanner />
          {children}
        </main>
      </div>

      <SyncErrorToast />
      <InstallPrompt />
    </TrackerProvider>
  );
}
