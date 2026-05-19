import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c1917",
        }}
      >
        {/* Decorative top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#d97706",
          }}
        />

        {/* Flute icon */}
        <div style={{ fontSize: 100, marginBottom: 24 }}>🪈</div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-1px",
            marginBottom: 16,
          }}
        >
          Maa Flutes
        </div>

        <div
          style={{
            fontSize: 28,
            color: "#a8a29e",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Handcrafted Indian Classical Flutes
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ width: 40, height: 2, background: "#d97706" }} />
          <div style={{ fontSize: 18, color: "#78716c" }}>maaflutes.com</div>
          <div style={{ width: 40, height: 2, background: "#d97706" }} />
        </div>
      </div>
    ),
    size
  );
}
