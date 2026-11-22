import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RISK_OPTIONS,
  applyRefugeAllocation,
  createInitialCampaignState,
  evaluateEnding,
  getInsigniaReception,
  getSuitStats,
  holdAssemblyVote,
  resolveExpeditionOutcome,
  toggleTreatyProposal,
} from './rules';
import type { ExpeditionMetrics } from './types';

function makeMetrics(overrides: Partial<ExpeditionMetrics> = {}): ExpeditionMetrics {
  return {
    hp: 100,
    maxHp: 100,
    oxygen: 80,
    maxOxygen: 145,
    suitPower: 75,
    maxSuitPower: 100,
    powerCellsCollected: 3,
    medkitsCollected: 2,
    evacueesRescued: 40,
    evacueesTarget: 40,
    evacueesLost: 0,
    conduitsStabilized: 2,
    conduitsTotal: 2,
    enemiesDefeated: 4,
    enemiesStasised: 2,
    stealthBypassed: 1,
    dialogueResolved: 0,
    activeGear: 'pulse_carbine',
    shieldActive: false,
    crouching: false,
    timeRemaining: 42,
    interactPrompt: null,
    statusBanner: null,
    outcome: 'extracted',
    ...overrides,
  };
}

test('Ember Final Hour risk capacities match design thresholds', () => {
  assert.equal(RISK_OPTIONS.low_imperial.estimatedCapacity, 40);
  assert.equal(RISK_OPTIONS.moderate_throne.estimatedCapacity, 90);
  assert.equal(RISK_OPTIONS.high_gate.estimatedCapacity, 120);
});

test('Wardrobe pressure suit extends oxygen and ceremonial coat + diplomacy boosts votes', () => {
  const eva = getSuitStats('pressure_suit', 'engineering', 'miner_wrench', 1);
  const coat = getSuitStats('ceremonial_coat', 'diplomacy', 'throne_compass', 0);

  assert.equal(eva.maxOxygen, 145);
  assert.equal(eva.maxSuitPower, 145); // 100 + 25 + 20 engineering
  assert.equal(coat.maxOxygen, 90);
  assert.equal(coat.voteBonus, 4); // +2 diplomacy +2 ceremonial coat
});

test('High risk gate drains emergency reserve and failing infirmary allocation causes companion penalty', () => {
  const initial = createInitialCampaignState();
  const postExp = resolveExpeditionOutcome(
    initial,
    'high_gate',
    makeMetrics({ evacueesRescued: 120, evacueesTarget: 120, conduitsStabilized: 2, powerCellsCollected: 1 })
  );

  assert.equal(postExp.refugePowerReserve, 1); // 4 - 3
  assert.equal(postExp.totalSurvivorsAtRefuge, 184); // 64 + 120

  // Starve infirmary (allocate 0 to infirmary, 2 to shield)
  const starved = applyRefugeAllocation(postExp, {
    infirmaryPowerAllocated: 0,
    shieldReserveAllocated: 2,
    medkitsAssignedToInfirmary: 1,
  });

  assert.equal(starved.infirmaryPowered, false);
  assert.ok(starved.companions.sera.loyalty < postExp.companions.sera.loyalty);
  assert.ok(starved.promisesBroken.includes('Failed to restore power to Refuge Infirmary'));
});

test('Insignia reception boosts corresponding Kingdom trust', () => {
  const tides = getInsigniaReception('crown_tides', 'ceremonial_coat', 'tides_crest');
  const glass = getInsigniaReception('glass_kingdom', 'ceremonial_coat', 'glass_lotus');
  const throne = getInsigniaReception('wandering_throne', 'ceremonial_coat', 'throne_compass');

  assert.equal(tides.trustDelta, 14);
  assert.equal(glass.trustDelta, 15);
  assert.equal(throne.trustDelta, 15);
});

test('Coalition requires 2 kingdoms and Assembly ratification for sovereign jump gate control', () => {
  let state = createInitialCampaignState();
  state.specialization = 'diplomacy';
  state.outfit = 'ceremonial_coat';
  state.insignia = 'throne_compass';

  state = resolveExpeditionOutcome(
    state,
    'moderate_throne',
    makeMetrics({ evacueesRescued: 90, evacueesTarget: 90, dialogueResolved: 1 })
  );

  state = applyRefugeAllocation(state, {
    infirmaryPowerAllocated: 2,
    shieldReserveAllocated: 1,
    medkitsAssignedToInfirmary: 2,
  });

  state = toggleTreatyProposal(state, 'wandering_throne', 'propose');
  state = toggleTreatyProposal(state, 'glass_kingdom', 'propose');
  state = holdAssemblyVote(state);

  assert.equal(state.assemblyRatified, true);
  assert.equal(state.citizenshipGranted, true);
  assert.equal(state.asylumGranted, true);
  assert.equal(state.gateControl, 'coalition_sovereign');

  const ending = evaluateEnding(state);
  assert.equal(ending.id, 'dawn_of_the_free_gates');
  assert.ok(ending.score > 1500);
});

test('Breaking Wandering Throne citizenship pledge causes Tarek to depart', () => {
  let state = createInitialCampaignState();
  state = resolveExpeditionOutcome(
    state,
    'moderate_throne',
    makeMetrics({ evacueesRescued: 90, evacueesTarget: 90 })
  );
  state = applyRefugeAllocation(state, {
    infirmaryPowerAllocated: 2,
    shieldReserveAllocated: 0,
    medkitsAssignedToInfirmary: 1,
  });

  // Propose Tides & Glass instead of Wandering Throne
  state = toggleTreatyProposal(state, 'crown_tides', 'guarantee');
  state = toggleTreatyProposal(state, 'crown_tides', 'propose');
  state = toggleTreatyProposal(state, 'glass_kingdom', 'propose');
  state = holdAssemblyVote(state);

  assert.equal(state.kingdoms.wandering_throne.withdrawn, true);
  assert.equal(state.companions.tarek.status, 'departed');
  assert.ok(
    state.promisesBroken.includes('Failed to pass promised citizenship vote for Wandering Throne')
  );
});
