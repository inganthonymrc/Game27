import React from 'react';
import { CheckCircle2, Crown, Scale, ShieldAlert } from 'lucide-react';
import { getInsigniaReception, getSuitStats } from '../game/rules';
import type { CampaignState, KingdomId } from '../game/types';

interface AssemblyHallOverlayProps {
  campaign: CampaignState;
  onTreatyAction: (kingdomId: KingdomId, action: 'propose' | 'withdraw' | 'guarantee') => void;
  onHoldVote: () => void;
}

export const AssemblyHallOverlay: React.FC<AssemblyHallOverlayProps> = ({
  campaign,
  onTreatyAction,
  onHoldVote,
}) => {
  const kingdomList = Object.values(campaign.kingdoms);
  const proposedCount = kingdomList.filter((k) => k.treatyProposed && !k.withdrawn).length;
  const suitStats = getSuitStats(campaign.outfit, campaign.specialization, campaign.insignia, 0);
  const loyalCount = Object.values(campaign.companions).filter(
    (c) => c.status !== 'departed'
  ).length;
  const projectedVotes = Math.max(
    0,
    Math.min(
      campaign.assemblySeatsTotal,
      4 +
        suitStats.voteBonus +
        loyalCount +
        (campaign.infirmaryPowered ? 1 : 0) -
        (campaign.imperialTruceActive ? 2 : 0) +
        (campaign.kingdoms.wandering_throne.treatyProposed ? 1 : 0)
    )
  );

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 md:p-8 bg-[#050810]/74 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#0a101c] border border-[#2c3c56] p-6 md:p-7 rounded-sm shadow-2xl">
        <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-6 border-b border-[#1e2c42] pb-4 mb-5">
          <div>
            <div className="text-[11px] font-mono-num uppercase tracking-widest text-[#38bdf8]">
              SUSPENDED SHIPYARD HALL · LIBERATED ASSEMBLY FLOOR
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[#f8fafc]">
              Coalition Treaties &amp; Jump-Gate Ratification
            </h1>
            <p className="text-xs md:text-sm text-[#cbd5e1] mt-1">
              To break the Zenith Jump-Gate blockade, ratify treaties with at least{' '}
              <strong className="text-[#fbbf24]">2 Star Kingdoms</strong> and secure{' '}
              <strong className="text-[#fbbf24]">≥ 7 / 12 Assembly Seats</strong>.
            </p>
          </div>

          <div className="bg-[#0f1728] border border-[#24334a] px-4 py-2.5 rounded-sm text-right shrink-0 whitespace-nowrap">
            <div className="text-[10px] font-mono-num uppercase text-[#94a3b8]">
              Projected Assembly Vote
            </div>
            <div className="font-mono-num font-bold text-xl text-[#fbbf24]">
              {projectedVotes} / {campaign.assemblySeatsTotal} Seats
            </div>
            <div className="text-[11px] text-[#cbd5e1]">
              {proposedCount}/2 Treaties Proposed · {campaign.outfit.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* 3 Kingdoms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {kingdomList.map((k) => {
            const rec = getInsigniaReception(k.id, campaign.outfit, campaign.insignia);
            const effTrust = Math.min(
              100,
              Math.max(
                0,
                k.trust + rec.trustDelta + (campaign.specialization === 'diplomacy' ? 10 : 0)
              )
            );
            return (
              <div
                key={k.id}
                className={`flex flex-col justify-between p-4 border rounded-sm ${
                  k.treatyProposed
                    ? 'bg-[#112036] border-[#38bdf8]'
                    : 'bg-[#0e1625] border-[#24334a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 font-display font-bold text-base text-[#f8fafc]">
                      <Crown className="w-4 h-4 text-[#d98a38]" />
                      {k.name}
                    </span>
                    <span className="font-mono-num text-xs font-bold text-[#38bdf8]">
                      {effTrust}% Trust
                    </span>
                  </div>

                  <div className="text-xs text-[#fde68a] mb-2">
                    <span className="font-semibold uppercase">Demand: </span>
                    {k.demand}
                  </div>
                  <div className="text-xs text-[#34d399] mb-3">
                    <span className="font-semibold uppercase">Boon: </span>
                    {k.boon}
                  </div>

                  <div className="bg-[#090e18] border border-[#1d2b40] p-2.5 text-[11px] text-[#cbd5e1] mb-3 leading-snug">
                    {k.treatyProposed ? k.receptionNote : rec.note}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {!k.guaranteeRequested && (
                    <button
                      type="button"
                      onClick={() => onTreatyAction(k.id, 'guarantee')}
                      className="w-full py-1.5 px-3 bg-[#152238] hover:bg-[#1c2d4a] border border-[#324869] text-xs font-medium text-[#e2e8f0] rounded-sm cursor-pointer"
                    >
                      Offer Oversight Guarantee (+12 Trust)
                    </button>
                  )}

                  {k.treatyProposed ? (
                    <button
                      type="button"
                      onClick={() => onTreatyAction(k.id, 'withdraw')}
                      className="w-full py-2 px-3 bg-[#1e293b] hover:bg-[#334155] text-xs font-display font-bold uppercase text-[#94a3b8] rounded-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                      Treaty Drafted (Click to Withdraw)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTreatyAction(k.id, 'propose')}
                      className="w-full py-2 px-3 bg-[#d98a38] hover:bg-[#e59b49] text-xs font-display font-bold uppercase text-[#070b12] rounded-sm cursor-pointer"
                    >
                      Draft Treaty for Vote
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Obligations & Warnings */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e1625] border border-[#24334a] p-3.5 rounded-sm mb-5 text-xs">
          <div className="flex items-center gap-2 text-[#cbd5e1]">
            {campaign.citizenshipVoteRequired ? (
              <>
                <ShieldAlert className="w-4 h-4 text-[#fbbf24]" />
                <span>
                  Outstanding Pledge: Bring <strong>Wandering Throne Citizenship</strong> to vote
                  or Tarek &amp; the Ark fleet will depart.
                </span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 text-[#38bdf8]" />
                <span>
                  Infirmary Status: {campaign.infirmaryPowered ? 'Powered' : 'Brownout'} ·{' '}
                  {campaign.imperialTruceActive ? 'Imperial Truce (-2 Assembly Votes)' : 'No Imperial Truce'}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onHoldVote}
            className="px-6 py-2.5 bg-[#38bdf8] hover:bg-[#56ccf9] text-[#070b12] font-display font-bold text-sm uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
          >
            Call Assembly Ratification Vote
          </button>
        </div>
      </div>
    </div>
  );
};
