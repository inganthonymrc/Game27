export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type CampaignPhase =
  | 'briefing'    // Ember's Final Hour risk selection before 3D drop
  | 'expedition'  // 3D third-person survival-action mission
  | 'refuge'      // 3D Orbital Refuge hub: wardrobe, power allocation, infirmary inspection
  | 'assembly'    // Diplomatic Hall: Kingdom treaties & Assembly vote
  | 'ending';     // Campaign outcome & visible world epilogue

export type SpecializationId = 'engineering' | 'protection' | 'diplomacy';

export type OutfitId = 'mining_uniform' | 'pressure_suit' | 'ceremonial_coat';

export type InsigniaId = 'miner_wrench' | 'tides_crest' | 'glass_lotus' | 'throne_compass';

export type GearId = 'pulse_carbine' | 'stasis_projector' | 'kinetic_shield';

export type RiskChoiceId = 'low_imperial' | 'moderate_throne' | 'high_gate';

export type KingdomId = 'crown_tides' | 'glass_kingdom' | 'wandering_throne';

export type CompanionId = 'kaelen' | 'sera' | 'tarek';

export interface CompanionState {
  id: CompanionId;
  name: string;
  role: string;
  loyalty: number; // 0 to 100
  status: 'loyal' | 'challenging' | 'departed';
  lastRemark: string;
}

export interface KingdomState {
  id: KingdomId;
  name: string;
  demand: string;
  boon: string;
  trust: number; // 0 to 100
  guaranteeRequested: boolean;
  treatyProposed: boolean;
  ratified: boolean;
  withdrawn: boolean;
  receptionNote: string;
}

export interface ExpeditionMetrics {
  hp: number;
  maxHp: number;
  oxygen: number;
  maxOxygen: number;
  suitPower: number;
  maxSuitPower: number;
  powerCellsCollected: number;
  medkitsCollected: number;
  evacueesRescued: number;
  evacueesTarget: number;
  evacueesLost: number;
  conduitsStabilized: number;
  conduitsTotal: number;
  enemiesDefeated: number;
  enemiesStasised: number;
  stealthBypassed: number;
  dialogueResolved: number;
  activeGear: GearId;
  shieldActive: boolean;
  crouching: boolean;
  timeRemaining: number;
  interactPrompt: string | null;
  statusBanner: string | null;
  outcome: 'ongoing' | 'extracted' | 'retreated' | 'oxygen_out' | 'defeated';
}

export interface RefugeAllocation {
  infirmaryPowerAllocated: number; // power cells assigned to infirmary
  shieldReserveAllocated: number;  // power cells assigned to suit kinetic reserve
  medkitsAssignedToInfirmary: number;
}

export interface CampaignState {
  act: 1 | 2 | 3;
  phase: CampaignPhase;
  specialization: SpecializationId;
  outfit: OutfitId;
  outfitRepaired: boolean;
  insignia: InsigniaId;
  riskChoice: RiskChoiceId | null;
  refugePowerReserve: number; // starts at 4, drained by High Risk gate
  powerCellsBank: number;
  medkitsBank: number;
  infirmaryPowered: boolean;
  infirmaryCapacity: number; // beds supported
  woundedWaiting: number;
  woundedSaved: number;
  totalSurvivorsAtRefuge: number;
  imperialTruceActive: boolean;
  citizenshipVoteRequired: boolean;
  citizenshipGranted: boolean;
  asylumGranted: boolean;
  tradePrivilegesGranted: boolean;
  gateControl: 'empire' | 'coalition_shared' | 'coalition_sovereign' | 'contested';
  assemblySeatsTotal: number;
  assemblySeatsInFavor: number;
  assemblyRatified: boolean;
  promisesKept: string[];
  promisesBroken: string[];
  companions: Record<CompanionId, CompanionState>;
  kingdoms: Record<KingdomId, KingdomState>;
  expeditionResult: ExpeditionMetrics | null;
  worldChanges: string[];
}

export interface RiskOptionSpec {
  id: RiskChoiceId;
  tierLabel: string;
  title: string;
  estimatedCapacity: number;
  timeLimitSeconds: number;
  obligation: string;
  resourceImpact: string;
  summary: string;
}

export interface EndingSummary {
  id: string;
  title: string;
  subtitle: string;
  gateController: string;
  representation: string;
  promisesSummary: string;
  epilogueLines: string[];
  score: number;
}
