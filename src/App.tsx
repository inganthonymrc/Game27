/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AssemblyHallOverlay } from './components/AssemblyHallOverlay';
import { EndingModal } from './components/EndingModal';
import { ExpeditionHUD } from './components/ExpeditionHUD';
import { GddModal } from './components/GddModal';
import { PauseGameOverModal } from './components/PauseGameOverModal';
import { RefugeHubOverlay } from './components/RefugeHubOverlay';
import { RiskBriefingModal } from './components/RiskBriefingModal';
import { TitleScreen } from './components/TitleScreen';
import { OrbitalEngine } from './game/OrbitalEngine';
import { soundEngine } from './game/audio';
import {
  applyRefugeAllocation,
  createInitialCampaignState,
  holdAssemblyVote,
  resolveExpeditionOutcome,
  toggleTreatyProposal,
} from './game/rules';
import type {
  CampaignState,
  ExpeditionMetrics,
  GameScreenState,
  GearId,
  InsigniaId,
  KingdomId,
  OutfitId,
  RefugeAllocation,
  RiskChoiceId,
  SpecializationId,
} from './game/types';

const INITIAL_METRICS: ExpeditionMetrics = {
  hp: 100,
  maxHp: 100,
  oxygen: 145,
  maxOxygen: 145,
  suitPower: 100,
  maxSuitPower: 100,
  powerCellsCollected: 0,
  medkitsCollected: 0,
  evacueesRescued: 0,
  evacueesTarget: 90,
  evacueesLost: 0,
  conduitsStabilized: 0,
  conduitsTotal: 0,
  enemiesDefeated: 0,
  enemiesStasised: 0,
  stealthBypassed: 0,
  dialogueResolved: 0,
  activeGear: 'pulse_carbine',
  shieldActive: false,
  crouching: false,
  timeRemaining: 120,
  interactPrompt: null,
  statusBanner: null,
  outcome: 'ongoing',
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<OrbitalEngine | null>(null);

  const [screenState, setScreenState] = useState<GameScreenState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });

  const [campaign, setCampaign] = useState<CampaignState>(() => createInitialCampaignState());
  const [metrics, setMetrics] = useState<ExpeditionMetrics>(INITIAL_METRICS);
  const [muted, setMuted] = useState(false);
  const [showGdd, setShowGdd] = useState(false);
  const [shieldBonusCells, setShieldBonusCells] = useState(0);

  const campaignRef = useRef(campaign);
  campaignRef.current = campaign;
  const screenStateRef = useRef(screenState);
  screenStateRef.current = screenState;

  // Mirror state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = screenState;
  }, [screenState]);

  const handleExpeditionEnd = useCallback((finalMetrics: ExpeditionMetrics) => {
    if (finalMetrics.outcome === 'defeated' || finalMetrics.outcome === 'oxygen_out') {
      soundEngine.playPlayerHurt();
      setMetrics(finalMetrics);
      setScreenState('gameover');
      engineRef.current?.setPaused(true);
      return;
    }

    soundEngine.playRescue();
    const cur = campaignRef.current;
    const risk: RiskChoiceId = cur.riskChoice ?? 'moderate_throne';
    const nextCampaign = resolveExpeditionOutcome(cur, risk, finalMetrics);
    setCampaign(nextCampaign);
    engineRef.current?.showRefugeScene(nextCampaign);
  }, []);

  // Mount Three.js engine once
  useEffect(() => {
    if (!mountRef.current) return;
    const engine = new OrbitalEngine(mountRef.current, {
      onMetricsUpdate: (m) => setMetrics(m),
      onExpeditionEnd: handleExpeditionEnd,
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleExpeditionEnd]);

  const handleStartFromTitle = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const fresh = createInitialCampaignState();
    setCampaign(fresh);
    setShieldBonusCells(0);
    setScreenState('playing');
    engineRef.current?.setMode('title');
  }, []);

  const handleCommitRisk = useCallback(
    (risk: RiskChoiceId) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const next: CampaignState = {
        ...campaignRef.current,
        riskChoice: risk,
        phase: 'expedition',
      };
      setCampaign(next);
      setScreenState('playing');
      engineRef.current?.startExpedition(
        risk,
        next.specialization,
        next.outfit,
        next.insignia,
        next.outfitRepaired,
        shieldBonusCells
      );
    },
    [shieldBonusCells]
  );

  const handleUpdateWardrobe = useCallback(
    (outfit: OutfitId, insignia: InsigniaId, specialization: SpecializationId) => {
      const next: CampaignState = {
        ...campaignRef.current,
        outfit,
        insignia,
        specialization,
      };
      setCampaign(next);
      engineRef.current?.showRefugeScene(next);
    },
    []
  );

  const handleConfirmAllocation = useCallback((alloc: RefugeAllocation) => {
    setShieldBonusCells(alloc.shieldReserveAllocated);
    const next = applyRefugeAllocation(campaignRef.current, alloc);
    setCampaign(next);
    engineRef.current?.showRefugeScene(next);
  }, []);

  const handleTreatyAction = useCallback(
    (kingdomId: KingdomId, action: 'propose' | 'withdraw' | 'guarantee') => {
      const next = toggleTreatyProposal(campaignRef.current, kingdomId, action);
      setCampaign(next);
    },
    []
  );

  const handleHoldVote = useCallback(() => {
    const next = holdAssemblyVote(campaignRef.current);
    soundEngine.playVoteChord(next.assemblyRatified);
    setCampaign(next);
    engineRef.current?.showRefugeScene(next);
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handlePause = useCallback(() => {
    if (screenStateRef.current !== 'playing' || campaignRef.current.phase !== 'expedition') return;
    setScreenState('paused');
    engineRef.current?.setPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setScreenState('playing');
    engineRef.current?.setPaused(false);
  }, []);

  const handleRestartExpedition = useCallback(() => {
    const cur = campaignRef.current;
    const risk = cur.riskChoice ?? 'moderate_throne';
    setScreenState('playing');
    setCampaign({ ...cur, phase: 'expedition' });
    engineRef.current?.startExpedition(
      risk,
      cur.specialization,
      cur.outfit,
      cur.insignia,
      cur.outfitRepaired,
      shieldBonusCells
    );
  }, [shieldBonusCells]);

  const handleReturnTitle = useCallback(() => {
    const fresh = createInitialCampaignState();
    setCampaign(fresh);
    setScreenState('title');
    engineRef.current?.setPaused(false);
    engineRef.current?.setMode('title');
  }, []);

  const handleSelectGear = useCallback((gear: GearId) => {
    engineRef.current?.selectGear(gear);
  }, []);

  // Global keyboard shortcuts (Title Enter/Space, Pause Esc/P, Mute M)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showGdd) {
        if (e.code === 'Escape') setShowGdd(false);
        return;
      }

      if (screenStateRef.current === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartFromTitle();
        }
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (screenStateRef.current === 'playing' && campaignRef.current.phase === 'expedition') {
          e.preventDefault();
          handlePause();
        } else if (screenStateRef.current === 'paused') {
          e.preventDefault();
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGdd, handleStartFromTitle, handleToggleMute, handlePause, handleResume]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070b12]">
      {/* Isolated WebGL Canvas Container */}
      <div
        ref={mountRef}
        data-testid="orbital-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

      {screenState === 'title' && (
        <TitleScreen
          onStart={handleStartFromTitle}
          onOpenGdd={() => setShowGdd(true)}
        />
      )}

      {screenState === 'playing' && campaign.phase === 'briefing' && (
        <RiskBriefingModal
          specialization={campaign.specialization}
          outfit={campaign.outfit}
          onChangeSpecialization={(specialization) =>
            setCampaign((prev) => ({ ...prev, specialization }))
          }
          onChangeOutfit={(outfit) => setCampaign((prev) => ({ ...prev, outfit }))}
          onCommitRisk={handleCommitRisk}
        />
      )}

      {screenState === 'playing' && campaign.phase === 'expedition' && (
        <ExpeditionHUD
          metrics={metrics}
          muted={muted}
          onSelectGear={handleSelectGear}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onOpenGdd={() => {
            handlePause();
            setShowGdd(true);
          }}
        />
      )}

      {screenState === 'playing' && campaign.phase === 'refuge' && (
        <RefugeHubOverlay
          campaign={campaign}
          onUpdateWardrobe={handleUpdateWardrobe}
          onConfirmAllocation={handleConfirmAllocation}
        />
      )}

      {screenState === 'playing' && campaign.phase === 'assembly' && (
        <AssemblyHallOverlay
          campaign={campaign}
          onTreatyAction={handleTreatyAction}
          onHoldVote={handleHoldVote}
        />
      )}

      {screenState === 'playing' && campaign.phase === 'ending' && (
        <EndingModal
          campaign={campaign}
          onReplay={handleStartFromTitle}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {(screenState === 'paused' || screenState === 'gameover') && (
        <PauseGameOverModal
          mode={screenState === 'gameover' ? 'defeat' : 'paused'}
          metrics={metrics}
          onResume={handleResume}
          onRestartExpedition={handleRestartExpedition}
          onReturnTitle={handleReturnTitle}
          onOpenGdd={() => setShowGdd(true)}
        />
      )}

      {showGdd && <GddModal onClose={() => setShowGdd(false)} />}
    </div>
  );
}
