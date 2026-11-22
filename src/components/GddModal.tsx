import React, { useState } from 'react';
import { X } from 'lucide-react';
import { GDD_DATA } from '../game/gddData';

interface GddModalProps {
  onClose: () => void;
}

type GddTab = 'overview' | 'factions' | 'missions' | 'demo';

export const GddModal: React.FC<GddModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<GddTab>('overview');

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8 bg-[#04070e]/88"
      role="dialog"
      aria-modal="true"
      aria-label="Game Design Document"
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-[#0a101c] border border-[#2f415e] rounded-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2c42]">
          <div>
            <div className="text-[11px] font-mono-num uppercase tracking-widest text-[#d98a38]">
              CREATIVE DIRECTION &amp; SYSTEMS SPECIFICATION
            </div>
            <h2 className="font-display font-bold text-xl text-[#f8fafc]">
              {GDD_DATA.title} — Game Design Document
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Game Design Document"
            className="w-9 h-9 flex items-center justify-center bg-[#141f33] hover:bg-[#1f2f4d] border border-[#2f415e] text-[#e2e8f0] rounded-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 px-6 pt-3 border-b border-[#1f2c42] bg-[#080d17]">
          {(
            [
              { id: 'overview', label: 'Premise & Core Loop' },
              { id: 'factions', label: 'Faction & Companion Table' },
              { id: 'missions', label: 'Three Acts & Wardrobe' },
              { id: 'demo', label: '25-Min Playable Demo' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                tab === t.id
                  ? 'border-[#d98a38] text-[#fbbf24] bg-[#0e1625]'
                  : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body (55-75ch readable editorial width) */}
        <div className="p-6 overflow-y-auto gdd-scroll space-y-6 text-sm text-[#cbd5e1] leading-relaxed">
          {tab === 'overview' && (
            <div className="max-w-[70ch] space-y-5">
              <div>
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-[#38bdf8] mb-1.5">
                  High-Concept Premise
                </h3>
                <p>{GDD_DATA.premise}</p>
                <div className="mt-2 text-xs font-mono-num text-[#94a3b8]">
                  Genre: {GDD_DATA.genre}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-[#38bdf8] mb-2">
                  Core Gameplay Loop
                </h3>
                <div className="space-y-3">
                  {GDD_DATA.coreLoop.map((item) => (
                    <div
                      key={item.step}
                      className="bg-[#0e1625] border border-[#23324a] p-3.5 rounded-sm"
                    >
                      <div className="font-display font-bold text-sm text-[#fbbf24] mb-1">
                        {item.step}
                      </div>
                      <p className="text-xs text-[#cbd5e1]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'factions' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-[#38bdf8] mb-2">
                  Star Kingdoms &amp; Political Actors
                </h3>
                <div className="overflow-x-auto border border-[#24334a]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0e1625] text-[#fbbf24] font-display uppercase">
                      <tr>
                        <th className="p-3 border-b border-[#24334a]">Faction</th>
                        <th className="p-3 border-b border-[#24334a]">Interest</th>
                        <th className="p-3 border-b border-[#24334a]">Offered Asset</th>
                        <th className="p-3 border-b border-[#24334a]">Demand</th>
                        <th className="p-3 border-b border-[#24334a]">World Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b273b]">
                      {GDD_DATA.factions.map((f) => (
                        <tr key={f.name} className="bg-[#0a101c]">
                          <td className="p-3 font-bold text-[#f8fafc] whitespace-nowrap">
                            {f.name}
                          </td>
                          <td className="p-3">{f.interest}</td>
                          <td className="p-3 text-[#34d399]">{f.offeredAsset}</td>
                          <td className="p-3 text-[#fde68a]">{f.demand}</td>
                          <td className="p-3">{f.worldChange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-[#38bdf8] mb-2">
                  Refuge Companions &amp; Departure Triggers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {GDD_DATA.companions.map((c) => (
                    <div
                      key={c.name}
                      className="bg-[#0e1625] border border-[#23324a] p-3.5 rounded-sm"
                    >
                      <div className="font-display font-bold text-xs text-[#fbbf24] mb-1">
                        {c.name}
                      </div>
                      <p className="text-xs text-[#cbd5e1]">{c.arc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'missions' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-[#38bdf8] mb-2">
                  Three-Act Campaign &amp; Branching Consequences
                </h3>
                <div className="space-y-3">
                  {GDD_DATA.missions.map((m) => (
                    <div
                      key={m.title}
                      className="bg-[#0e1625] border border-[#23324a] p-4 rounded-sm"
                    >
                      <div className="text-[11px] font-mono-num text-[#d98a38]">{m.act}</div>
                      <div className="font-display font-bold text-base text-[#f8fafc] mb-1">
                        {m.title} — <span className="text-xs font-normal text-[#94a3b8]">{m.setting}</span>
                      </div>
                      <p className="text-xs mb-2">{m.mechanics}</p>
                      <ul className="list-disc list-inside text-xs text-[#fde68a] space-y-0.5">
                        {m.branches.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-[#38bdf8] mb-2">
                  Wardrobe Progression &amp; Cutscene Insignia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {GDD_DATA.wardrobe.map((w) => (
                    <div
                      key={w.outfit}
                      className="bg-[#0e1625] border border-[#23324a] p-3.5 rounded-sm"
                    >
                      <div className="font-display font-bold text-xs text-[#f8fafc] mb-1">
                        {w.outfit}
                      </div>
                      <p className="text-[11px] text-[#94a3b8] mb-1.5">{w.role}</p>
                      <p className="text-xs text-[#34d399]">{w.effect}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'demo' && (
            <div className="max-w-[70ch] space-y-4">
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-[#38bdf8]">
                25-Minute Playable Vertical Slice Architecture
              </h3>
              <p className="text-xs text-[#94a3b8]">
                This interactive build executes the full linked vertical slice: Ember’s Final Hour
                expedition → Orbital Refuge power allocation &amp; outfit swap → Suspended Assembly
                negotiation → Visible world return.
              </p>
              <div className="space-y-3">
                {GDD_DATA.demo25Min.map((beat) => (
                  <div
                    key={beat.timestamp}
                    className="bg-[#0e1625] border border-[#23324a] p-4 rounded-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-sm text-[#f8fafc]">
                        {beat.phase}
                      </span>
                      <span className="font-mono-num text-xs text-[#d98a38]">{beat.timestamp}</span>
                    </div>
                    <p className="text-xs mb-1.5">{beat.summary}</p>
                    <div className="text-[11px] text-[#34d399]">
                      Consequence: {beat.linkedConsequence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
