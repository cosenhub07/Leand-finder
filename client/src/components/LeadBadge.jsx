/**
 * LeadBadge.jsx
 * Displays a colored pill badge + score ring for each lead.
 */

import React from "react";

const SCORE_COLORS = {
  hot:  { ring: "#ef4444", bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
  warm: { ring: "#f59e0b", bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  cold: { ring: "#3b82f6", bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
};

export default function LeadBadge({ score, label, emoji, type }) {
  const colors = SCORE_COLORS[type] || SCORE_COLORS.cold;

  // SVG ring calculation
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const filled = ((score || 0) / 100) * circumference;
  const dashArray = `${filled} ${circumference - filled}`;

  return (
    <div className="flex items-center gap-2">
      {/* Score Ring */}
      <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
          {/* Track */}
          <circle
            cx="22" cy="22" r={radius}
            fill="none"
            stroke="rgba(30,41,59,0.9)"
            strokeWidth="4"
          />
          {/* Fill */}
          <circle
            cx="22" cy="22" r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset="0"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <span
          style={{ color: colors.text, fontSize: "0.68rem", fontWeight: 700, zIndex: 1 }}
        >
          {score}
        </span>
      </div>

      {/* Pill Badge */}
      <span
        className={`badge-${type} px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap`}
      >
        {emoji} {label}
      </span>
    </div>
  );
}
