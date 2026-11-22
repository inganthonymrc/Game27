import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { evaluateEnding } from '../game/rules';
import type { CampaignState } from '../game/types';

interface EndingModalProps {
  campaign: CampaignState;
  onReplay: () => void;
  onReturnTitle: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  campaign,
  onReplay,
  onReturnTitle,
}) => {
  const ending = evaluateEnding(campaign);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-end p-4 md:p-8">
      {/* Keep Left Viewport Clear so Transformed Refuge Freighter & Allied Fleet are Visible */}
      <div className="pointer-events-auto w-full max-w-2xl max-h-[92vh] overflow-y-auto gdd-scroll bg-[#090e18]/94 border border-[#d98a38]/70 p-6 md:p-7 rounded-sm shadow-2xl">
        <div className="text-[11px] font-mono-num uppercase tracking-widest text-[#d98a38] mb-1">
          ACT III · RETURN TO THE REFUGE · CAMPAIGN EPILOGUE
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-[#f8fafc]">
          {ending.title}
        </h1>
        <p className="text-sm text-[#38bdf8] font-medium mb-4">{ending.subtitle}</p>

        {/* Mastery & World Order Metrics */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-[#0e1625] border border-[#223047] p-3">
            <div className="text-[10px] uppercase text-[#94a3b8]">Survivors</div>
            <div className="font-mono-num font-bold text-lg text-[#fbbf24]">
              {campaign.totalSurvivorsAtRefuge}
            </div>
          </div>
          <div className="bg-[#0e1625] border border-[#223047] p-3">
            <div className="text-[10px] uppercase text-[#94a3b8]">Wounded Saved</div>
            <div className="font-mono-num font-bold text-lg text-[#34d399]">
              {campaign.woundedSaved}
            </div>
          </div>
          <div className="bg-[#0e1625] border border-[#223047] p-3">
            <div className="text-[10px] uppercase text-[#94a3b8]">Campaign Score</div>
            <div className="font-mono-num font-bold text-lg text-[#f8fafc]">{ending.score}</div>
          </div>
        </div>

        <div className="space-y-2.5 text-xs bg-[#0e1625] border border-[#24334a] p-4 mb-4">
          <div>
            <span className="text-[#94a3b8] uppercase font-semibold">Jump Gate Control: </span>
            <span className="text-[#f8fafc]">{ending.gateController}</span>
          </div>
          <div>
            <span className="text-[#94a3b8] uppercase font-semibold">Assembly Representation: </span>
            <span className="text-[#cbd5e1]">{ending.representation}</span>
          </div>
          <div>
            <span className="text-[#94a3b8] uppercase font-semibold">Promises Ledger: </span>
            <span className="text-[#fbbf24]">{ending.promisesSummary}</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#cbd5e1] leading-relaxed mb-4">
          {ending.epilogueLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {/* Visible World Changes */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-wider text-[#38bdf8] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Visible Refuge &amp; Coalition Changes
          </div>
          <ul className="space-y-1 text-xs text-[#cbd5e1] list-disc list-inside">
            {campaign.worldChanges.slice(-5).map((wc, idx) => (
              <li key={idx}>{wc}</li>
            ))}
          </ul>
        </div>

        {/* Companion Final Fates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          {Object.values(campaign.companions).map((c) => (
            <div key={c.id} className="bg-[#0d1422] border border-[#223047] p-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#f8fafc]">
                <span>{c.name}</span>
                <span
                  className={`uppercase text-[10px] font-mono-num ${
                    c.status === 'departed'
                      ? 'text-[#fb7185]'
                      : c.status === 'challenging'
                      ? 'text-[#fbbf24]'
                      : 'text-[#34d399]'
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1 leading-snug">{c.lastRemark}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onReplay}
            className="flex-1 py-2.5 px-4 bg-[#d98a38] hover:bg-[#e59b49] text-[#070b12] font-display font-bold text-sm uppercase tracking-wider rounded-sm cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Another Branch
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="py-2.5 px-5 bg-[#152033] hover:bg-[#1e2d47] border border-[#2f415e] text-[#e2e8f0] font-display font-semibold text-sm uppercase rounded-sm cursor-pointer"
          >
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
