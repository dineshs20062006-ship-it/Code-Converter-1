import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function CodeConverterLogo({ className = "", size = 28 }: LogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden bg-[#0A0D14] border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-indigo-600/25 pointer-events-none" />

      <svg
        width={size * 0.75}
        height={size * 0.75}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
      >
        <defs>
          <linearGradient id="cc-grad-cyan-blue" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="cc-grad-accent" x1="0" y1="16" x2="32" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        {/* Left Angle Bracket '<' shaped with upper & lower 'C' contour */}
        <path
          d="M 12 7 L 6 16 L 12 25"
          stroke="url(#cc-grad-cyan-blue)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Angle Bracket '>' shaped with complementary 'C' contour */}
        <path
          d="M 20 7 L 26 16 L 20 25"
          stroke="url(#cc-grad-cyan-blue)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Interlocking Code Conversion Slash & Dual Arc Curve */}
        <path
          d="M 18 8 L 14 24"
          stroke="url(#cc-grad-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Glowing Center Core Dot */}
        <circle cx="16" cy="16" r="1.5" fill="#38BDF8" />
      </svg>
    </div>
  );
}
