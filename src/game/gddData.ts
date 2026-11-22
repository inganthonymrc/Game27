export interface GddMissionEntry {
  act: string;
  title: string;
  setting: string;
  mechanics: string;
  branches: string[];
}

export interface GddFactionEntry {
  name: string;
  interest: string;
  offeredAsset: string;
  demand: string;
  worldChange: string;
}

export interface GddDemoBeat {
  timestamp: string;
  phase: string;
  summary: string;
  linkedConsequence: string;
}

export const GDD_DATA = {
  title: 'The Orbital Pact',
  genre: 'Single-Player 3D Third-Person Survival-Action & Coalition Strategy',
  premise:
    'In a star cluster shackled by the Zenith Empire’s jump-gate monopoly, travel permits, and hereditary debt-slavery laws, lunar maintenance technician Iara Venn escapes the collapse of Shatter-Shaft Nine. Armed with life-support expertise and scavenged industrial gear, she turns a derelict ore freighter into the Orbital Refuge—and rises from survivalist mechanic to elected Assembly delegate forging a multi-kingdom coalition to liberate the jump gates.',
  coreLoop: [
    {
      step: '01 · Besieged Expedition (3D Action)',
      detail:
        'Deploy into failing orbital districts in third-person 3D. Scavenge Power Cells, Medicine, and Oxygen canisters while rescuing civilians. Resolve patrols via Pulse Carbine (shield-break), Stasis Projector (crowd freeze), Portable Kinetic Shield (evacuee cover), stealth sightline bypass, diplomatic defection, or tactical retreat.',
    },
    {
      step: '02 · Refuge Freighter & Wardrobe',
      detail:
        'Return to the converted freighter Aegis Hull. Allocate scarce Power Cells between your personal Kinetic Shield reserve and the Refuge Infirmary. Equip Iara’s specialization (Engineering, Protection, Diplomacy), outfit (Mining Uniform, EVA Pressure Suit, Ceremonial Coat), and visible insignia.',
    },
    {
      step: '03 · Assembly & Kingdom Treaties',
      detail:
        'Convene inside the suspended shipyard diplomatic hall. Negotiate trade, asylum, or citizenship guarantees with three rival star kingdoms, sway Assembly delegates using earned trust and coat insignia, and ratify at least two treaties to unlock the Jump Gate assault.',
    },
    {
      step: '04 · Visible World Consequences',
      detail:
        'Every choice persists: unpowered infirmaries claim wounded lives, broken promises drive companions (Kaelen, Dr. Sera, Tarek) to challenge or abandon the coalition, and ratified kingdoms physically dock Ark-ships, cryo-domes, and trade escorts at the Refuge.',
    },
  ],
  factions: [
    {
      name: 'Zenith Empire',
      interest: 'Total jump-gate toll monopoly & hereditary debt-labor enforcement',
      offeredAsset: 'Temporary blockade ceasefires & corridor permits',
      demand: 'Subjugation, travel permits, and containment of liberated districts',
      worldChange: 'Truces save partial convoys immediately but forfeit sector access and alienate miners.',
    },
    {
      name: 'Crown of the Tides',
      interest: 'Autonomous deep-moon shipping lanes free of Imperial tariffs',
      offeredAsset: 'Opens moon-carved ports, escort frigates, and +2 Power Cell supply routes',
      demand: 'Preferential trade privileges & port tariff exemptions',
      worldChange: 'Lights orbital trade beacons; sparks friction with Glass dissidents unless guaranteed.',
    },
    {
      name: 'The Glass Kingdom',
      interest: 'Preserving exiled scholars and bio-engineering breakthroughs',
      offeredAsset: 'Cryo-medical suites (+45 Infirmary Capacity, zero-loss triage)',
      demand: 'Permanent orbital asylum for political dissidents',
      worldChange: 'Illuminates translucent medical domes along the Orbital Refuge spine.',
    },
    {
      name: 'The Wandering Throne',
      interest: 'Sovereign homeland status for stateless generation-ark fleets',
      offeredAsset: 'Ark-Class evacuation cruisers (+90 rescue capacity & assault hulls)',
      demand: 'Full citizenship rights ratified by the Liberated Assembly',
      worldChange: 'Docks massive golden-hull ark cruisers around the Refuge perimeter.',
    },
    {
      name: 'Liberated Assembly',
      interest: 'Abolition of debt-slavery and democratic jump-gate governance',
      offeredAsset: 'Coalition legitimacy & 12-seat treaty ratification floor',
      demand: 'Accountability on kept promises, survival metrics, and fair representation',
      worldChange: 'Governs post-war jump-gate charters in Act III endings.',
    },
  ] as GddFactionEntry[],
  companions: [
    {
      name: 'Kaelen Orlov · Dockhand Organizer',
      arc: 'Represents mining-moon laborers. Challenges Iara if she signs Imperial ceasefires or leaves workers behind; leaves if coalition compromises become debt-slavery lite.',
    },
    {
      name: 'Dr. Sera Vance · Exiled Bio-Engineer',
      arc: 'Maintains the freighter infirmary. Clashes if Power Cells go exclusively to weapons over medical cryo-beds or if Glass Kingdom dissidents are betrayed.',
    },
    {
      name: 'Tarek Sollis · Jump-Gate Navigator',
      arc: 'Charts unstable gate corridors. Demands Wandering Throne citizenship promises be honored; abandons the bridge with nav-charts if displaced fleets are betrayed.',
    },
  ],
  missions: [
    {
      act: 'ACT I · Escape & Refuge',
      title: 'Shatter-Shaft Nine',
      setting: 'Collapsing mining-moon tether & converted freighter Aegis Hull',
      mechanics:
        'Tutorialized 3D escape: splice life-support relays (Engineering), shield miners under falling slag (Kinetic Shield), and establish the Orbital Refuge.',
      branches: [
        'Save deep-shaft crew -> starts Act II with +12 Refuge population & loyal Kaelen.',
        'Salvage freighter reactor core -> starts Act II with +2 Power Cells & higher Shield reserve.',
      ],
    },
    {
      act: 'ACT II · Formation of the Coalition (Playable Slice)',
      title: 'Ember’s Final Hour',
      setting: 'Failing lunar colony dockyard under Zenith orbital blockade',
      mechanics:
        '120 colonists face total oxygen collapse. Choose Low (40 cap Imperial Corridor), Moderate (90 cap Wandering Throne Ark-Ships), or High (120 cap Experimental Jump Gate) risk before deploying into 3D combat/stealth/dialogue rescue.',
      branches: [
        'Low Risk (40 rescued): Guaranteed ceasefire, bars return for 1 cycle, Kaelen challenges.',
        'Moderate Risk (90 rescued): Requires passing Citizenship Vote in Assembly or Tarek departs.',
        'High Risk (120 rescued): Drains 3 Refuge Emergency Power Cells; failing to stabilize conduits strands part of convoy.',
      ],
    },
    {
      act: 'ACT III · Fall of the Empire',
      title: 'Crown-Gate Reckoning',
      setting: 'Suspended Diplomatic Hall & Zenith Jump-Gate Citadel',
      mechanics:
        'Requires >= 2 ratified Kingdom treaties and >= 7/12 Assembly votes. Assault or negotiate surrender of the central gate hub using accumulated fleet assets.',
      branches: [
        'Dawn of the Free Gates: Sovereign coalition control, abolished debt-slavery, full representation.',
        'The Conditional Pact: Shared royal-assembly gate mandate tempered by earlier compromises.',
        'Fractured Horizon / Eclipse: Stalemate or Imperial blockade retention if coalition fractures.',
      ],
    },
  ] as GddMissionEntry[],
  wardrobe: [
    {
      outfit: 'Patched Mining Uniform',
      role: 'Act I base attire · Welded copper-slate patches reflect every repair.',
      effect: '100s O₂ · Boosts dockworker rapport during lunar district encounters.',
    },
    {
      outfit: 'EVA Pressure Suit',
      role: 'Vacuum expedition rig · Sealed visor & dual O₂ tanks.',
      effect: '145s O₂ (+45% vacuum endurance) · Essential for High-Risk Jump Gate runs.',
    },
    {
      outfit: 'Ceremonial Delegate Coat',
      role: 'Assembly & cutscene attire · Displays selectable Faction Insignia.',
      effect: '+2 Assembly Votes · Insignia (Wrench, Tides Crest, Glass Lotus, Throne Compass) shifts kingdom trust & companion dialogue.',
    },
  ],
  demo25Min: [
    {
      timestamp: '00:00 – 03:30',
      phase: 'Briefing & Risk Commitment',
      summary:
        'Review Ember’s Final Hour telemetry aboard Aegis Hull. Inspect 40/90/120 evacuee capacities, oxygen window, and companion warnings before committing to a risk tier.',
      linkedConsequence: 'Sets 3D mission timer, gate conduit objective, and Refuge reserve drain.',
    },
    {
      timestamp: '03:30 – 13:30',
      phase: '3D Third-Person Expedition',
      summary:
        'Navigate moon-carved dockyards in EVA Pressure Suit. Break Zenith shields with Pulse Carbine [1], freeze Enforcers with Stasis Projector [2], shield evacuees with Kinetic Shield [3], bypass patrols via crouch-stealth [C], or persuade the wavering lieutenant [E].',
      linkedConsequence: 'Scavenged Power Cells & Medkits transfer directly into Refuge inventory.',
    },
    {
      timestamp: '13:30 – 18:00',
      phase: 'Refuge Return & Wardrobe Shift',
      summary:
        'Dock back at the Orbital Refuge. Allocate scarce Power Cells between Infirmary cryo-beds and Suit Shield reserve, then change into the Ceremonial Delegate Coat and pin a Kingdom or Miner Insignia.',
      linkedConsequence: '3D character mesh updates live; infirmary pods visibly power up or brown out.',
    },
    {
      timestamp: '18:00 – 25:00',
      phase: 'Diplomatic Assembly & World Return',
      summary:
        'Enter the suspended shipyard hall. Negotiate terms with the Crown of the Tides, Glass Kingdom, and Wandering Throne, call the 12-seat Assembly vote, and witness the transformed Refuge & Jump Gate outcome.',
      linkedConsequence: 'Ratified fleets dock in orbit; broken promises trigger companion departure.',
    },
  ] as GddDemoBeat[],
};
