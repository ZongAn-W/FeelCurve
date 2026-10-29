"use client";

import { useId } from "react";
import type { Locale } from "@/lib/i18n";

export type GlassPatternId = "medallion" | "cloud" | "brocade" | "aurora";

export const GLASS_PATTERNS: {
  id: GlassPatternId;
  label: Record<Locale, string>;
}[] = [
  { id: "medallion", label: { zh: "团花", en: "Medallion" } },
  { id: "cloud", label: { zh: "云纹", en: "Clouds" } },
  { id: "brocade", label: { zh: "织锦", en: "Brocade" } },
  { id: "aurora", label: { zh: "极光", en: "Aurora" } },
];

type PatternProps = {
  id: GlassPatternId;
  className?: string;
};

export function GlassPattern({ id, className }: PatternProps) {
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9_-]/g, "");
  const classes = ["h-full w-full", className ?? ""].join(" ");

  if (id === "cloud") return <CloudPattern uid={uid} className={classes} />;
  if (id === "brocade") return <BrocadePattern uid={uid} className={classes} />;
  if (id === "aurora") return <AuroraPattern className={classes} />;
  return <MedallionPattern uid={uid} className={classes} />;
}

const PETALS = Array.from({ length: 12 }, (_, index) => index * 30);
const SMALL_PETALS = Array.from({ length: 8 }, (_, index) => index * 45);

function MedallionPattern({
  uid,
  className,
}: {
  uid: string;
  className: string;
}) {
  const bg = `${uid}-bg`;
  const gold = `${uid}-gold`;
  const tile = `${uid}-tile`;
  const vignette = `${uid}-vignette`;
  const petal =
    "M0 0 C -13 -18 -15 -40 0 -58 C 15 -40 13 -18 0 0 Z";
  const innerPetal =
    "M0 0 C -9 -12 -10 -27 0 -40 C 10 -27 9 -12 0 0 Z";

  return (
    <svg
      aria-hidden
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="44%" r="82%">
          <stop offset="0%" stopColor="#B34A2F" />
          <stop offset="52%" stopColor="#8E2B23" />
          <stop offset="100%" stopColor="#4E1417" />
        </radialGradient>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E3AE" />
          <stop offset="50%" stopColor="#E4B368" />
          <stop offset="100%" stopColor="#C88C3F" />
        </linearGradient>
        <radialGradient id={vignette} cx="50%" cy="46%" r="74%">
          <stop offset="52%" stopColor="#2A070A" stopOpacity="0" />
          <stop offset="100%" stopColor="#2A070A" stopOpacity="0.62" />
        </radialGradient>
        <pattern
          id={tile}
          width="96"
          height="96"
          patternUnits="userSpaceOnUse"
        >
          <g transform="translate(48 48)">
            {SMALL_PETALS.map((angle) => (
              <path
                key={angle}
                d="M0 -4 C -6 -10 -6 -18 0 -24 C 6 -18 6 -10 0 -4 Z"
                transform={`rotate(${angle})`}
                fill="rgba(249,227,174,0.22)"
                stroke={`url(#${gold})`}
                strokeWidth="1.1"
              />
            ))}
            <circle
              r="3.2"
              fill={`url(#${gold})`}
              fillOpacity="0.75"
            />
            <circle
              r="30"
              fill="none"
              stroke={`url(#${gold})`}
              strokeWidth="0.5"
              strokeDasharray="1 6"
              opacity="0.45"
            />
          </g>
        </pattern>
      </defs>

      <rect width="400" height="300" fill={`url(#${bg})`} />
      <rect width="400" height="300" fill={`url(#${tile})`} />

      <g transform="translate(200 150)">
        <circle
          r="118"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="1"
          opacity="0.28"
        />
        <circle
          r="108"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="0.8"
          strokeDasharray="2 7"
          opacity="0.42"
        />
        {PETALS.map((angle) => (
          <path
            key={angle}
            d={petal}
            transform={`rotate(${angle})`}
            fill="rgba(249,227,174,0.24)"
            stroke={`url(#${gold})`}
            strokeWidth="1.6"
          />
        ))}
        {PETALS.map((angle) => (
          <circle
            key={`dot-${angle}`}
            cx="0"
            cy="-96"
            r="3"
            transform={`rotate(${angle + 15})`}
            fill={`url(#${gold})`}
            opacity="0.9"
          />
        ))}
        <circle
          r="66"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="2"
          opacity="0.65"
        />
        {SMALL_PETALS.map((angle) => (
          <path
            key={`inner-${angle}`}
            d={innerPetal}
            transform={`rotate(${angle})`}
            fill="rgba(249,227,174,0.28)"
            stroke={`url(#${gold})`}
            strokeWidth="1.4"
          />
        ))}
        <circle
          r="30"
          fill="rgba(249,227,174,0.3)"
          stroke={`url(#${gold})`}
          strokeWidth="1.8"
        />
        <circle r="10" fill={`url(#${gold})`} opacity="0.8" />
        <circle r="3.6" fill="#FFF4D8" />
      </g>

      <g transform="translate(48 42)" opacity="0.62">
        <circle
          r="22"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="0.8"
        />
        {[0, 45, 90, 135].map((angle) => (
          <path
            key={angle}
            d="M0 -3 C -4 -8 -4 -15 0 -20 C 4 -15 4 -8 0 -3 Z"
            transform={`rotate(${angle})`}
            fill="rgba(249,227,174,0.12)"
            stroke={`url(#${gold})`}
            strokeWidth="0.7"
          />
        ))}
      </g>
      <g transform="translate(352 258) rotate(18)" opacity="0.55">
        <circle
          r="18"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="0.8"
        />
        {[0, 45, 90, 135].map((angle) => (
          <path
            key={angle}
            d="M0 -3 C -4 -8 -4 -15 0 -20 C 4 -15 4 -8 0 -3 Z"
            transform={`rotate(${angle})`}
            fill="rgba(249,227,174,0.12)"
            stroke={`url(#${gold})`}
            strokeWidth="0.7"
          />
        ))}
      </g>

      <rect width="400" height="300" fill={`url(#${vignette})`} />
    </svg>
  );
}

function CloudMotif({ color }: { color: string }) {
  return (
    <g
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 62c-4 0-7-3-7-7 0-5 3-8 8-9 1-10 9-17 19-17 10 0 18 6 20 15 3-2 7-3 10-3 9 0 16 6 17 15 6 1 10 5 10 10" />
      <path d="M16 60c-3-2-4-5-2-8 2-3 6-3 8 0 2 2 1 5-1 7" />
      <path d="M43 44c-4-2-6-6-4-10 2-4 7-5 10-2 3 3 2 7-1 9" />
      <path d="M66 60c0-4 3-7 7-7 1-5 5-9 10-9 6 0 10 4 11 9" />
      <circle cx="27" cy="50" r="1.4" fill={color} stroke="none" />
      <circle cx="79" cy="53" r="1.4" fill={color} stroke="none" />
    </g>
  );
}

function CloudPattern({
  uid,
  className,
}: {
  uid: string;
  className: string;
}) {
  const bg = `${uid}-bg`;
  const tile = `${uid}-tile`;
  const gold = `${uid}-gold`;
  const mint = `${uid}-mint`;
  const disc = `${uid}-disc`;
  const vignette = `${uid}-vignette`;

  return (
    <svg
      aria-hidden
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F3E3C" />
          <stop offset="52%" stopColor="#0A2A33" />
          <stop offset="100%" stopColor="#061A24" />
        </linearGradient>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0D49B" />
          <stop offset="100%" stopColor="#C7924A" />
        </linearGradient>
        <linearGradient id={mint} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8F3DE" />
          <stop offset="100%" stopColor="#63BFAE" />
        </linearGradient>
        <radialGradient id={disc} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4DCA6" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#D8B06C" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#D8B06C" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={tile}
          width="150"
          height="96"
          patternUnits="userSpaceOnUse"
        >
          <g transform="translate(10 4)" opacity="0.5">
            <CloudMotif color={`url(#${mint})`} />
          </g>
          <g transform="translate(88 48) scale(0.78)" opacity="0.38">
            <CloudMotif color={`url(#${gold})`} />
          </g>
        </pattern>
        <radialGradient id={vignette} cx="50%" cy="45%" r="76%">
          <stop offset="52%" stopColor="#021016" stopOpacity="0" />
          <stop offset="100%" stopColor="#021016" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${bg})`} />
      <rect width="400" height="300" fill={`url(#${tile})`} />

      <circle cx="86" cy="72" r="66" fill={`url(#${disc})`} />
      <circle
        cx="86"
        cy="72"
        r="34"
        fill="#F4DCA6"
        fillOpacity="0.16"
        stroke={`url(#${gold})`}
        strokeWidth="0.8"
      />

      <g transform="translate(196 150) scale(1.55)" opacity="0.75">
        <CloudMotif color={`url(#${gold})`} />
      </g>
      <g transform="translate(62 194) scale(0.9)" opacity="0.42">
        <CloudMotif color={`url(#${mint})`} />
      </g>
      <g
        transform="translate(306 240) rotate(180) scale(0.72)"
        opacity="0.4"
      >
        <CloudMotif color={`url(#${gold})`} />
      </g>

      <rect width="400" height="300" fill={`url(#${vignette})`} />
    </svg>
  );
}

const BROCADE_ANGLES = [0, 90, 180, 270];

function BrocadePattern({
  uid,
  className,
}: {
  uid: string;
  className: string;
}) {
  const bg = `${uid}-bg`;
  const tile = `${uid}-tile`;
  const gold = `${uid}-gold`;
  const vignette = `${uid}-vignette`;

  return (
    <svg
      aria-hidden
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="42%" r="82%">
          <stop offset="0%" stopColor="#303C72" />
          <stop offset="55%" stopColor="#1D2750" />
          <stop offset="100%" stopColor="#0C112C" />
        </radialGradient>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3D6A0" />
          <stop offset="100%" stopColor="#C29152" />
        </linearGradient>
        <pattern
          id={tile}
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M32 2 62 32 32 62 2 32Z"
            fill="rgba(243,214,160,0.05)"
            stroke={`url(#${gold})`}
            strokeWidth="1.1"
            opacity="0.6"
          />
          <path
            d="M32 16 48 32 32 48 16 32Z"
            fill="rgba(243,214,160,0.07)"
            stroke={`url(#${gold})`}
            strokeWidth="0.6"
            opacity="0.6"
          />
          <g transform="translate(32 32)">
            {BROCADE_ANGLES.map((angle) => (
              <ellipse
                key={angle}
                cx="0"
                cy="-6.4"
                rx="2.6"
                ry="5.8"
                transform={`rotate(${angle})`}
                fill="#F1AEA6"
                fillOpacity="0.85"
              />
            ))}
            <circle r="2.1" fill={`url(#${gold})`} />
          </g>
          <circle cx="2" cy="2" r="1.4" fill={`url(#${gold})`} opacity="0.55" />
          <circle cx="62" cy="62" r="1.4" fill={`url(#${gold})`} opacity="0.55" />
        </pattern>
        <radialGradient id={vignette} cx="50%" cy="46%" r="76%">
          <stop offset="50%" stopColor="#05081B" stopOpacity="0" />
          <stop offset="100%" stopColor="#05081B" stopOpacity="0.66" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${bg})`} />
      <rect width="400" height="300" fill={`url(#${tile})`} />

      <g transform="translate(200 150)" opacity="0.6">
        <circle
          r="92"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="0.8"
          strokeDasharray="3 6"
        />
        <path
          d="M0 -104 104 0 0 104 -104 0Z"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="0.9"
          opacity="0.6"
        />
        <path
          d="M0 -84 84 0 0 84 -84 0Z"
          fill="rgba(243,214,160,0.03)"
          stroke={`url(#${gold})`}
          strokeWidth="0.6"
          opacity="0.5"
        />
      </g>
      <g transform="translate(200 150)">
        {BROCADE_ANGLES.map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-24"
            rx="8"
            ry="18"
            transform={`rotate(${angle})`}
            fill="#F1AEA6"
            fillOpacity="0.16"
            stroke={`url(#${gold})`}
            strokeWidth="0.7"
          />
        ))}
        <circle
          r="12"
          fill="rgba(243,214,160,0.12)"
          stroke={`url(#${gold})`}
          strokeWidth="0.8"
        />
        <circle r="3.6" fill="#F7E3BC" />
      </g>

      <rect width="400" height="300" fill={`url(#${vignette})`} />
    </svg>
  );
}

function AuroraPattern({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        background: [
          "radial-gradient(58% 72% at 16% 20%, rgba(255, 122, 158, 0.96), transparent 62%)",
          "radial-gradient(52% 66% at 84% 26%, rgba(96, 225, 245, 0.9), transparent 63%)",
          "radial-gradient(66% 76% at 48% 108%, rgba(150, 230, 96, 0.85), transparent 62%)",
          "radial-gradient(46% 58% at 92% 88%, rgba(158, 130, 255, 0.92), transparent 64%)",
          "linear-gradient(158deg, #231447 0%, #120E2B 58%, #08101F 100%)",
        ].join(", "),
      }}
    />
  );
}
