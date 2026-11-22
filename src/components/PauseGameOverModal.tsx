import React from 'react';
import { BookOpen, Play, RotateCcw } from 'lucide-react';
import type { ExpeditionMetrics } from '../game/types';

interface PauseGameOverModalProps {
  mode: 'paused' | 'defeat';
  metrics: ExpeditionMetrics;
  onResume: () => void;
  onRestartExpedition: () => void;
  onReturnTitle: () => void;
  onOpenGdd: () => void;
}

export const PauseGameOverModal: React.FC<PauseGameOverModalProps> = ({
  mode,
  metrics,
  onResume,
  onRestartExpedition,
  onReturnTitle,
  onOpenGdd,
}) => {
  const isDefeat = mode === 'defeat';
  const defeatReason =
    metrics.outcome === 'oxygen_out'
      ? 'Vacuum Oxygen & Colony Window Exhausted'
      : 'EVA Suit Hull Breached Under Imperial Fire';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#050810]/82">
      <div className="w-full max-w-md bg-[#0a101c] border border-[#2d3e59] p-6 rounded-sm shadow-2xl">
        <div className="text-[11px] font-mono-num uppercase tracking-widest text-[#d98a38] mb-1">
          {isDefeat ? 'EXPEDITION FAILURE' : 'SIMULATION PAUSED'}
        </div>
        <h2 className="font-display font-bold text-2xl text-[#f8fafc] mb-1">
          {isDefeat ? 'Signal Lost on Ember Moon' : 'Tactical Hold'}
        </h2>
        <p className="text-xs text-[#94a3b8] mb-5">
          {isDefeat ? defeatReason : 'All telemetry suspended. Ready to resume operations.'}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[#0e1625] border border-[#223047] p-2.5">
            <div className="text-[10px] uppercase text-[#94a3b8]">Evacuated</div>
            <div className="font-mono-num font-bold text-base text-[#fbbf24]">
              {metrics.evacueesRescued}/{metrics.evacueesTarget}
            </div>
          </div>
          <div className="bg-[#0e1625] border border-[#223047] p-2.5">
            <div className="text-[10px] uppercase text-[#94a3b8]">Power Cells</div>
            <div className="font-mono-num font-bold text-base text-[#38bdf8]">
              +{metrics.powerCellsCollected}
            </div>
          </div>
          <div className="bg-[#0e1625] border border-[#223047] p-2.5">
            <div className="text-[10px] uppercase text-[#94a3b8]">O₂ Left</div>
            <div className="font-mono-num font-bold text-base text-[#e2e8f0]">
              {Math.round(metrics.oxygen)}s
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {!isDefeat && (
            <button
              type="button"
              onClick={onResume}
              className="w-full py-2.5 bg-[#d98a38] hover:bg-[#e59b49] text-[#070b12] font-display font-bold text-sm uppercase tracking-wider rounded-sm cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Mission
            </button>
          )}

          <button
            type="button"
            data-start={isDefeat ? 'true' : undefined}
            onClick={onRestartExpedition}
            className={`w-full py-2.5 font-display font-bold text-sm uppercase tracking-wider rounded-sm cursor-pointer inline-flex items-center justify-center gap-2 ${
              isDefeat
                ? 'bg-[#d98a38] hover:bg-[#e59b49] text-[#070b12]'
                : 'bg-[#152033] hover:bg-[#1e2e49] border border-[#2e405e] text-[#e2e8f0]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {isDefeat ? 'Retry Ember’s Final Hour' : 'Restart Expedition'}
          </button>

          <button
            type="button"
            onClick={onOpenGdd}
            className="w-full py-2.5 bg-[#0f1728] hover:bg-[#162238] border border-[#2a3b57] text-[#38bdf8] font-display font-semibold text-xs uppercase tracking-wider rounded-sm cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            View Game Design Document
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-2 text-xs text-[#94a3b8] hover:text-[#f8fafc] uppercase tracking-wider cursor-pointer"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
