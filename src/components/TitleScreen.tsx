import React from 'react';
import { BookOpen, Play } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGdd: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onOpenGdd }) => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-8 md:p-14">
      {/* Left/Upper-Left Calm Negative Space Lockup */}
      <div className="max-w-xl mt-6 md:mt-12 pointer-events-auto">
        {/* Bespoke Inline SVG Title Emblem */}
        <svg
          viewBox="0 0 650 156"
          className="w-full max-w-[560px] h-auto mb-5 overflow-visible"
          role="img"
          aria-label="The Orbital Pact"
        >
          {/* Orbital Ring & Broken Chain Motif */}
          <g fill="none" stroke="#d98a38" strokeWidth="2.5">
            <circle cx="48" cy="64" r="34" strokeOpacity="0.85" />
            <ellipse cx="48" cy="64" rx="44" ry="15" transform="rotate(-22 48 64)" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="48" cy="64" r="7" fill="#d98a38" stroke="none" />
          </g>
          {/* Display Lockup */}
          <text
            x="108"
            y="48"
            fill="#94a3b8"
            fontFamily="Chakra Petch, sans-serif"
            fontSize="14"
            fontWeight="600"
            letterSpacing="5.5"
          >
            THREE-ACT SURVIVAL &amp; COALITION
          </text>
          <text
            x="106"
            y="98"
            fill="#f1f5f9"
            fontFamily="Chakra Petch, sans-serif"
            fontSize="48"
            fontWeight="700"
            letterSpacing="2"
          >
            THE ORBITAL PACT
          </text>
          <line x1="108" y1="116" x2="610" y2="116" stroke="#d98a38" strokeWidth="2" strokeOpacity="0.8" />
          <text
            x="108"
            y="140"
            fill="#cbd5e1"
            fontFamily="Space Grotesk, sans-serif"
            fontSize="15"
            fontWeight="500"
          >
            Escape the mines · Keep the refuge breathing · Break the Jump-Gate blockade
          </text>
        </svg>

        {/* Primary & Secondary CTAs (<= 3 menu actions) */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="inline-flex items-center gap-3 px-7 py-3.5 bg-[#d98a38] hover:bg-[#e59b49] active:translate-y-px text-[#070b12] font-display font-bold text-base tracking-wider uppercase rounded-sm transition-colors cursor-pointer shadow-[0_6px_24px_rgba(217,138,56,0.3)]"
          >
            <Play className="w-4 h-4 fill-current" />
            Begin Campaign Slice
          </button>

          <button
            type="button"
            onClick={onOpenGdd}
            className="inline-flex items-center gap-2.5 px-5 py-3.5 bg-[#0d1422]/90 hover:bg-[#162036] text-[#e2e8f0] border border-[#334155] font-display font-semibold text-sm tracking-wider uppercase rounded-sm transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#38bdf8]" />
            Game Design Document
          </button>
        </div>
      </div>

      {/* Single Flat Inline Control Hint Line */}
      <div className="text-xs md:text-sm font-mono-num tracking-wider text-[#94a3b8] hud-stroke">
        WASD Move · Mouse Aim/Fire · 1–3 Gear · C Crouch · E Interact/Stealth · Esc Pause
      </div>
    </div>
  );
};
