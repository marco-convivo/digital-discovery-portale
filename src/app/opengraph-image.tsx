import { ImageResponse } from "next/og";

export const alt = "Digital Discovery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Monogramma DD (bianco) come SVG → data URI (nessun font richiesto).
const P1 =
  "M41.92,23.22c0,.31-.16-4.55-1.38-7.14s-1.42-3.06-3.64-5.16c-2.21-2.1-6.76-4.45-11.21-4.48-1.01.05-1.32.08-1.32.08L2.42,8.52c-.49.04-1.06.18-1.6.64-.54.46-.82,1.11-.82,1.11,0-.25,0,84.47,0,84.47,0,.51.19,1.01.53,1.39.45.51,1.13.77,1.81.69l22.04-2.52c.3-.03,1.29-.23,1.65-.28.35-.06,5.9-1.75,10.39-6.38,1.84-1.85,3-3.9,3.5-4.64.85-1.43,1.75-3.52,1.86-5.55s.16-2.72.16-3V24.46c0-.25-.02-1.55-.02-1.24ZM26.3,79.03c-1.25,1.25-2.15,1.26-3.02,1.45-.88.18-6.77.85-6.77.85,0,0-.99,0-1.64-.39-.66-.39-.66-.99-.66-.99,0,0-.11-56.66,0-57.4.11-.74.66-1.71,1.84-1.84,1.18-.13,6.97-.53,6.97-.53,0,0,2.15-.18,3.4,1.33,1.25,1.51.94,2.97,1,4.81.07,1.84,0,49.55,0,49.55,0,0,.13,1.91-1.12,3.16Z";
const P2 =
  "M92.54,16.78c0,.31-.16-4.55-1.38-7.14s-1.42-3.06-3.64-5.16c-2.21-2.1-6.76-4.45-11.21-4.48-1.01.05-1.32.08-1.32.08l-21.94,2c-.49.04-1.06.18-1.6.64-.54.46-.82,1.11-.82,1.11,0-.25,0,84.47,0,84.47,0,.51.19,1.01.53,1.39.45.51,1.13.77,1.81.69l22.04-2.52c.3-.03,1.29-.23,1.65-.28.35-.06,5.9-1.75,10.39-6.38,1.84-1.85,3-3.9,3.5-4.64.85-1.43,1.75-3.52,1.86-5.55s.16-2.72.16-3V18.02c0-.25-.02-1.55-.02-1.24ZM76.92,72.58c-1.25,1.25-2.15,1.26-3.02,1.45-.88.18-6.77.85-6.77.85,0,0-.99,0-1.64-.39-.66-.39-.66-.99-.66-.99,0,0-.11-56.66,0-57.4.11-.74.66-1.71,1.84-1.84,1.18-.13,6.97-.53,6.97-.53,0,0,2.15-.18,3.4,1.33,1.25,1.51.94,2.97,1,4.81.07,1.84,0,49.55,0,49.55,0,0,.13,1.91-1.12,3.16Z";

const MONO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 92.55 96.84' fill='#ffffff'><path d='${P1}'/><path d='${P2}'/></svg>`;
const MONO_URI = `data:image/svg+xml,${encodeURIComponent(MONO_SVG)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background:
            "radial-gradient(120% 120% at 28% 18%, #2b2552 0%, #191830 46%, #0c0c16 100%)",
        }}
      >
        {/* glow del brand */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 620,
            height: 620,
            borderRadius: 620,
            background:
              "radial-gradient(circle, rgba(162,142,249,0.45), transparent 68%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -120,
            width: 640,
            height: 640,
            borderRadius: 640,
            background:
              "radial-gradient(circle, rgba(164,245,166,0.30), transparent 68%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MONO_URI} width={300} height={314} alt="" />
      </div>
    ),
    { ...size },
  );
}
