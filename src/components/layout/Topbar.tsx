import { LogoutButton } from "@/components/auth/LogoutButton";

export function Topbar({ userEmail }: { userEmail: string }) {
  const displayName = userEmail.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div>
        <h1>Welcome back, {displayName} 👋</h1>
        <p>Next.js + TypeScript Volleyball Athlete Tracker</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="avatar">{initial}</div>
        <LogoutButton />
      </div>
    </header>
  );
}
