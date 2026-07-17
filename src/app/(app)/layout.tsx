import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { SyncErrorToast } from "@/components/layout/SyncErrorToast";
import { Topbar } from "@/components/layout/Topbar";
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

  return (
    <TrackerProvider userId={user.id}>
      <div className="app-shell">
        <Sidebar />

        <main className="main">
          <Topbar userEmail={user.email ?? "Athlete"} />
          {children}
        </main>
      </div>

      <SyncErrorToast />
    </TrackerProvider>
  );
}
