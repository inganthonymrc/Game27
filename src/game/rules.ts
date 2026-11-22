import type {
  CampaignState,
  CompanionId,
  EndingSummary,
  ExpeditionMetrics,
  InsigniaId,
  KingdomId,
  OutfitId,
  RefugeAllocation,
  RiskChoiceId,
  RiskOptionSpec,
  SpecializationId,
} from './types';

export const RISK_OPTIONS: Record<RiskChoiceId, RiskOptionSpec> = {
  low_imperial: {
    id: 'low_imperial',
    tierLabel: 'LOW RISK',
    title: 'Imperial Evacuation Corridor',
    estimatedCapacity: 40,
    timeLimitSeconds: 110,
    obligation:
      'Temporary truce bars the coalition from returning to Ember sector for 1 full cycle.',
    resourceImpact: 'Preserves Refuge emergency power; leaves 80 colonists stranded.',
    summary:
      'Accept a Zenith harbor-master corridor for 40 guaranteed berths. Kaelen opposes bowing to Imperial permits.',
  },
  moderate_throne: {
    id: 'moderate_throne',
    tierLabel: 'MODERATE RISK',
    title: 'Wandering Throne Ark-Ships',
    estimatedCapacity: 90,
    timeLimitSeconds: 120,
    obligation:
      'Must bring full citizenship for displaced people to an Assembly vote before life support fails.',
    resourceImpact: 'Moderate suit drain; strains Assembly faction balance.',
    summary:
      'Charter fleet berths for 90 colonists by pledging citizenship rights in the Liberated Assembly.',
  },
  high_gate: {
    id: 'high_gate',
    tierLabel: 'HIGH RISK',
    title: 'Experimental Jump Gate Override',
    estimatedCapacity: 120,
    timeLimitSeconds: 130,
    obligation:
      'Drains the Refuge emergency power reserve (-3 cells). Unstabilized conduits strand part of the convoy.',
    resourceImpact: 'Severe Refuge infirmary blackout risk unless you scavenge extra Power Cells.',
    summary:
      'Force open the sealed Ember jump gate to rescue all 120 colonists under heavy Imperial fire.',
  },
};

export function getSuitStats(
  outfit: OutfitId,
  specialization: SpecializationId,
  insignia: InsigniaId,
  shieldReserveAllocated: number
) {
  const baseHp = specialization === 'protection' ? 130 : 100;
  const baseOxygen = outfit === 'pressure_suit' ? 145 : outfit === 'mining_uniform' ? 100 : 90;
  const basePower = 100 + shieldReserveAllocated * 25 + (specialization === 'engineering' ? 20 : 0);
  const shieldDrainMultiplier = specialization === 'protection' ? 0.65 : 1.0;
  const voteBonus =
    (specialization === 'diplomacy' ? 2 : 0) + (outfit === 'ceremonial_coat' ? 2 : 0);

  return {
    maxHp: baseHp,
    maxOxygen: baseOxygen,
    maxSuitPower: basePower,
    shieldDrainMultiplier,
    voteBonus,
    insignia,
  };
}

export function createInitialCampaignState(): CampaignState {
  return {
    act: 2,
    phase: 'briefing',
    specialization: 'engineering',
    outfit: 'pressure_suit',
    outfitRepaired: true,
    insignia: 'miner_wrench',
    riskChoice: null,
    refugePowerReserve: 4,
    powerCellsBank: 2,
    medkitsBank: 2,
    infirmaryPowered: false,
    infirmaryCapacity: 24,
    woundedWaiting: 32,
    woundedSaved: 0,
    totalSurvivorsAtRefuge: 64,
    imperialTruceActive: false,
    citizenshipVoteRequired: false,
    citizenshipGranted: false,
    asylumGranted: false,
    tradePrivilegesGranted: false,
    gateControl: 'empire',
    assemblySeatsTotal: 12,
    assemblySeatsInFavor: 5,
    assemblyRatified: false,
    promisesKept: [],
    promisesBroken: [],
    companions: {
      kaelen: {
        id: 'kaelen',
        name: 'Kaelen Orlov',
        role: 'Dockhand Organizer',
        loyalty: 74,
        status: 'loyal',
        lastRemark: 'We survived Shatter-Shaft Nine together. Do not sell out our miners for Imperial ink.',
      },
      sera: {
        id: 'sera',
        name: 'Dr. Sera Vance',
        role: 'Exiled Bio-Engineer',
        loyalty: 72,
        status: 'loyal',
        lastRemark: 'The freighter infirmary needs steady power cells—every cold bay costs lives.',
      },
      tarek: {
        id: 'tarek',
        name: 'Tarek Sollis',
        role: 'Jump-Gate Navigator',
        loyalty: 70,
        status: 'loyal',
        lastRemark: 'Break the Zenith gate monopoly, and no moon will ever be starved by permits again.',
      },
    },
    kingdoms: {
      crown_tides: {
        id: 'crown_tides',
        name: 'The Crown of the Tides',
        demand: 'Grant orbital port trade privileges & tariff exemptions.',
        boon: 'Opens moon-carved deep ports and convoy supply routes (+2 Power Cells, +18 supplies).',
        trust: 50,
        guaranteeRequested: false,
        treatyProposed: false,
        ratified: false,
        withdrawn: false,
        receptionNote: 'Tide envoys watch how delegates balance harbor debt against free commerce.',
      },
      glass_kingdom: {
        id: 'glass_kingdom',
        name: 'The Glass Kingdom',
        demand: 'Grant permanent orbital asylum to Glass Kingdom political dissidents.',
        boon: 'Deploys cryo-medical suites (+45 Infirmary Capacity, stabilizes all critical wounded).',
        trust: 54,
        guaranteeRequested: false,
        treatyProposed: false,
        ratified: false,
        withdrawn: false,
        receptionNote: 'Glass scholars respect protective rigor and distrust Imperial truces.',
      },
      wandering_throne: {
        id: 'wandering_throne',
        name: 'The Wandering Throne',
        demand: 'Pass Assembly citizenship for all displaced orbital fleets.',
        boon: 'Commits Ark-Class evacuation cruisers (+90 survivor berths & coalition escort hulls).',
        trust: 52,
        guaranteeRequested: false,
        treatyProposed: false,
        ratified: false,
        withdrawn: false,
        receptionNote: 'Fleet captains look for the Throne Compass or proof of shared citizenship.',
      },
    },
    expeditionResult: null,
    worldChanges: [
      'Converted Freighter "Aegis Hull" established as the Orbital Refuge.',
    ],
  };
}

export function getInsigniaReception(
  kingdomId: KingdomId,
  outfit: OutfitId,
  insignia: InsigniaId
): { trustDelta: number; note: string } {
  if (outfit !== 'ceremonial_coat') {
    if (outfit === 'pressure_suit') {
      return {
        trustDelta: 0,
        note: 'Delegates note your EVA suit—practical for salvage, unpolished for high treaty chamber protocol.',
      };
    }
    return {
      trustDelta: kingdomId === 'wandering_throne' ? 4 : -4,
      note: 'Your patched mining uniform commands dockworker solidarity, though royal envoys bristle at grease-stained cuffs.',
    };
  }

  switch (kingdomId) {
    case 'crown_tides':
      if (insignia === 'tides_crest') {
        return { trustDelta: 14, note: 'Tides Crest on your coat opens immediate harbor reciprocity (+14 Trust).' };
      }
      if (insignia === 'miner_wrench') {
        return { trustDelta: 4, note: 'Miner’s Wrench signals labor autonomy; Tides merchants ask for clear tariff clauses.' };
      }
      return { trustDelta: 6, note: 'Ceremonial Delegate Coat earns formal naval salute.' };

    case 'glass_kingdom':
      if (insignia === 'glass_lotus') {
        return { trustDelta: 15, note: 'Glass Lotus insignia moves the exiled clinicians immediately (+15 Trust).' };
      }
      if (insignia === 'tides_crest') {
        return { trustDelta: -4, note: 'Glass dissidents eye the Tides Crest warily over past extradition rumors.' };
      }
      return { trustDelta: 7, note: 'Ceremonial Coat conveys legitimate Assembly authority.' };

    case 'wandering_throne':
      if (insignia === 'throne_compass') {
        return { trustDelta: 15, note: 'Throne Compass crest marks you as kin to the wandering fleets (+15 Trust).' };
      }
      if (insignia === 'miner_wrench') {
        return { trustDelta: 10, note: 'Miner’s Wrench resonates with displaced hull-workers (+10 Trust).' };
      }
      return { trustDelta: 6, note: 'Ceremonial Coat grants floor priority with Ark Captains.' };
  }
}

export function applyCompanionDelta(
  companion: CampaignState['companions'][CompanionId],
  delta: number,
  remark: string
): CampaignState['companions'][CompanionId] {
  const nextLoyalty = Math.max(0, Math.min(100, companion.loyalty + delta));
  const status: CampaignState['companions'][CompanionId]['status'] =
    nextLoyalty <= 25 ? 'departed' : nextLoyalty <= 48 ? 'challenging' : 'loyal';
  return {
    ...companion,
    loyalty: nextLoyalty,
    status,
    lastRemark: remark,
  };
}

export function resolveExpeditionOutcome(
  prev: CampaignState,
  risk: RiskChoiceId,
  metrics: ExpeditionMetrics
): CampaignState {
  const next: CampaignState = structuredClone(prev);
  next.riskChoice = risk;
  next.expeditionResult = metrics;
  next.powerCellsBank += metrics.powerCellsCollected;
  next.medkitsBank += metrics.medkitsCollected;

  const rescued = metrics.evacueesRescued;
  next.totalSurvivorsAtRefuge += rescued;

  if (risk === 'low_imperial') {
    next.imperialTruceActive = true;
    next.woundedWaiting += 14;
    next.promisesKept.push('Honored Imperial Corridor ceasefire terms');
    next.worldChanges.push('Imperial blockade truce active for 1 cycle (+40 evacuees, 80 left behind).');
    next.companions.kaelen = applyCompanionDelta(
      next.companions.kaelen,
      -26,
      'You signed a ceasefire with the wardens while eighty miners choked behind the bulkhead!'
    );
    next.kingdoms.glass_kingdom.trust = Math.max(0, next.kingdoms.glass_kingdom.trust - 12);
    next.kingdoms.wandering_throne.trust = Math.max(0, next.kingdoms.wandering_throne.trust - 6);
  } else if (risk === 'moderate_throne') {
    next.citizenshipVoteRequired = true;
    next.woundedWaiting += 22;
    next.worldChanges.push(
      `Wandering Throne ships carried ${rescued} evacuees; Citizenship Vote pledged to the Assembly.`
    );
    next.companions.tarek = applyCompanionDelta(
      next.companions.tarek,
      +10,
      'Ninety berths beat Imperial scraps—now keep your word when the Assembly votes on citizenship.'
    );
    next.kingdoms.wandering_throne.trust = Math.min(100, next.kingdoms.wandering_throne.trust + 14);
  } else if (risk === 'high_gate') {
    // Drains emergency power reserve
    next.refugePowerReserve = Math.max(0, next.refugePowerReserve - 3);
    const gateStable = metrics.conduitsStabilized >= metrics.conduitsTotal;
    if (gateStable) {
      next.woundedWaiting += 28;
      next.promisesKept.push('Stabilized Ember Experimental Gate without convoy loss');
      next.worldChanges.push(
        `Experimental Gate held! ${rescued} Ember colonists rescued; Refuge reserve drained (-3 cells).`
      );
      next.companions.kaelen = applyCompanionDelta(
        next.companions.kaelen,
        +15,
        'You risked the whole grid for every last soul on Ember. That is a delegate worth following.'
      );
    } else {
      const stranded = Math.max(12, 120 - rescued);
      next.woundedWaiting += 24;
      next.promisesBroken.push(`Experimental Gate destabilized (${stranded} convoy souls stranded)`);
      next.worldChanges.push(
        `Gate instability stranded ${stranded} colonists; Refuge emergency reserve exhausted.`
      );
      next.companions.tarek = applyCompanionDelta(
        next.companions.tarek,
        -20,
        'The gate sheared mid-transit! Part of the convoy is trapped between beacons because we rushed it.'
      );
    }
    if (next.refugePowerReserve <= 1) {
      next.companions.sera = applyCompanionDelta(
        next.companions.sera,
        -12,
        'Our emergency reserve is nearly flat—allocate scavenged cells to the Infirmary right now!'
      );
    }
  }

  if (metrics.dialogueResolved > 0) {
    next.worldChanges.push('Imperial dock lieutenant defected after your corridor negotiations.');
    next.assemblySeatsInFavor = Math.min(next.assemblySeatsTotal, next.assemblySeatsInFavor + 1);
  }

  next.phase = 'refuge';
  return next;
}

export function applyRefugeAllocation(
  prev: CampaignState,
  alloc: RefugeAllocation
): CampaignState {
  const next: CampaignState = structuredClone(prev);
  const totalCellsNeeded = alloc.infirmaryPowerAllocated + alloc.shieldReserveAllocated;
  const available = prev.powerCellsBank + prev.refugePowerReserve;

  if (totalCellsNeeded > available) {
    return next;
  }

  const medUsed = Math.min(prev.medkitsBank, alloc.medkitsAssignedToInfirmary);
  next.powerCellsBank = Math.max(0, available - totalCellsNeeded);
  next.refugePowerReserve = 0; // folded into operational pool
  next.medkitsBank -= medUsed;

  const infirmaryThreshold = prev.riskChoice === 'high_gate' ? 2 : 1;
  next.infirmaryPowered = alloc.infirmaryPowerAllocated >= infirmaryThreshold;

  const baseBeds = next.infirmaryPowered ? 24 + alloc.infirmaryPowerAllocated * 10 : 8;
  next.infirmaryCapacity = baseBeds;

  const treated = Math.min(
    next.woundedWaiting,
    (next.infirmaryPowered ? 18 : 6) + medUsed * 10 + alloc.infirmaryPowerAllocated * 4
  );
  next.woundedSaved += treated;
  next.woundedWaiting = Math.max(0, next.woundedWaiting - treated);

  if (next.infirmaryPowered) {
    next.companions.sera = applyCompanionDelta(
      next.companions.sera,
      +14,
      `Infirmary grids stabilized at ${next.infirmaryCapacity} beds—${treated} Ember wounded pulled out of shock.`
    );
    next.worldChanges.push(`Refuge Infirmary powered (${treated} wounded stabilized).`);
  } else {
    next.companions.sera = applyCompanionDelta(
      next.companions.sera,
      -28,
      'You starved the Infirmary to feed combat shields. Patients died in dark cryo-bays!'
    );
    next.promisesBroken.push('Failed to restore power to Refuge Infirmary');
    next.worldChanges.push('Refuge Infirmary suffered brownouts during triage.');
  }

  next.phase = 'assembly';
  return next;
}

export function toggleTreatyProposal(
  prev: CampaignState,
  kingdomId: KingdomId,
  action: 'propose' | 'withdraw' | 'guarantee'
): CampaignState {
  const next: CampaignState = structuredClone(prev);
  const k = next.kingdoms[kingdomId];
  if (!k || k.withdrawn) return next;

  const reception = getInsigniaReception(kingdomId, next.outfit, next.insignia);
  const effectiveTrust = k.trust + reception.trustDelta + (next.specialization === 'diplomacy' ? 10 : 0);

  if (action === 'guarantee') {
    if (!k.guaranteeRequested) {
      k.guaranteeRequested = true;
      k.trust = Math.min(100, k.trust + 12);
      k.receptionNote = 'Formal oversight guarantees eased delegate fears (+12 Trust).';
    }
    return next;
  }

  if (action === 'withdraw') {
    k.treatyProposed = false;
    return next;
  }

  if (effectiveTrust >= 48) {
    k.treatyProposed = true;
    k.receptionNote = reception.note;
  } else {
    k.receptionNote = 'Trust too low—equip Ceremonial Coat, adjust insignia, or request guarantees.';
  }

  // Rival kingdom friction: Crown of the Tides dislikes unrestricted Glass dissident sanctuary without trade guarantees
  if (
    kingdomId === 'glass_kingdom' &&
    k.treatyProposed &&
    next.kingdoms.crown_tides.treatyProposed &&
    !next.kingdoms.crown_tides.guaranteeRequested
  ) {
    next.kingdoms.crown_tides.trust = Math.max(0, next.kingdoms.crown_tides.trust - 14);
    next.kingdoms.crown_tides.receptionNote =
      'Tides merchants warn that harboring Glass dissidents threatens port security unless guaranteed!';
  }

  return next;
}

export function holdAssemblyVote(prev: CampaignState): CampaignState {
  const next: CampaignState = structuredClone(prev);

  const proposedIds = (Object.keys(next.kingdoms) as KingdomId[]).filter(
    (id) => next.kingdoms[id].treatyProposed && !next.kingdoms[id].withdrawn
  );

  const suitStats = getSuitStats(next.outfit, next.specialization, next.insignia, 0);
  const loyalCount = (Object.keys(next.companions) as CompanionId[]).filter(
    (id) => next.companions[id].status !== 'departed'
  ).length;

  let votes = 4 + suitStats.voteBonus + loyalCount;
  if (next.infirmaryPowered) votes += 1;
  if (next.imperialTruceActive) votes -= 2;
  if (proposedIds.includes('wandering_throne')) votes += 1;

  next.assemblySeatsInFavor = Math.max(0, Math.min(next.assemblySeatsTotal, votes));
  const ratified = next.assemblySeatsInFavor >= 7 && proposedIds.length >= 2;
  next.assemblyRatified = ratified;

  if (proposedIds.includes('crown_tides')) {
    next.kingdoms.crown_tides.ratified = ratified;
    if (ratified) {
      next.tradePrivilegesGranted = true;
      next.powerCellsBank += 2;
      next.worldChanges.push('Crown of the Tides opened moon-carved trade ports.');
    }
  }

  if (proposedIds.includes('glass_kingdom')) {
    next.kingdoms.glass_kingdom.ratified = ratified;
    if (ratified) {
      next.asylumGranted = true;
      next.infirmaryCapacity += 45;
      next.woundedSaved += next.woundedWaiting;
      next.woundedWaiting = 0;
      next.companions.sera = applyCompanionDelta(
        next.companions.sera,
        +18,
        'Glass Kingdom medical bays are docked! Every remaining patient is stabilized.'
      );
      next.worldChanges.push('Glass Kingdom cryo-wards expanded the Refuge Infirmary.');
    }
  } else if (next.kingdoms.glass_kingdom.trust < 40) {
    next.kingdoms.glass_kingdom.withdrawn = true;
    next.companions.sera = applyCompanionDelta(
      next.companions.sera,
      -25,
      'You turned away Glass dissidents! I cannot stay while exiles are hunted.'
    );
  }

  if (proposedIds.includes('wandering_throne')) {
    next.kingdoms.wandering_throne.ratified = ratified;
    if (ratified) {
      next.citizenshipGranted = true;
      next.totalSurvivorsAtRefuge += 45;
      if (next.citizenshipVoteRequired) {
        next.promisesKept.push('Passed Assembly citizenship for Wandering Throne fleets');
      }
      next.worldChanges.push('Wandering Throne Ark-Ships joined the Orbital Refuge perimeter.');
    }
  } else if (next.citizenshipVoteRequired) {
    next.promisesBroken.push('Failed to pass promised citizenship vote for Wandering Throne');
    next.kingdoms.wandering_throne.withdrawn = true;
    next.companions.tarek = applyCompanionDelta(
      next.companions.tarek,
      -60,
      'You promised the Ark captains a citizenship vote and abandoned them on the floor. I am leaving with the nav-charts.'
    );
  }

  if (ratified && proposedIds.length >= 2) {
    next.gateControl =
      next.citizenshipGranted && !next.imperialTruceActive
        ? 'coalition_sovereign'
        : 'coalition_shared';
  } else if (proposedIds.length === 1) {
    next.gateControl = 'contested';
  } else {
    next.gateControl = 'empire';
  }

  next.act = 3;
  next.phase = 'ending';
  return next;
}

export function evaluateEnding(state: CampaignState): EndingSummary {
  const ratifiedCount = (Object.keys(state.kingdoms) as KingdomId[]).filter(
    (id) => state.kingdoms[id].ratified
  ).length;
  const loyalCompanions = (Object.keys(state.companions) as CompanionId[]).filter(
    (id) => state.companions[id].status === 'loyal'
  ).length;

  const score =
    state.totalSurvivorsAtRefuge * 10 +
    state.woundedSaved * 15 +
    ratifiedCount * 350 +
    state.promisesKept.length * 200 -
    state.promisesBroken.length * 180 +
    loyalCompanions * 150;

  if (state.gateControl === 'coalition_sovereign') {
    return {
      id: 'dawn_of_the_free_gates',
      title: 'Dawn of the Free Gates',
      subtitle: 'Coalition Sovereignty & Full Assembly Representation',
      gateController: 'Liberated Assembly & Allied Kingdoms (Free Transit Charter)',
      representation:
        'Ember miners, Refuge escapees, and Wandering Throne citizens hold equal seats; debt-slavery edicts are abolished.',
      promisesSummary: `${state.promisesKept.length} kept · ${state.promisesBroken.length} broken`,
      epilogueLines: [
        `With ${ratifiedCount} kingdom treaties ratified by ${state.assemblySeatsInFavor}/${state.assemblySeatsTotal} Assembly votes, the Zenith blockade shattered at Crown-Gate.`,
        `${state.totalSurvivorsAtRefuge} liberated citizens now inhabit the expanded Orbital Refuge and moon-carved free ports.`,
        state.asylumGranted
          ? 'Glass Kingdom medical domes illuminate the freighter spine, erasing lunar plague mortality.'
          : 'Tide convoy escorts patrol the open jump lanes.',
      ],
      score,
    };
  }

  if (state.gateControl === 'coalition_shared') {
    return {
      id: 'the_conditional_pact',
      title: 'The Conditional Pact',
      subtitle: 'Coalition Jump-Gate Mandate Under Compromised Terms',
      gateController: 'Joint Kingdom-Assembly Directorate',
      representation:
        state.citizenshipGranted
          ? 'Displaced fleets and miners share Assembly benches alongside royal trade observers.'
          : 'Core miners hold Assembly seats, though trade charters and truce clauses leave outer belts disenfranchised.',
      promisesSummary: `${state.promisesKept.length} kept · ${state.promisesBroken.length} broken`,
      epilogueLines: [
        `The coalition seized two primary jump gates, forcing the Zenith Empire back to the inner core.`,
        state.imperialTruceActive
          ? 'Your earlier Imperial corridor truce preserved 40 lives, though Ember remnants still remember the locked cycle.'
          : 'Hard-won treaties keep the corridor open despite tense royal rivalries.',
        `${loyalCompanions}/3 senior companions remained at Iara’s side through the final vote.`,
      ],
      score,
    };
  }

  if (state.gateControl === 'contested') {
    return {
      id: 'fractured_horizon',
      title: 'Fractured Horizon',
      subtitle: 'Single-Ally Stalemate at the Jump Gates',
      gateController: 'Contested — Zenith Blockade & Lone Allied Skirmishers',
      representation:
        'The Assembly survives aboard the Orbital Refuge, but lacks the two-kingdom fleet weight to break Imperial gate locks.',
      promisesSummary: `${state.promisesKept.length} kept · ${state.promisesBroken.length} broken`,
      epilogueLines: [
        `Without two ratified kingdom alliances, the Coalition assault stalled beneath Crown-Gate’s artillery.`,
        `Iara’s ${state.totalSurvivorsAtRefuge} survivors endure inside the hidden Refuge drift, awaiting a second uprising.`,
      ],
      score,
    };
  }

  return {
    id: 'eclipse_of_the_refuge',
    title: 'Eclipse of the Refuge',
    subtitle: 'Assembly Deadlock — Empire Retains Jump-Gate Monopoly',
    gateController: 'Zenith Empire (Blockades & Travel Permits Intact)',
    representation: 'Liberated Assembly forced underground; hereditary debt-leases persist.',
    promisesSummary: `${state.promisesKept.length} kept · ${state.promisesBroken.length} broken`,
    epilogueLines: [
      'When the Assembly failed to ratify two kingdom treaties, royal convoys withdrew into deep orbit.',
      `Iara Venn’s Refuge continues covert rescues from the dark side of the mining moons.`,
    ],
    score,
  };
}
