import type { Metadata } from "next";

import { JoinTeam } from "@/components/join/JoinTeam";

import "@/styles/auth.css";

export const metadata: Metadata = {
  title: "Join your team",
  description: "Join your team on NextRep.",
  robots: { index: false }
};

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JoinTeam rawCode={decodeURIComponent(code)} />;
}
