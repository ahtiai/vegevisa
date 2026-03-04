import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VegeVisa — Kasvistietovisailu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          background: "linear-gradient(180deg, #4a90c4 0%, #6a9848 35%, #c4a840 55%, #a08424 100%)",
          position: "relative",
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            padding: "40px",
          }}
        >
          {/* Main panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(14, 30, 14, 0.92)",
              border: "4px solid #4a9a4a",
              borderRadius: "24px",
              padding: "60px 80px",
              boxShadow: "0 0 40px rgba(57, 255, 20, 0.15)",
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#39ff14",
                textShadow: "0 0 20px rgba(57, 255, 20, 0.6), 0 0 40px rgba(57, 255, 20, 0.3)",
                letterSpacing: "0.05em",
                fontFamily: "monospace",
                display: "flex",
              }}
            >
              VEGEVISA
            </div>
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.7)",
                marginTop: 16,
                letterSpacing: "0.15em",
                fontFamily: "monospace",
                display: "flex",
              }}
            >
              KASVISTIETOVISA
            </div>
            <div
              style={{
                fontSize: 32,
                color: "rgba(255,255,255,0.9)",
                marginTop: 28,
                fontFamily: "sans-serif",
                display: "flex",
              }}
            >
              Testaa kasvistietosi! 🌿
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
              marginTop: 32,
              fontFamily: "sans-serif",
              display: "flex",
            }}
          >
            provege.fi/vegevisa
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
