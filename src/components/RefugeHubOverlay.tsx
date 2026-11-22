import React, { useState } from 'react';
import { Activity, Award, Shield, Wrench } from 'lucide-react';
import type {
  CampaignState,
  InsigniaId,
  OutfitId,
  RefugeAllocation,
  SpecializationId,
} from '../game/types';

interface RefugeHubOverlayProps {
  campaign: CampaignState;
  onUpdateWardrobe: (
    outfit: OutfitId,
    insignia: InsigniaId,
    specialization: SpecializationId
  ) => void;
  onConfirmAllocation: (alloc: RefugeAllocation) => void;
}

export const RefugeHubOverlay: React.FC<RefugeHubOverlayProps> = ({
  campaign,
  onUpdateWardrobe,
  onConfirmAllocation,
}) => {
  const totalPowerAvailable = campaign.powerCellsBank + campaign.refugePowerReserve;
  const infirmaryMinimum = campaign.riskChoice === 'high_gate' ? 2 : 1;

  const [infirmaryCells, setInfirmaryCells] = useState<number>(
    Math.min(totalPowerAvailable, infirmaryMinimum)
  );
  const [shieldCells, setShieldCells] = useState<number>(
    Math.max(0, Math.min(totalPowerAvailable - Math.min(totalPowerAvailable, infirmaryMinimum), 1))
  );
  const [medkitsUsed, setMedkitsUsed] = useState<number>(Math.min(campaign.medkitsBank, 2));

  const remainingCells = Math.max(0, totalPowerAvailable - infirmaryCells - shieldCells);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-end p-4 md:p-8">
      {/* Keep Left Viewport Clear to Showcase 3D Iara Outfit + Orbital Refuge Freighter */}
      <div className="pointer-events-auto w-full max-w-2xl max-h-[92vh] overflow-y-auto gdd-scroll bg-[#090e18]/94 border border-[#2a3950] p-6 rounded-sm shadow-2xl">
        <div className="border-b border-[#1e2c42] pb-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono-num uppercase tracking-widest text-[#d98a38]">
              ORBITAL REFUGE · AEGIS HULL
            </div>
            <h1 className="font-display font-bold text-2xl text-[#f8fafc]">
              Refuge Triage, Wardrobe &amp; Power Allocation
            </h1>
          </div>
          <div className="text-right font-mono-num text-xs text-[#cbd5e1] shrink-0 whitespace-nowrap">
            <div>Survivors: {campaign.totalSurvivorsAtRefuge}</div>
            <div className="text-[#fbbf24]">Wounded: {campaign.woundedWaiting}</div>
          </div>
        </div>

        {/* Expedition Aftermath Summary */}
        {campaign.expeditionResult && (
          <div className="bg-[#0e1625] border border-[#23324a] p-3 mb-4 text-xs text-[#cbd5e1] flex flex-wrap gap-4 justify-between">
            <span>
              Rescued:{' '}
              <strong className="text-[#fbbf24] font-mono-num">
                {campaign.expeditionResult.evacueesRescued}
              </strong>
            </span>
            <span>
              Power Pool:{' '}
              <strong className="text-[#38bdf8] font-mono-num">{totalPowerAvailable} Cells</strong>
            </span>
            <span>
              Medkits:{' '}
              <strong className="text-[#34d399] font-mono-num">{campaign.medkitsBank}</strong>
            </span>
            <span>
              Resolutions:{' '}
              <strong className="text-[#e2e8f0] font-mono-num">
                {campaign.expeditionResult.enemiesDefeated} Combat ·{' '}
                {campaign.expeditionResult.stealthBypassed} Stealth ·{' '}
                {campaign.expeditionResult.dialogueResolved} Dialogue
              </strong>
            </span>
          </div>
        )}

        {/* Wardrobe & Insignia (Visibly updates 3D model on left!) */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#e2e8f0] mb-2">
            <Award className="w-4 h-4 text-[#d98a38]" />
            Outfit &amp; Assembly Insignia (Updates 3D Preview)
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {(
              [
                { id: 'mining_uniform', title: 'Mining Uniform', sub: '100s O₂ · Dock Solidarity' },
                { id: 'pressure_suit', title: 'EVA Pressure Suit', sub: '145s O₂ · Vacuum Rig' },
                { id: 'ceremonial_coat', title: 'Ceremonial Coat', sub: '+2 Assembly Votes' },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onUpdateWardrobe(o.id, campaign.insignia, campaign.specialization)}
                className={`p-2.5 text-left border rounded-sm cursor-pointer transition-colors ${
                  campaign.outfit === o.id
                    ? 'bg-[#15243d] border-[#d98a38] text-[#f8fafc]'
                    : 'bg-[#0d1422] border-[#243247] text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                <div className="font-display font-bold text-xs">{o.title}</div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5">{o.sub}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
            {(
              [
                { id: 'miner_wrench', label: "Miner's Wrench" },
                { id: 'tides_crest', label: 'Tides Crest' },
                { id: 'glass_lotus', label: 'Glass Lotus' },
                { id: 'throne_compass', label: 'Throne Compass' },
              ] as const
            ).map((ins) => (
              <button
                key={ins.id}
                type="button"
                onClick={() => onUpdateWardrobe(campaign.outfit, ins.id, campaign.specialization)}
                className={`px-2.5 py-1.5 text-xs font-mono-num border rounded-sm cursor-pointer ${
                  campaign.insignia === ins.id
                    ? 'bg-[#0ea5e9]/20 border-[#38bdf8] text-[#e0f2fe]'
                    : 'bg-[#0d1422] border-[#243247] text-[#94a3b8]'
                }`}
              >
                {ins.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'engineering', label: 'Engineering (+20 Suit Pwr)' },
                { id: 'protection', label: 'Protection (+30 HP & Shield Eff.)' },
                { id: 'diplomacy', label: 'Diplomacy (+2 Votes & +10 Trust)' },
              ] as const
            ).map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => onUpdateWardrobe(campaign.outfit, campaign.insignia, sp.id)}
                className={`px-3 py-1.5 text-xs border rounded-sm cursor-pointer ${
                  campaign.specialization === sp.id
                    ? 'bg-[#d98a38]/25 border-[#d98a38] text-[#fde68a]'
                    : 'bg-[#0d1422] border-[#243247] text-[#94a3b8]'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Competing Power Allocation: Infirmary vs Kinetic Shield */}
        <div className="bg-[#0e1625] border border-[#24334a] p-4 rounded-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#e2e8f0]">
              <Wrench className="w-4 h-4 text-[#38bdf8]" />
              Competing Resource Allocation ({remainingCells} Unassigned Cells)
            </div>
            <span className="text-[11px] font-mono-num text-[#fbbf24]">
              Infirmary needs ≥ {infirmaryMinimum} Cell(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#090e18] border border-[#1d2b40] p-3">
              <div className="flex items-center gap-1.5 text-xs text-[#34d399] font-semibold mb-2">
                <Activity className="w-3.5 h-3.5" />
                Infirmary Grid
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setInfirmaryCells((v) => Math.max(0, v - 1))}
                  className="w-7 h-7 bg-[#162033] text-[#e2e8f0] rounded-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono-num font-bold text-lg text-[#f8fafc]">
                  {infirmaryCells}
                </span>
                <button
                  type="button"
                  onClick={() => remainingCells > 0 && setInfirmaryCells((v) => v + 1)}
                  className="w-7 h-7 bg-[#162033] text-[#e2e8f0] rounded-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-[#090e18] border border-[#1d2b40] p-3">
              <div className="flex items-center gap-1.5 text-xs text-[#38bdf8] font-semibold mb-2">
                <Shield className="w-3.5 h-3.5" />
                Suit Shield Reserve
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShieldCells((v) => Math.max(0, v - 1))}
                  className="w-7 h-7 bg-[#162033] text-[#e2e8f0] rounded-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono-num font-bold text-lg text-[#f8fafc]">
                  {shieldCells}
                </span>
                <button
                  type="button"
                  onClick={() => remainingCells > 0 && setShieldCells((v) => v + 1)}
                  className="w-7 h-7 bg-[#162033] text-[#e2e8f0] rounded-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-[#090e18] border border-[#1d2b40] p-3">
              <div className="text-xs text-[#fbbf24] font-semibold mb-2">
                Medkits to Triage ({campaign.medkitsBank} Avail)
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMedkitsUsed((v) => Math.max(0, v - 1))}
                  className="w-7 h-7 bg-[#162033] text-[#e2e8f0] rounded-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono-num font-bold text-lg text-[#f8fafc]">
                  {medkitsUsed}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    medkitsUsed < campaign.medkitsBank && setMedkitsUsed((v) => v + 1)
                  }
                  className="w-7 h-7 bg-[#162033] text-[#e2e8f0] rounded-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Feedback */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
          {Object.values(campaign.companions).map((c) => (
            <div key={c.id} className="bg-[#0d1422] border border-[#223047] p-2.5 rounded-sm">
              <div className="flex items-center justify-between text-xs font-bold text-[#f8fafc]">
                <span>{c.name}</span>
                <span
                  className={`font-mono-num ${
                    c.status === 'departed'
                      ? 'text-[#fb7185]'
                      : c.status === 'challenging'
                      ? 'text-[#fbbf24]'
                      : 'text-[#34d399]'
                  }`}
                >
                  {c.loyalty}%
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1 leading-snug">“{c.lastRemark}”</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            onConfirmAllocation({
              infirmaryPowerAllocated: infirmaryCells,
              shieldReserveAllocated: shieldCells,
              medkitsAssignedToInfirmary: medkitsUsed,
            })
          }
          className="w-full py-3 bg-[#d98a38] hover:bg-[#e59b49] text-[#070b12] font-display font-bold text-sm uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
        >
          Lock Refuge Grid &amp; Enter Diplomatic Assembly
        </button>
      </div>
    </div>
  );
};
