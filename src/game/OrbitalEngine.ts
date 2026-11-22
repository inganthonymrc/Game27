import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import {
  createEnemyModel,
  createEvacueeModel,
  createIaraModel,
  createJumpGate,
  createPickupModel,
  createRefugeFreighter,
  type EnemyArchetype,
  type EnemyMeshBundle,
  type IaraRig,
} from './models';
import { RISK_OPTIONS, getSuitStats } from './rules';
import { createProceduralTextures, type ProceduralTextureSet } from './textures';
import type {
  CampaignState,
  ExpeditionMetrics,
  GearId,
  InsigniaId,
  OutfitId,
  RiskChoiceId,
  SpecializationId,
} from './types';

interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  mesh: THREE.Object3D;
}

interface EnemyEntity {
  id: number;
  archetype: EnemyArchetype;
  bundle: EnemyMeshBundle;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  stasisTimer: number;
  hitFlashTimer: number;
  attackTimer: number;
  windupTimer: number;
  targetPos: THREE.Vector3;
  orbitSign: number;
  alive: boolean;
  koTimer: number;
  isWaveringOfficer: boolean;
  pacified: boolean;
}

interface EvacueeEntity {
  id: number;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  rescued: boolean;
  countValue: number;
  movingToAirlock: boolean;
}

interface PickupEntity {
  id: number;
  kind: 'power_cell' | 'medkit' | 'o2_canister';
  mesh: THREE.Group;
  pos: THREE.Vector3;
  collected: boolean;
}

interface ConduitEntity {
  id: number;
  mesh: THREE.Group;
  ringMesh: THREE.Mesh;
  pos: THREE.Vector3;
  stabilized: boolean;
}

interface Projectile {
  active: boolean;
  fromPlayer: boolean;
  kind: 'pulse' | 'stasis' | 'enemy_bolt';
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  mesh: THREE.Mesh;
}

interface ParticleSlot {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

export type EngineMode = 'title' | 'expedition' | 'refuge';

export interface EngineCallbacks {
  onMetricsUpdate: (metrics: ExpeditionMetrics) => void;
  onExpeditionEnd: (metrics: ExpeditionMetrics) => void;
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();

export class OrbitalEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: ProceduralTextureSet;
  private isSoftwareGl: boolean;
  private callbacks: EngineCallbacks;

  private frameId = 0;
  private disposed = false;
  private paused = false;
  private mode: EngineMode = 'title';
  private lastTime = performance.now();
  private elapsed = 0;
  private hitstopTimer = 0;
  private trauma = 0;
  private lastHudPush = 0;

  // Input state
  private keysHeld = new Set<string>();
  private justPressed = new Set<string>();
  private mouseNdc = new THREE.Vector2(0, 0);
  private mouseDown = false;
  private aimWorldPoint = new THREE.Vector3(0, 1, -10);
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.1);
  private resizeObserver: ResizeObserver;

  // Groups
  private titleGroup = new THREE.Group();
  private expeditionGroup = new THREE.Group();
  private refugeGroup = new THREE.Group();
  private dynamicGroup = new THREE.Group();

  // Title/Background refs
  private titleGateRing: THREE.Mesh | null = null;
  private refugeShowcaseRig: IaraRig | null = null;
  private refugeFreighterMesh: THREE.Group | null = null;

  // Expedition state
  private iaraRig: IaraRig | null = null;
  private playerPos = new THREE.Vector3(0, 0, 20);
  private playerVel = new THREE.Vector3();
  private playerYaw = Math.PI;
  private walkPhase = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private fireCooldown = 0;
  private squashY = 1;
  private airlockPos = new THREE.Vector3(0, 0, 23);

  private obstacles: ObstacleBox[] = [];
  private wallRayTargets: THREE.Object3D[] = [];
  private enemies: EnemyEntity[] = [];
  private evacuees: EvacueeEntity[] = [];
  private pickups: PickupEntity[] = [];
  private conduits: ConduitEntity[] = [];
  private projectiles: Projectile[] = [];

  // Pooled particles
  private particleCount = 120;
  private particleMesh: THREE.InstancedMesh;
  private particles: ParticleSlot[] = [];
  private particleCursor = 0;

  private currentRisk: RiskChoiceId = 'moderate_throne';
  private currentSpec: SpecializationId = 'engineering';
  private currentOutfit: OutfitId = 'pressure_suit';
  private currentInsignia: InsigniaId = 'miner_wrench';
  private currentRepaired = true;
  private shieldBonusCells = 0;

  private metrics: ExpeditionMetrics = {
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

  private statusBannerTimer = 0;
  private camPos = new THREE.Vector3(0, 12, 34);
  private camLook = new THREE.Vector3(0, 1.5, 16);

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(320, container.clientWidth || window.innerWidth);
    const height = Math.max(240, container.clientHeight || window.innerHeight);
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b12);
    this.scene.fog = new THREE.FogExp2(0x070b12, 0.0085);

    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.2, 320);
    this.camera.position.copy(this.camPos);

    // Mandatory studio environment reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.textures = createProceduralTextures(
      this.isSoftwareGl ? 1 : this.renderer.capabilities.getMaxAnisotropy()
    );

    this.setupLightsAndSky();
    this.scene.add(this.titleGroup, this.expeditionGroup, this.refugeGroup, this.dynamicGroup);

    // Pooled InstancedMesh Particle Ring Buffer
    const pGeo = new THREE.OctahedronGeometry(0.16, 0);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.particleCount);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        active: false,
        pos: new THREE.Vector3(0, -100, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        scale: 0,
        color: new THREE.Color(0xffffff),
      });
      _mat4.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, new THREE.Color(0xffffff));
    }
    this.scene.add(this.particleMesh);

    this.buildTitleScene();
    this.buildExpeditionArena();
    this.setMode('title');

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.lastTime = performance.now();
    this.tick();
  }

  private setupLightsAndSky(): void {
    // Cool cosmic sky / warm ground bounce
    const hemi = new THREE.HemisphereLight(0x5288c9, 0x251a14, 0.88);
    this.scene.add(hemi);

    // Warm orbital sun key light
    const key = new THREE.DirectionalLight(0xffe0b5, 1.85);
    key.position.set(24, 38, 18);
    if (!this.isSoftwareGl) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 4;
      key.shadow.camera.far = 96;
      const d = 34;
      key.shadow.camera.left = -d;
      key.shadow.camera.right = d;
      key.shadow.camera.top = d;
      key.shadow.camera.bottom = -d;
      key.shadow.bias = -0.0005;
      key.shadow.normalBias = 0.02;
    }
    this.scene.add(key);

    // Rim light from distant Jump Gate cyan glow
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.72);
    rim.position.set(-28, 16, -32);
    this.scene.add(rim);

    // Instanced starfield (crisp atmospheric distribution)
    const starCount = 320;
    const starGeo = new THREE.OctahedronGeometry(0.42, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const stars = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const theta = ((i * 137.5) % 360) * (Math.PI / 180);
      const phi = ((i * 53.1) % 160) * (Math.PI / 180) - 0.25;
      const r = 125 + (i % 55);
      dummy.position.set(
        Math.cos(theta) * Math.cos(phi) * r,
        Math.sin(phi) * r + 22,
        Math.sin(theta) * Math.cos(phi) * r
      );
      const s = 0.65 + (i % 5) * 0.3;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    this.scene.add(stars);
  }

  private buildTitleScene(): void {
    const freighter = createRefugeFreighter({
      infirmaryPowered: true,
      glassDomes: false,
      throneArks: false,
      tidesPorts: false,
    });
    freighter.position.set(16, 0.5, -10);
    freighter.rotation.y = -0.5;
    this.titleGroup.add(freighter);

    const gate = createJumpGate();
    gate.group.position.set(24, 10, -34);
    gate.group.rotation.y = -0.35;
    this.titleGateRing = gate.ring;
    this.titleGroup.add(gate.group);

    // Moon silhouette ridge
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(28, 24, 18),
      new THREE.MeshStandardMaterial({
        map: this.textures.lunarRockMap,
        bumpMap: this.textures.lunarRockBump,
        bumpScale: 0.4,
        roughness: 0.9,
        metalness: 0.05,
      })
    );
    moon.position.set(22, -28, -22);
    this.titleGroup.add(moon);
  }

  private buildExpeditionArena(): void {
    // Extended lunar regolith shelf beyond playable pad (natural perimeter, no void box)
    const moonShelf = new THREE.Mesh(
      new THREE.CylinderGeometry(58, 72, 6, 32),
      new THREE.MeshStandardMaterial({
        map: this.textures.lunarRockMap,
        bumpMap: this.textures.lunarRockBump,
        bumpScale: 0.35,
        roughness: 0.88,
        metalness: 0.08,
      })
    );
    moonShelf.position.set(0, -3.1, 0);
    moonShelf.receiveShadow = true;
    this.expeditionGroup.add(moonShelf);

    // Main Orbital Dockyard Plating (54x54)
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(54, 0.5, 54),
      new THREE.MeshStandardMaterial({
        map: this.textures.deckMap,
        bumpMap: this.textures.deckBump,
        bumpScale: 0.14,
        roughness: 0.62,
        metalness: 0.48,
      })
    );
    deck.position.set(0, -0.25, 0);
    deck.receiveShadow = true;
    this.expeditionGroup.add(deck);

    // Central Walkway Spine (industrial steel runway with subtle glowing lane rails, no stretched stripes)
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 0.05, 46),
      new THREE.MeshStandardMaterial({
        color: 0x16202e,
        roughness: 0.52,
        metalness: 0.62,
      })
    );
    spine.position.set(0, 0.025, 0);
    spine.receiveShadow = true;
    this.expeditionGroup.add(spine);

    const guideMat = new THREE.MeshBasicMaterial({ color: 0xd98a38 });
    for (const xSide of [-3.3, 3.3]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 45), guideMat);
      strip.position.set(xSide, 0.05, 0);
      this.expeditionGroup.add(strip);
    }

    // Natural perimeter moon basalt cliffs & industrial dock cranes
    const cliffMat = new THREE.MeshStandardMaterial({
      map: this.textures.lunarRockMap,
      roughness: 0.9,
      metalness: 0.05,
    });
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 31 + (i % 3) * 2.5;
      const h = 5 + (i % 4) * 2.8;
      const cliff = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8 + (i % 2) * 1.4, 0), cliffMat);
      cliff.scale.set(1.4, h / 4, 1.2);
      cliff.position.set(Math.cos(angle) * dist, h * 0.35, Math.sin(angle) * dist);
      cliff.rotation.y = angle;
      this.expeditionGroup.add(cliff);
    }

    // Distant horizon Jump Gate landmark framing the spawn vista (-Z)
    const gate = createJumpGate();
    gate.group.position.set(0, 16, -54);
    this.expeditionGroup.add(gate.group);

    // Open Extraction Airlock Landing Pad at South (+Z = 23) — low flanking beacons so third-person camera stays unobstructed
    const airlockGroup = new THREE.Group();
    airlockGroup.position.set(0, 0, 23.2);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x132b24,
      emissive: 0x065f46,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const pad = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.08, 3.6), padMat);
    pad.position.y = 0.04;
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.72 });
    const pylonL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), pylonMat);
    pylonL.position.set(-3.1, 0.9, 0);
    const pylonR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), pylonMat);
    pylonR.position.set(3.1, 0.9, 0);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const lampL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), lightMat);
    lampL.position.set(-3.1, 1.9, 0);
    const lampR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), lightMat);
    lampR.position.set(3.1, 1.9, 0);
    airlockGroup.add(pad, pylonL, pylonR, lampL, lampR);
    this.expeditionGroup.add(airlockGroup);

    // Cover Bulkheads & Cargo Clusters (leaving wide open central corridor >= 6m wide)
    const coverLayout: Array<[number, number, number, number, number]> = [
      [-9, 10, 3.8, 1.9, 2.2],
      [9, 10, 3.8, 1.9, 2.2],
      [-12, 0, 4.4, 2.2, 3.0],
      [12, 0, 4.4, 2.2, 3.0],
      [-7, -9, 3.2, 1.8, 2.4],
      [7, -9, 3.2, 1.8, 2.4],
      [-16, -15, 4.2, 2.6, 3.4],
      [16, -15, 4.2, 2.6, 3.4],
      [0, -17, 5.2, 2.2, 2.4],
    ];

    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x2a3649,
      roughness: 0.55,
      metalness: 0.58,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      map: this.textures.hazardMap,
      roughness: 0.48,
      metalness: 0.35,
    });

    this.obstacles = [];
    this.wallRayTargets = [];
    for (const [x, z, w, h, d] of coverLayout) {
      const cluster = new THREE.Group();
      cluster.position.set(x, 0, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateMat);
      body.position.y = h / 2;
      body.castShadow = !this.isSoftwareGl;
      body.receiveShadow = true;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.22, d + 0.16), trimMat);
      cap.position.y = h + 0.05;
      cluster.add(body, cap);
      this.expeditionGroup.add(cluster);

      this.obstacles.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        mesh: body,
      });
      this.wallRayTargets.push(body);
    }
  }

  public setMode(mode: EngineMode): void {
    this.mode = mode;
    this.titleGroup.visible = mode === 'title';
    this.expeditionGroup.visible = mode === 'expedition';
    this.dynamicGroup.visible = mode === 'expedition';
    this.refugeGroup.visible = mode === 'refuge';
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.keysHeld.clear();
      this.mouseDown = false;
    }
  }

  public startExpedition(
    risk: RiskChoiceId,
    spec: SpecializationId,
    outfit: OutfitId,
    insignia: InsigniaId,
    repaired: boolean,
    shieldBonusCells: number
  ): void {
    this.currentRisk = risk;
    this.currentSpec = spec;
    this.currentOutfit = outfit;
    this.currentInsignia = insignia;
    this.currentRepaired = repaired;
    this.shieldBonusCells = shieldBonusCells;

    this.clearDynamicEntities();
    this.setMode('expedition');
    this.paused = false;

    const specRisk = RISK_OPTIONS[risk];
    const suit = getSuitStats(outfit, spec, insignia, shieldBonusCells);

    this.metrics = {
      hp: suit.maxHp,
      maxHp: suit.maxHp,
      oxygen: suit.maxOxygen,
      maxOxygen: suit.maxOxygen,
      suitPower: suit.maxSuitPower,
      maxSuitPower: suit.maxSuitPower,
      powerCellsCollected: 0,
      medkitsCollected: 0,
      evacueesRescued: 0,
      evacueesTarget: specRisk.estimatedCapacity,
      evacueesLost: 0,
      conduitsStabilized: 0,
      conduitsTotal: risk === 'high_gate' ? 2 : 0,
      enemiesDefeated: 0,
      enemiesStasised: 0,
      stealthBypassed: 0,
      dialogueResolved: 0,
      activeGear: 'pulse_carbine',
      shieldActive: false,
      crouching: false,
      timeRemaining: specRisk.timeLimitSeconds,
      interactPrompt: null,
      statusBanner: `${specRisk.title}: Rescue ${specRisk.estimatedCapacity} colonists before O₂ runs dry.`,
      outcome: 'ongoing',
    };
    this.statusBannerTimer = 4.5;

    // Spawn player on wide central spine facing north (-Z) toward open plaza
    this.playerPos.set(0, 0, 19);
    this.playerVel.set(0, 0, 0);
    this.playerYaw = Math.PI;
    this.camPos.set(0, 8.5, 28);
    this.camLook.set(0, 1.5, 14);

    this.iaraRig = createIaraModel(outfit, insignia, repaired, this.textures.contactShadowMap);
    this.iaraRig.group.position.copy(this.playerPos);
    this.iaraRig.group.rotation.y = this.playerYaw;
    this.dynamicGroup.add(this.iaraRig.group);

    // Spawn Evacuee Groups scaled cleanly to target capacity
    const evacSpots: Array<[number, number, number]> =
      risk === 'low_imperial'
        ? [
            [-14, 12, 20],
            [14, -4, 20],
          ]
        : risk === 'moderate_throne'
        ? [
            [-16, 12, 30],
            [16, 4, 30],
            [-12, -16, 30],
          ]
        : [
            [-17, 13, 30],
            [17, 12, 30],
            [-16, -16, 30],
            [16, -16, 30],
          ];

    evacSpots.forEach(([x, z, count], idx) => {
      const mesh = createEvacueeModel(this.textures.contactShadowMap);
      mesh.position.set(x, 0, z);
      this.dynamicGroup.add(mesh);
      this.evacuees.push({
        id: idx + 1,
        mesh,
        pos: new THREE.Vector3(x, 0, z),
        rescued: false,
        countValue: count,
        movingToAirlock: false,
      });
    });

    // Spawn High-Risk Experimental Jump Gate Conduits
    if (risk === 'high_gate') {
      const conduitPositions: Array<[number, number]> = [
        [-19, -5],
        [19, -5],
      ];
      conduitPositions.forEach(([cx, cz], idx) => {
        const g = new THREE.Group();
        g.position.set(cx, 0, cz);
        const pylon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.65, 3.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.78 })
        );
        pylon.position.y = 1.7;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.85, 0.12, 8, 18),
          new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            emissive: 0xe11d48,
            emissiveIntensity: 1.4,
          })
        );
        ring.position.y = 3.2;
        g.add(pylon, ring);
        this.dynamicGroup.add(g);
        this.conduits.push({
          id: idx + 1,
          mesh: g,
          ringMesh: ring,
          pos: new THREE.Vector3(cx, 0, cz),
          stabilized: false,
        });
      });
    }

    // Spawn Pickups (Power Cells, Medkits, O2 Canisters)
    const pickupDefs: Array<[number, number, 'power_cell' | 'medkit' | 'o2_canister']> = [
      [-6, 13, 'power_cell'],
      [7, 4, 'o2_canister'],
      [-18, 2, 'medkit'],
      [18, -10, 'power_cell'],
      [0, -11, 'o2_canister'],
      [-10, -19, 'power_cell'],
      [11, -19, 'medkit'],
    ];
    pickupDefs.forEach(([px, pz, kind], idx) => {
      const mesh = createPickupModel(kind);
      mesh.position.set(px, 0, pz);
      this.dynamicGroup.add(mesh);
      this.pickups.push({
        id: idx + 1,
        kind,
        mesh,
        pos: new THREE.Vector3(px, 0, pz),
        collected: false,
      });
    });

    // Spawn 3 Distinct Enemy Archetypes + 1 Wavering Imperial Officer (dialogue path!)
    const enemyDefs: Array<[number, number, EnemyArchetype, boolean]> = [
      [-5, 3, 'shield_trooper', false],
      [6, -2, 'shield_trooper', true], // Lt. Veren — can be persuaded via [E] Dialogue!
      [-13, -7, 'interceptor_drone', false],
      [14, -7, 'interceptor_drone', false],
      [0, -13, 'enforcer_heavy', false],
    ];
    if (risk === 'high_gate') {
      enemyDefs.push([-14, -18, 'shield_trooper', false], [14, -18, 'interceptor_drone', false]);
    }

    enemyDefs.forEach(([ex, ez, arch, wavering], idx) => {
      const bundle = createEnemyModel(arch, this.textures.contactShadowMap);
      bundle.group.position.set(ex, 0, ez);
      this.dynamicGroup.add(bundle.group);
      const maxHp = arch === 'enforcer_heavy' ? 110 : arch === 'shield_trooper' ? 55 : 42;
      const maxShield = arch === 'enforcer_heavy' ? 60 : arch === 'shield_trooper' ? 45 : 0;
      this.enemies.push({
        id: idx + 1,
        archetype: arch,
        bundle,
        pos: new THREE.Vector3(ex, 0, ez),
        vel: new THREE.Vector3(),
        yaw: 0,
        hp: maxHp,
        maxHp,
        shield: maxShield,
        maxShield,
        stasisTimer: 0,
        hitFlashTimer: 0,
        attackTimer: 1.5 + (idx % 3) * 0.6,
        windupTimer: 0,
        targetPos: new THREE.Vector3(),
        orbitSign: idx % 2 === 0 ? 1 : -1,
        alive: true,
        koTimer: 0,
        isWaveringOfficer: wavering,
        pacified: false,
      });
    });

    this.pushMetrics(true);
  }

  public showRefugeScene(campaign: CampaignState): void {
    this.setMode('refuge');
    this.paused = false;

    while (this.refugeGroup.children.length > 0) {
      this.refugeGroup.remove(this.refugeGroup.children[0]);
    }

    // Command Deck platform inside Orbital Refuge
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(7.2, 8.2, 0.6, 12),
      new THREE.MeshStandardMaterial({
        map: this.textures.deckMap,
        roughness: 0.55,
        metalness: 0.5,
      })
    );
    platform.position.y = -0.3;
    platform.receiveShadow = true;
    this.refugeGroup.add(platform);

    const trimRing = new THREE.Mesh(
      new THREE.TorusGeometry(7.1, 0.14, 8, 24),
      new THREE.MeshStandardMaterial({
        color: campaign.infirmaryPowered ? 0x34d399 : 0xd98a38,
        emissive: campaign.infirmaryPowered ? 0x059669 : 0xb45309,
        emissiveIntensity: 0.9,
      })
    );
    trimRing.rotation.x = Math.PI / 2;
    trimRing.position.y = 0.04;
    this.refugeGroup.add(trimRing);

    // Iara Venn showcase rig in her equipped Outfit & Insignia
    this.refugeShowcaseRig = createIaraModel(
      campaign.outfit,
      campaign.insignia,
      campaign.outfitRepaired,
      this.textures.contactShadowMap
    );
    this.refugeShowcaseRig.group.position.set(0, 0, 0);
    this.refugeShowcaseRig.group.scale.setScalar(1.35);
    this.refugeGroup.add(this.refugeShowcaseRig.group);

    // Orbital Refuge Freighter & Allied Fleet visible through viewport bay
    this.refugeFreighterMesh = createRefugeFreighter({
      infirmaryPowered: campaign.infirmaryPowered,
      glassDomes: campaign.asylumGranted || campaign.kingdoms.glass_kingdom.ratified,
      throneArks: campaign.citizenshipGranted || campaign.kingdoms.wandering_throne.ratified,
      tidesPorts: campaign.tradePrivilegesGranted || campaign.kingdoms.crown_tides.ratified,
    });
    this.refugeFreighterMesh.position.set(10, 3.5, -24);
    this.refugeFreighterMesh.rotation.y = -0.4;
    this.refugeGroup.add(this.refugeFreighterMesh);

    const gate = createJumpGate();
    gate.group.position.set(-18, 9, -46);
    gate.group.scale.setScalar(0.8);
    this.refugeGroup.add(gate.group);
  }

  public selectGear(gear: GearId): void {
    if (this.mode !== 'expedition' || this.metrics.outcome !== 'ongoing') return;
    this.metrics.activeGear = gear;
    if (gear !== 'kinetic_shield') {
      this.metrics.shieldActive = false;
    } else if (this.metrics.suitPower > 5) {
      this.metrics.shieldActive = true;
      soundEngine.playKineticShield();
    }
    this.iaraRig?.setActiveGear(gear);
    this.pushMetrics(true);
  }

  private clearDynamicEntities(): void {
    while (this.dynamicGroup.children.length > 0) {
      this.dynamicGroup.remove(this.dynamicGroup.children[0]);
    }
    this.enemies = [];
    this.evacuees = [];
    this.pickups = [];
    this.conduits = [];
    this.projectiles = [];
    this.iaraRig = null;
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      if (this.mode === 'expedition') e.preventDefault();
    }
    if (!this.keysHeld.has(e.code)) {
      this.justPressed.add(e.code);
    }
    this.keysHeld.add(e.code);

    if (this.mode === 'expedition' && !this.paused) {
      if (e.code === 'Digit1') this.selectGear('pulse_carbine');
      if (e.code === 'Digit2') this.selectGear('stasis_projector');
      if (e.code === 'Digit3') this.selectGear('kinetic_shield');
      if (e.code === 'KeyC') {
        this.metrics.crouching = !this.metrics.crouching;
        this.pushMetrics(true);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private onBlur = (): void => {
    this.keysHeld.clear();
    this.mouseDown = false;
  };

  private onVisibility = (): void => {
    if (document.hidden) {
      this.keysHeld.clear();
      this.mouseDown = false;
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    this.onPointerMove(e);
    this.mouseDown = true;
    this.justPressed.add('MouseLeft');
  };

  private onPointerUp = (): void => {
    this.mouseDown = false;
  };

  private handleResize(): void {
    const width = Math.max(320, this.container.clientWidth || window.innerWidth);
    const height = Math.max(240, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    if (!this.paused) {
      this.elapsed += dt;
      if (this.mode === 'title') {
        this.updateTitleCamera(dt);
      } else if (this.mode === 'refuge') {
        this.updateRefugeScene(dt);
      } else if (this.mode === 'expedition') {
        this.updateExpedition(dt);
      }
      this.updateParticles(dt);
    }

    this.justPressed.clear();
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateTitleCamera(dt: number): void {
    if (this.titleGateRing) {
      this.titleGateRing.rotation.z += dt * 0.18;
    }
    const t = this.elapsed * 0.22;
    this.camera.position.set(
      Math.sin(t) * 3 - 8,
      7.2 + Math.cos(t * 0.8) * 1.1,
      15 + Math.cos(t) * 2.5
    );
    this.camera.lookAt(5.5, 2.8, -12);
  }

  private updateRefugeScene(dt: number): void {
    if (this.refugeShowcaseRig) {
      this.refugeShowcaseRig.group.rotation.y += dt * 0.35;
    }
    if (this.refugeFreighterMesh) {
      this.refugeFreighterMesh.position.y = 3.5 + Math.sin(this.elapsed * 0.9) * 0.35;
    }
    this.camera.position.set(-2.2, 2.1, 6.4);
    this.camera.lookAt(1.75, 1.35, 0);
  }

  private updateExpedition(dt: number): void {
    if (this.metrics.outcome !== 'ongoing') {
      return;
    }

    if (this.statusBannerTimer > 0) {
      this.statusBannerTimer -= dt;
      if (this.statusBannerTimer <= 0) {
        this.metrics.statusBanner = null;
      }
    }

    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateCameraFollow(dt);
      return;
    }

    // Timers: Mission Countdown & Oxygen
    this.metrics.timeRemaining = Math.max(0, this.metrics.timeRemaining - dt);
    this.metrics.oxygen = Math.max(0, this.metrics.oxygen - dt);

    if (this.metrics.oxygen <= 0 || this.metrics.timeRemaining <= 0) {
      this.metrics.outcome = 'oxygen_out';
      this.pushMetrics(true);
      this.callbacks.onExpeditionEnd({ ...this.metrics });
      return;
    }

    // Suit Power & Kinetic Shield sustain
    const suitStats = getSuitStats(
      this.currentOutfit,
      this.currentSpec,
      this.currentInsignia,
      this.shieldBonusCells
    );
    if (this.metrics.shieldActive) {
      this.metrics.suitPower = Math.max(
        0,
        this.metrics.suitPower - dt * 11 * suitStats.shieldDrainMultiplier
      );
      if (this.metrics.suitPower <= 0) {
        this.metrics.shieldActive = false;
      }
    } else {
      this.metrics.suitPower = Math.min(this.metrics.maxSuitPower, this.metrics.suitPower + dt * 4.5);
    }

    this.updatePlayerMovement(dt);
    this.updatePlayerActions(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateEvacueesAndPickups(dt);
    this.updateCameraFollow(dt);

    if (performance.now() - this.lastHudPush > 100) {
      this.pushMetrics(false);
    }
  }

  private updatePlayerMovement(dt: number): void {
    const moveX =
      (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') ? 1 : 0) -
      (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') ? 1 : 0);
    const moveZ =
      (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown') ? 1 : 0) -
      (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp') ? 1 : 0);

    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashTimer > 0) this.dashTimer -= dt;

    if (
      (this.justPressed.has('ShiftLeft') || this.justPressed.has('Space')) &&
      this.dashCooldown <= 0
    ) {
      this.dashTimer = 0.18;
      this.dashCooldown = 0.85;
      this.squashY = 0.78;
      this.spawnParticles(this.playerPos, 0x38bdf8, 6, 3.2);
    }

    const baseSpeed = this.metrics.crouching ? 4.4 : 8.2;
    const speed = this.dashTimer > 0 ? 17.5 : baseSpeed;

    _v1.set(moveX, 0, moveZ);
    if (_v1.lengthSq() > 0.001) {
      _v1.normalize();
      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, _v1.x * speed, 14, dt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, _v1.z * speed, 14, dt);
    } else {
      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, 0, 14, dt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, 0, 14, dt);
    }

    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x + this.playerVel.x * dt, -25, 25);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z + this.playerVel.z * dt, -25, 25);
    this.resolveCircleObstacles(this.playerPos, 0.58);

    // Raycast mouse aim onto waist-height plane
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);
    if (this.raycaster.ray.intersectPlane(this.groundPlane, _v2)) {
      this.aimWorldPoint.copy(_v2);
    }

    const dx = this.aimWorldPoint.x - this.playerPos.x;
    const dz = this.aimWorldPoint.z - this.playerPos.z;
    if (dx * dx + dz * dz > 0.15) {
      const targetYaw = Math.atan2(dx, dz);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 14);
    }

    // Distance-synced walk animation + squash/stretch
    const horizSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);
    this.walkPhase += horizSpeed * dt * 1.9;
    this.squashY = THREE.MathUtils.damp(this.squashY, this.metrics.crouching ? 0.82 : 1.0, 12, dt);

    if (this.iaraRig) {
      this.iaraRig.group.position.copy(this.playerPos);
      this.iaraRig.group.rotation.y = this.playerYaw;
      this.iaraRig.bodyGroup.scale.set(1 / Math.sqrt(this.squashY), this.squashY, 1 / Math.sqrt(this.squashY));
      const swing = Math.min(1, horizSpeed / 7) * Math.sin(this.walkPhase) * 0.45;
      this.iaraRig.leftLeg.rotation.x = swing;
      this.iaraRig.rightLeg.rotation.x = -swing;
      this.iaraRig.shieldDome.visible = this.metrics.shieldActive;
    }
  }

  private updatePlayerActions(dt: number): void {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    const wantsFire =
      this.mouseDown || this.keysHeld.has('KeyF') || this.justPressed.has('MouseLeft');

    if (wantsFire && this.fireCooldown <= 0) {
      if (this.metrics.activeGear === 'pulse_carbine') {
        this.fireCooldown = 0.2;
        this.fireProjectile('pulse');
        soundEngine.playPulseShot();
      } else if (this.metrics.activeGear === 'stasis_projector' && this.metrics.suitPower >= 14) {
        this.fireCooldown = 0.55;
        this.metrics.suitPower = Math.max(0, this.metrics.suitPower - 14);
        this.fireProjectile('stasis');
        soundEngine.playStasisCast();
      } else if (this.metrics.activeGear === 'kinetic_shield' && this.justPressed.has('MouseLeft')) {
        this.metrics.shieldActive = !this.metrics.shieldActive && this.metrics.suitPower > 5;
        if (this.metrics.shieldActive) soundEngine.playKineticShield();
      }
    }

    // Check context-sensitive [E] Interactions
    let prompt: string | null = null;
    const interactPressed = this.justPressed.has('KeyE');

    // 1. Wavering Imperial Officer Dialogue / Stealth Takedown
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.pacified) continue;
      const dist = enemy.pos.distanceTo(this.playerPos);
      if (enemy.isWaveringOfficer && dist < 3.8 && enemy.hp > 0) {
        prompt = '[E] Negotiate Imperial Defection';
        if (interactPressed) {
          enemy.pacified = true;
          enemy.bundle.energyShieldMesh && (enemy.bundle.energyShieldMesh.visible = false);
          this.metrics.dialogueResolved += 1;
          this.metrics.statusBanner = 'Lt. Veren stood down and opened Imperial comms (+1 Assembly Vote)!';
          this.statusBannerTimer = 4.0;
          soundEngine.playRescue();
          this.spawnParticles(enemy.pos, 0x34d399, 12, 3.5);
          this.pushMetrics(true);
          return;
        }
      } else if (this.metrics.crouching && dist < 2.6 && enemy.stasisTimer <= 0) {
        prompt = '[E] Stealth Stasis Disable';
        if (interactPressed) {
          enemy.stasisTimer = 6.0;
          enemy.pacified = true;
          this.metrics.stealthBypassed += 1;
          this.metrics.statusBanner = 'Silent takedown: patrol neutralized without alarm.';
          this.statusBannerTimer = 3.0;
          soundEngine.playStasisCast();
          this.spawnParticles(enemy.pos, 0x2dd4bf, 10, 3.0);
          this.pushMetrics(true);
          return;
        }
      }
    }

    // 2. Evacuee Rescue
    if (!prompt) {
      for (const ev of this.evacuees) {
        if (!ev.rescued && ev.pos.distanceTo(this.playerPos) < 3.4) {
          prompt = `[E] Evacuate ${ev.countValue} Colonists`;
          if (interactPressed) {
            ev.rescued = true;
            ev.movingToAirlock = true;
            this.metrics.evacueesRescued = Math.min(
              this.metrics.evacueesTarget,
              this.metrics.evacueesRescued + ev.countValue
            );
            this.metrics.statusBanner = `Escorting ${ev.countValue} colonists to the Extraction Airlock!`;
            this.statusBannerTimer = 3.0;
            soundEngine.playRescue();
            this.spawnParticles(ev.pos, 0xfbbf24, 14, 3.5);
            this.pushMetrics(true);
            return;
          }
        }
      }
    }

    // 3. High-Risk Jump Gate Conduit Stabilization
    if (!prompt) {
      for (const c of this.conduits) {
        if (!c.stabilized && c.pos.distanceTo(this.playerPos) < 3.4) {
          prompt = '[E] Stabilize Jump Gate Conduit';
          if (interactPressed) {
            c.stabilized = true;
            (c.ringMesh.material as THREE.MeshStandardMaterial).color.setHex(0x34d399);
            (c.ringMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x10b981);
            this.metrics.conduitsStabilized += 1;
            this.metrics.statusBanner = `Gate Conduit ${this.metrics.conduitsStabilized}/${this.metrics.conduitsTotal} stabilized!`;
            this.statusBannerTimer = 3.2;
            soundEngine.playPickup();
            this.spawnParticles(c.pos, 0x34d399, 16, 4.0);
            this.pushMetrics(true);
            return;
          }
        }
      }
    }

    // 4. Extraction Airlock (Complete Mission OR Tactical Retreat)
    if (!prompt && this.playerPos.distanceTo(this.airlockPos) < 4.2) {
      const ready = this.metrics.evacueesRescued >= this.metrics.evacueesTarget;
      prompt = ready
        ? '[E] Extract Convoy to Orbital Refuge'
        : `[E] Retreat to Refuge (${this.metrics.evacueesRescued}/${this.metrics.evacueesTarget} Evacuated)`;
      if (interactPressed) {
        this.metrics.outcome = ready ? 'extracted' : 'retreated';
        this.pushMetrics(true);
        this.callbacks.onExpeditionEnd({ ...this.metrics });
        return;
      }
    }

    this.metrics.interactPrompt = prompt;
  }

  private fireProjectile(kind: 'pulse' | 'stasis'): void {
    const dir = _v1
      .set(Math.sin(this.playerYaw), 0, Math.cos(this.playerYaw))
      .normalize();
    const spawnPos = new THREE.Vector3(
      this.playerPos.x + dir.x * 0.85,
      1.25,
      this.playerPos.z + dir.z * 0.85
    );
    const color = kind === 'pulse' ? 0x38bdf8 : 0x2dd4bf;
    const mesh = new THREE.Mesh(
      kind === 'pulse'
        ? new THREE.SphereGeometry(0.16, 8, 8)
        : new THREE.TorusGeometry(0.42, 0.09, 6, 14),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.copy(spawnPos);
    if (kind === 'stasis') mesh.rotation.x = Math.PI / 2;
    this.dynamicGroup.add(mesh);

    this.projectiles.push({
      active: true,
      fromPlayer: true,
      kind,
      pos: spawnPos,
      vel: dir.clone().multiplyScalar(kind === 'pulse' ? 28 : 19),
      life: 1.4,
      mesh,
    });
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);

      let hit = p.life <= 0 || Math.abs(p.pos.x) > 26 || Math.abs(p.pos.z) > 26;

      // Obstacle hit check
      if (!hit) {
        for (const box of this.obstacles) {
          if (
            p.pos.x > box.minX &&
            p.pos.x < box.maxX &&
            p.pos.z > box.minZ &&
            p.pos.z < box.maxZ
          ) {
            hit = true;
            this.spawnParticles(p.pos, p.fromPlayer ? 0x38bdf8 : 0xf43f5e, 5, 2.5);
            break;
          }
        }
      }

      if (!hit && p.fromPlayer) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(p.pos.x - enemy.pos.x, p.pos.z - enemy.pos.z);
          if (dist < (enemy.archetype === 'enforcer_heavy' ? 1.35 : 0.95)) {
            hit = true;
            enemy.pacified = false;
            enemy.hitFlashTimer = 0.08;
            if (p.kind === 'stasis') {
              enemy.stasisTimer = 4.2;
              enemy.windupTimer = 0;
              this.metrics.enemiesStasised += 1;
              this.spawnParticles(enemy.pos, 0x2dd4bf, 12, 3.8);
            } else {
              // Pulse Carbine breaks energy shields rapidly!
              if (enemy.shield > 0) {
                enemy.shield = Math.max(0, enemy.shield - 26);
                if (enemy.shield <= 0) {
                  soundEngine.playShieldBreak();
                  this.hitstopTimer = 0.045;
                  this.trauma = Math.min(1, this.trauma + 0.35);
                  this.spawnParticles(enemy.pos, 0xf59e0b, 16, 4.5);
                }
              } else {
                enemy.hp -= 22;
                this.spawnParticles(enemy.pos, 0xf43f5e, 7, 3.0);
              }
              if (enemy.hp <= 0) {
                enemy.alive = false;
                enemy.koTimer = 0.4;
                this.metrics.enemiesDefeated += 1;
                this.hitstopTimer = 0.05;
                this.trauma = Math.min(1, this.trauma + 0.45);
                soundEngine.playHeavyHit();
                this.spawnParticles(enemy.pos, 0xfbbf24, 18, 5.2);
              }
            }
            break;
          }
        }
      } else if (!hit && !p.fromPlayer) {
        const distToPlayer = Math.hypot(p.pos.x - this.playerPos.x, p.pos.z - this.playerPos.z);
        if (this.metrics.shieldActive && distToPlayer < 2.3) {
          hit = true;
          this.metrics.suitPower = Math.max(0, this.metrics.suitPower - 6);
          this.spawnParticles(p.pos, 0x38bdf8, 8, 3.4);
          soundEngine.playKineticShield();
        } else if (distToPlayer < 0.72) {
          hit = true;
          this.damagePlayer(10);
        }
      }

      if (hit) {
        this.dynamicGroup.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private damagePlayer(amount: number): void {
    this.metrics.hp = Math.max(0, this.metrics.hp - amount);
    this.trauma = Math.min(1, this.trauma + 0.42);
    soundEngine.playPlayerHurt();
    this.spawnParticles(this.playerPos, 0xf43f5e, 10, 3.5);
    if (this.metrics.hp <= 0) {
      this.metrics.outcome = 'defeated';
      this.pushMetrics(true);
      this.callbacks.onExpeditionEnd({ ...this.metrics });
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        if (enemy.koTimer > 0) {
          enemy.koTimer -= dt;
          enemy.bundle.group.rotation.x += dt * 3.5;
          enemy.bundle.group.scale.multiplyScalar(0.95);
          if (enemy.koTimer <= 0) {
            enemy.bundle.group.visible = false;
          }
        }
        continue;
      }

      // Hit flash feedback
      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= dt;
        for (const m of enemy.bundle.hitFlashMaterials) {
          m.emissive.setHex(enemy.hitFlashTimer > 0 ? 0xffffff : 0x450a0a);
        }
      }

      if (enemy.bundle.energyShieldMesh) {
        enemy.bundle.energyShieldMesh.visible = enemy.shield > 0 && !enemy.pacified;
      }

      if (enemy.stasisTimer > 0) {
        enemy.stasisTimer -= dt;
        enemy.bundle.stasisCageMesh.visible = true;
        enemy.bundle.stasisCageMesh.rotation.y += dt * 1.4;
        enemy.bundle.telegraphRing.visible = false;
        continue;
      } else {
        enemy.bundle.stasisCageMesh.visible = false;
      }

      if (enemy.pacified) {
        enemy.bundle.telegraphRing.visible = false;
        continue;
      }

      const dist = enemy.pos.distanceTo(this.playerPos);
      const detectRange = this.metrics.crouching ? 8.5 : 18.0;
      if (dist > detectRange) {
        enemy.bundle.telegraphRing.visible = false;
        continue;
      }

      const toPlayerX = this.playerPos.x - enemy.pos.x;
      const toPlayerZ = this.playerPos.z - enemy.pos.z;
      enemy.yaw = Math.atan2(toPlayerX, toPlayerZ);
      enemy.bundle.group.rotation.y = enemy.yaw;

      // Distinct Movement Policies per Archetype
      if (enemy.archetype === 'shield_trooper') {
        // Kiter/Frontline: maintains 7-11m spacing
        if (dist > 10.5) {
          enemy.pos.x += (toPlayerX / dist) * 3.2 * dt;
          enemy.pos.z += (toPlayerZ / dist) * 3.2 * dt;
        } else if (dist < 6.5) {
          enemy.pos.x -= (toPlayerX / dist) * 2.4 * dt;
          enemy.pos.z -= (toPlayerZ / dist) * 2.4 * dt;
        }
      } else if (enemy.archetype === 'interceptor_drone') {
        // Orbiter/Flanker: strafes laterally around Iara
        const perpX = (-toPlayerZ / dist) * enemy.orbitSign;
        const perpZ = (toPlayerX / dist) * enemy.orbitSign;
        const radial = dist > 8 ? 1.8 : dist < 5 ? -1.8 : 0;
        enemy.pos.x += (perpX * 4.8 + (toPlayerX / dist) * radial) * dt;
        enemy.pos.z += (perpZ * 4.8 + (toPlayerZ / dist) * radial) * dt;
        enemy.bundle.bodyMesh.position.y = Math.sin(this.elapsed * 4 + enemy.id) * 0.22;
      } else {
        // Enforcer Heavy: slow advance
        if (dist > 9.5) {
          enemy.pos.x += (toPlayerX / dist) * 1.9 * dt;
          enemy.pos.z += (toPlayerZ / dist) * 1.9 * dt;
        }
      }

      enemy.pos.x = THREE.MathUtils.clamp(enemy.pos.x, -24, 24);
      enemy.pos.z = THREE.MathUtils.clamp(enemy.pos.z, -24, 24);
      this.resolveCircleObstacles(enemy.pos, 0.8);
      enemy.bundle.group.position.copy(enemy.pos);

      // Attack Telegraph & Fire
      if (enemy.windupTimer > 0) {
        enemy.windupTimer -= dt;
        enemy.bundle.telegraphRing.visible = true;
        if (enemy.archetype === 'enforcer_heavy') {
          enemy.bundle.telegraphRing.position.set(
            enemy.targetPos.x - enemy.pos.x,
            0.05,
            enemy.targetPos.z - enemy.pos.z
          );
          // Counter-rotate ring to stay anchored at world targetPos
          enemy.bundle.telegraphRing.position
            .set(enemy.targetPos.x - enemy.pos.x, 0.05, enemy.targetPos.z - enemy.pos.z)
            .applyAxisAngle(_v3.set(0, 1, 0), -enemy.yaw);
        } else {
          enemy.bundle.telegraphRing.position.set(0, 0.05, 0);
        }

        if (enemy.windupTimer <= 0) {
          enemy.bundle.telegraphRing.visible = false;
          if (enemy.archetype === 'enforcer_heavy') {
            this.spawnParticles(enemy.targetPos, 0xea580c, 16, 4.5);
            soundEngine.playHeavyHit();
            if (enemy.targetPos.distanceTo(this.playerPos) < 2.7) {
              if (this.metrics.shieldActive) {
                this.metrics.suitPower = Math.max(0, this.metrics.suitPower - 14);
                soundEngine.playKineticShield();
              } else {
                this.damagePlayer(18);
              }
            }
          } else {
            const dir = _v1.set(toPlayerX, 0, toPlayerZ).normalize();
            const bPos = new THREE.Vector3(enemy.pos.x + dir.x, 1.2, enemy.pos.z + dir.z);
            const bolt = new THREE.Mesh(
              new THREE.SphereGeometry(0.18, 6, 6),
              new THREE.MeshBasicMaterial({ color: 0xf43f5e })
            );
            bolt.position.copy(bPos);
            this.dynamicGroup.add(bolt);
            this.projectiles.push({
              active: true,
              fromPlayer: false,
              kind: 'enemy_bolt',
              pos: bPos,
              vel: dir.clone().multiplyScalar(15.5),
              life: 1.8,
              mesh: bolt,
            });
          }
          enemy.attackTimer = enemy.archetype === 'interceptor_drone' ? 1.8 : 2.5;
        }
      } else {
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0) {
          enemy.windupTimer = enemy.archetype === 'enforcer_heavy' ? 0.85 : 0.42;
          enemy.targetPos.copy(this.playerPos);
        }
      }
    }
  }

  private updateEvacueesAndPickups(dt: number): void {
    for (const ev of this.evacuees) {
      if (ev.movingToAirlock) {
        _v1.copy(this.airlockPos).sub(ev.pos);
        const dist = _v1.length();
        if (dist < 1.2) {
          ev.movingToAirlock = false;
          ev.mesh.visible = false;
        } else {
          _v1.normalize();
          ev.pos.addScaledVector(_v1, 7.2 * dt);
          ev.mesh.position.copy(ev.pos);
          ev.mesh.rotation.y = Math.atan2(_v1.x, _v1.z);
        }
      }
    }

    for (const p of this.pickups) {
      if (p.collected) continue;
      p.mesh.rotation.y += dt * 1.8;
      if (p.pos.distanceTo(this.playerPos) < 1.45) {
        p.collected = true;
        p.mesh.visible = false;
        soundEngine.playPickup();
        if (p.kind === 'power_cell') {
          this.metrics.powerCellsCollected += 1;
          this.metrics.suitPower = Math.min(this.metrics.maxSuitPower, this.metrics.suitPower + 28);
          this.metrics.statusBanner = 'Power Cell salvaged (+1 Refuge Reserve / +28 Suit Power).';
        } else if (p.kind === 'medkit') {
          this.metrics.medkitsCollected += 1;
          this.metrics.hp = Math.min(this.metrics.maxHp, this.metrics.hp + 25);
          this.metrics.statusBanner = 'Bio-Gel Medkit secured (+1 Refuge Supply / +25 HP).';
        } else {
          this.metrics.oxygen = Math.min(this.metrics.maxOxygen, this.metrics.oxygen + 35);
          this.metrics.statusBanner = 'Pressurized O₂ Canister tapped (+35s Vacuum Reserve).';
        }
        this.statusBannerTimer = 2.8;
        this.spawnParticles(p.pos, 0x38bdf8, 10, 3.0);
        this.pushMetrics(true);
      }
    }

    for (const c of this.conduits) {
      c.ringMesh.rotation.y += dt * (c.stabilized ? 0.8 : 3.2);
    }
  }

  private resolveCircleObstacles(pos: THREE.Vector3, radius: number): void {
    for (const box of this.obstacles) {
      const closestX = THREE.MathUtils.clamp(pos.x, box.minX, box.maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, box.minZ, box.maxZ);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = radius - dist;
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      }
    }
  }

  private updateCameraFollow(dt: number): void {
    // Third-person elevated tactical over-the-shoulder angle
    const desiredCam = _v1.set(this.playerPos.x * 0.72, 11.2, this.playerPos.z + 11.8);
    // Wall pull-in raycast
    _rayOrigin.set(this.playerPos.x, 1.5, this.playerPos.z);
    _rayDir.copy(desiredCam).sub(_rayOrigin);
    const desiredDist = _rayDir.length();
    if (desiredDist > 0.1 && this.wallRayTargets.length > 0) {
      _rayDir.normalize();
      this.raycaster.set(_rayOrigin, _rayDir);
      this.raycaster.far = desiredDist;
      const hits = this.raycaster.intersectObjects(this.wallRayTargets, false);
      if (hits.length > 0 && hits[0].distance < desiredDist) {
        desiredCam.copy(_rayOrigin).addScaledVector(_rayDir, Math.max(3.5, hits[0].distance - 0.6));
      }
      this.raycaster.far = Infinity;
    }

    const dampFactor = 1 - Math.exp(-8 * dt);
    this.camPos.lerp(desiredCam, dampFactor);
    _v2.set(this.playerPos.x * 0.88, 1.4, this.playerPos.z - 2.0);
    this.camLook.lerp(_v2, dampFactor);

    const shake = this.trauma * this.trauma * 0.45;
    this.camera.position.set(
      this.camPos.x + (Math.random() - 0.5) * shake,
      this.camPos.y + (Math.random() - 0.5) * shake,
      this.camPos.z
    );
    this.camera.lookAt(this.camLook);
  }

  private spawnParticles(origin: THREE.Vector3, hex: number, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particleCount;
      slot.active = true;
      slot.pos.set(origin.x, origin.y + 0.8, origin.z);
      slot.vel.set(
        (Math.random() - 0.5) * speed * 2,
        Math.random() * speed * 1.4,
        (Math.random() - 0.5) * speed * 2
      );
      slot.maxLife = 0.35 + Math.random() * 0.35;
      slot.life = slot.maxLife;
      slot.scale = 0.7 + Math.random() * 0.8;
      slot.color.setHex(hex);
    }
  }

  private updateParticles(dt: number): void {
    let dirty = false;
    for (let i = 0; i < this.particleCount; i++) {
      const slot = this.particles[i];
      if (!slot.active) continue;
      dirty = true;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        _mat4.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      slot.vel.y -= 6.5 * dt;
      slot.pos.addScaledVector(slot.vel, dt);
      const s = slot.scale * (slot.life / slot.maxLife);
      _scale.set(s, s, s);
      _mat4.compose(slot.pos, _quat, _scale);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, slot.color);
    }
    if (dirty) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) {
        this.particleMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private pushMetrics(force: boolean): void {
    if (force || performance.now() - this.lastHudPush >= 100) {
      this.lastHudPush = performance.now();
      this.callbacks.onMetricsUpdate({ ...this.metrics });
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
