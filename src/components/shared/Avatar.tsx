function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

/** Decorative initials tile. The athlete's name is always rendered next to it. */
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={`avatar-initials${small ? " avatar-initials-sm" : ""}`} aria-hidden="true">
      {initialsFor(name)}
    </span>
  );
}
