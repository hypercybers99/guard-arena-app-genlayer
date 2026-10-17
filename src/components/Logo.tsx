import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-label="BreakTheGuard Logo"
    >
      <defs>
        <linearGradient id="shieldGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="glowGradComp" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="shackleGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Outer Shield */}
      <path
        d="M 50 8 C 70 8 86 16 86 34 C 86 58 66 78 50 92 C 34 78 14 58 14 34 C 14 16 30 8 50 8 Z"
        fill="url(#shieldGradComp)"
        stroke="#60A5FA"
        strokeWidth="2.5"
      />

      {/* Inner Bevel Accent */}
      <path
        d="M 50 14 C 66 14 78 20 78 35 C 78 54 62 70 50 82 C 38 70 22 54 22 35 C 22 20 34 14 50 14 Z"
        fill="none"
        stroke="url(#glowGradComp)"
        strokeWidth="1.5"
        strokeDasharray="2 1"
      />

      {/* Padlock Shackle */}
      <path
        d="M 39 42 V 33 C 39 26.9 43.9 22 50 22 C 56.1 22 61 26.9 61 33 V 42"
        fill="none"
        stroke="url(#shackleGradComp)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Padlock Plate */}
      <rect
        x="34"
        y="40"
        width="32"
        height="26"
        rx="5"
        fill="#0F172A"
        stroke="#38BDF8"
        strokeWidth="2"
      />

      {/* Keyhole */}
      <circle cx="50" cy="49" r="4.5" fill="#38BDF8" />
      <polygon points="48,49 52,49 53,60 47,60" fill="#38BDF8" />
    </svg>
  );
};
