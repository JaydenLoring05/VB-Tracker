import { ImageResponse } from "next/og";

export const alt = "NextRep: every volleyball player deserves a strength coach";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(160deg, #151922 0%, #05070a 60%)",
          color: "#f4f6f8"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "#ffc400",
              display: "flex"
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4 }}>NEXTREP</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            Every volleyball player deserves a strength coach.
          </div>
          <div style={{ fontSize: 34, color: "#aeb6c4", maxWidth: 900 }}>
            Jump higher. Move faster. Get stronger. Your personal volleyball performance coach, in your pocket.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#ffc400", fontWeight: 700 }}>
          joinnextrep.com
        </div>
      </div>
    ),
    size
  );
}
