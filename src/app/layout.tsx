import type { Metadata } from "next";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TrackerProvider } from "@/context/TrackerContext";

import "./globals.css";

export const metadata: Metadata = {
  title: "Volleyball Tracker V17.1",
  description: "20 Week Volleyball Athlete Operating System"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TrackerProvider>
          <div className="app-shell">
            <Sidebar />

            <main className="main">
              <Topbar />
              {children}
            </main>
          </div>
        </TrackerProvider>
      </body>
    </html>
  );
}
