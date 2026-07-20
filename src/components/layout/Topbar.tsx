import { LogoutButton } from "@/components/auth/LogoutButton";

export function Topbar({ userEmail, displayName: name }: { userEmail: string; displayName?: string | null }) {
  const displayName = name && name.trim() ? name.trim() : userEmail.split("@")[0];
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
