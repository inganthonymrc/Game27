import React from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { RISK_OPTIONS } from '../game/rules';
import type { OutfitId, RiskChoiceId, SpecializationId } from '../game/types';

interface RiskBriefingModalProps {
  specialization: SpecializationId;
  outfit: OutfitId;
  onChangeSpecialization: (spec: SpecializationId) => void;
  onChangeOutfit: (outfit: OutfitId) => void;
  onCommitRisk: (risk: RiskChoiceId) => void;
}

export const RiskBriefingModal: React.FC<RiskBriefingModalProps> = ({
  specialization,
  outfit,
  onChangeSpecialization,
  onChangeOutfit,
  onCommitRisk,
}) => {
  const options = [
    RISK_OPTIONS.low_imperial,
    RISK_OPTIONS.moderate_throne,
    RISK_OPTIONS.high_gate,
  ];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 md:p-8 bg-[#050810]/78 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#0a101c] border border-[#2a3950] p-6 md:p-8 rounded-sm shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1f2c40] pb-4 mb-5">
          <div>
            <div className="text-xs font-mono-num uppercase tracking-widest text-[#d98a38] mb-1">
              ACT II · MISSION BRIEFING · 120 COLONISTS TRAPPED
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[#f8fafc]">
              Ember’s Final Hour
            </h1>
            <p className="text-sm text-[#cbd5e1] mt-1 max-w-2xl">
              Life support on Ember Moon is failing under Zenith blockade. Commit to an evacuation
              vector—your capacity, time window, and political obligations carry directly back to the
              Orbital Refuge and Assembly floor.
            </p>
          </div>

          {/* Pre-Drop Specialization & Suit Selector */}
          <div className="flex flex-col gap-2 bg-[#0f1728] border border-[#24334a] p-3 rounded-sm">
            <div className="text-[11px] font-mono-num uppercase tracking-wider text-[#94a3b8]">
              Iara Loadout
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'engineering', label: 'Engineering' },
                  { id: 'protection', label: 'Protection' },
                  { id: 'diplomacy', label: 'Diplomacy' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChangeSpecialization(s.id)}
                  className={`px-2.5 py-1 text-xs font-display font-semibold rounded-sm cursor-pointer border ${
                    specialization === s.id
                      ? 'bg-[#d98a38] border-[#d98a38] text-[#070b12]'
                      : 'bg-[#141f33] border-[#2c3d57] text-[#cbd5e1]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'mining_uniform', label: 'Mining Uniform (100s O₂)' },
                  { id: 'pressure_suit', label: 'EVA Pressure Suit (145s O₂)' },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onChangeOutfit(o.id)}
                  className={`px-2.5 py-1 text-xs font-mono-num rounded-sm cursor-pointer border ${
                    outfit === o.id
                      ? 'bg-[#0ea5e9]/20 border-[#38bdf8] text-[#e0f2fe]'
                      : 'bg-[#141f33] border-[#2c3d57] text-[#94a3b8]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Risk Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((opt) => {
            const isLow = opt.id === 'low_imperial';
            const isMod = opt.id === 'moderate_throne';
            const accent = isLow
              ? 'border-[#34d399]/60 text-[#34d399]'
              : isMod
              ? 'border-[#38bdf8]/60 text-[#38bdf8]'
              : 'border-[#fb7185]/70 text-[#fb7185]';

            return (
              <div
                key={opt.id}
                className="flex flex-col justify-between bg-[#0f1728] border border-[#27364f] p-5 rounded-sm"
              >
                <div>
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-mono-num font-bold tracking-widest border px-2 py-0.5 mb-3 ${accent}`}>
                    {isLow ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : isMod ? (
                      <Zap className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {opt.tierLabel}
                  </div>

                  <h2 className="font-display font-bold text-lg text-[#f8fafc] mb-2">
                    {opt.title}
                  </h2>

                  <div className="grid grid-cols-2 gap-2 bg-[#090e18] p-2.5 mb-3 border border-[#1d293d]">
                    <div>
                      <div className="text-[10px] uppercase text-[#94a3b8]">Est. Capacity</div>
                      <div className="font-mono-num font-bold text-base text-[#fbbf24]">
                        {opt.estimatedCapacity} / 120
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[#94a3b8]">Window</div>
                      <div className="font-mono-num font-bold text-base text-[#e2e8f0]">
                        {opt.timeLimitSeconds}s
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#cbd5e1] leading-relaxed mb-3">{opt.summary}</p>

                  <div className="text-[11px] text-[#fde68a] bg-[#1e1a12] border border-[#78511a]/60 p-2.5 mb-2">
                    <span className="font-bold uppercase">Obligation: </span>
                    {opt.obligation}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mb-4">{opt.resourceImpact}</div>
                </div>

                <button
                  type="button"
                  onClick={() => onCommitRisk(opt.id)}
                  className="w-full py-2.5 bg-[#d98a38] hover:bg-[#e59b49] text-[#070b12] font-display font-bold text-sm uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Deploy: {opt.tierLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
