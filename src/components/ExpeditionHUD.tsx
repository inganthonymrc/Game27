import React from 'react';
import { BookOpen, Pause, Volume2, VolumeX } from 'lucide-react';
import type { ExpeditionMetrics, GearId } from '../game/types';

interface ExpeditionHUDProps {
  metrics: ExpeditionMetrics;
  muted: boolean;
  onSelectGear: (gear: GearId) => void;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenGdd: () => void;
}

export const ExpeditionHUD: React.FC<ExpeditionHUDProps> = ({
  metrics,
  muted,
  onSelectGear,
  onToggleMute,
  onPause,
  onOpenGdd,
}) => {
  const hpPct = Math.round((metrics.hp / Math.max(1, metrics.maxHp)) * 100);
  const o2Pct = Math.round((metrics.oxygen / Math.max(1, metrics.maxOxygen)) * 100);
  const pwrPct = Math.round((metrics.suitPower / Math.max(1, metrics.maxSuitPower)) * 100);
  const lowO2 = metrics.oxygen <= 25;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
      {/* Subtle critical vignette when HP or O2 is low */}
      {(metrics.hp <= 30 || lowO2) && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(225, 29, 72, 0.35)',
          }}
        />
      )}

      {/* Top Perimeter Clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Iara Survival Telemetry */}
        <div className="bg-[#090e18]/90 border border-[#243247] px-4 py-3 rounded-sm min-w-[238px]">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path
                  d="M12 3l7 4v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V7l7-4z"
                  fill="#1e293b"
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
                <path d="M12 7v8M8 11h8" stroke="#fda4af" strokeWidth="2" />
              </svg>
              <span className="text-[11px] uppercase tracking-widest text-[#94a3b8]">Suit Hull</span>
            </div>
            <span className="font-mono-num font-bold text-lg text-[#f8fafc] hud-stroke">
              {Math.round(metrics.hp)}
            </span>
          </div>
          <div className="h-1.5 bg-[#162032] mb-2.5 overflow-hidden">
            <div
              className="h-full bg-[#f43f5e] transition-all duration-150"
              style={{ width: `${hpPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#94a3b8]">O₂ Sec</span>
                <span className={`font-mono-num font-bold ${lowO2 ? 'text-[#fb7185]' : 'text-[#38bdf8]'}`}>
                  {Math.round(metrics.oxygen)}s
                </span>
              </div>
              <div className="h-1 bg-[#162032]">
                <div className="h-full bg-[#38bdf8]" style={{ width: `${o2Pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#94a3b8]">Suit Pwr</span>
                <span className="font-mono-num font-bold text-[#fbbf24]">
                  {Math.round(metrics.suitPower)}
                </span>
              </div>
              <div className="h-1 bg-[#162032]">
                <div className="h-full bg-[#f59e0b]" style={{ width: `${pwrPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right: Mission Quota + Square Utility Icons */}
        <div className="flex items-start gap-2.5">
          <div className="bg-[#090e18]/90 border border-[#243247] px-4 py-2.5 rounded-sm text-right">
            <div className="flex items-center justify-end gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#94a3b8]">Evacuees</div>
                <div className="font-mono-num font-bold text-xl text-[#fbbf24] hud-stroke">
                  {metrics.evacueesRescued}/{metrics.evacueesTarget}
                </div>
              </div>
              <div className="h-8 w-px bg-[#243247]" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#94a3b8]">Window</div>
                <div className="font-mono-num font-bold text-xl text-[#e2e8f0] hud-stroke">
                  {Math.round(metrics.timeRemaining)}s
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-1 text-[11px] font-mono-num text-[#cbd5e1]">
              <span>Cells +{metrics.powerCellsCollected}</span>
              <span>Meds +{metrics.medkitsCollected}</span>
              {metrics.conduitsTotal > 0 && (
                <span className="text-[#34d399]">
                  Gate {metrics.conduitsStabilized}/{metrics.conduitsTotal}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Mission"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-9 h-9 flex items-center justify-center bg-[#090e18]/90 hover:bg-[#172136] border border-[#2b3b54] text-[#e2e8f0] rounded-sm cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-9 h-9 flex items-center justify-center bg-[#090e18]/90 hover:bg-[#172136] border border-[#2b3b54] text-[#e2e8f0] rounded-sm cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-[#f87171]" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Open Game Design Document"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenGdd();
              }}
              className="w-9 h-9 flex items-center justify-center bg-[#090e18]/90 hover:bg-[#172136] border border-[#2b3b54] text-[#38bdf8] rounded-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Perimeter: Context Prompt + 3 Equipment Slots */}
      <div className="flex flex-col items-center gap-2.5">
        {metrics.statusBanner && (
          <div className="bg-[#090e18]/92 border border-[#d98a38]/70 px-4 py-1.5 text-xs font-medium text-[#fde68a] rounded-sm">
            {metrics.statusBanner}
          </div>
        )}

        {metrics.interactPrompt && (
          <div className="bg-[#0b1322]/95 border border-[#38bdf8] px-4 py-2 text-sm font-display font-bold tracking-wide text-[#e0f2fe] rounded-sm">
            {metrics.interactPrompt}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
          {(
            [
              { id: 'pulse_carbine', key: '1', name: 'Pulse Carbine', clue: 'Breaks Shields' },
              { id: 'stasis_projector', key: '2', name: 'Stasis Projector', clue: 'Freezes Enemies' },
              { id: 'kinetic_shield', key: '3', name: 'Kinetic Shield', clue: 'Covers Evacuees' },
            ] as const
          ).map((slot) => {
            const active = metrics.activeGear === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectGear(slot.id);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2 border rounded-sm text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#122038] border-[#d98a38] text-[#f8fafc]'
                    : 'bg-[#090e18]/90 border-[#243247] text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                <span className="font-mono-num font-bold text-xs px-1.5 py-0.5 bg-[#1b273b] text-[#fbbf24]">
                  {slot.key}
                </span>
                <div>
                  <div className="font-display font-bold text-xs uppercase tracking-wider">
                    {slot.name}
                  </div>
                  <div className="text-[10px] text-[#94a3b8]">{slot.clue}</div>
                </div>
              </button>
            );
          })}

          <div className="bg-[#090e18]/90 border border-[#243247] px-3 py-2 rounded-sm text-xs font-mono-num text-[#cbd5e1]">
            {metrics.crouching ? 'STEALTH [C]: ON' : 'STEALTH [C]: OFF'}
          </div>
        </div>
      </div>
    </div>
  );
};
