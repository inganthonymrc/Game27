import * as THREE from 'three';
import type { GearId, InsigniaId, OutfitId } from './types';

export interface IaraRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  rightArm: THREE.Group;
  leftArm: THREE.Mesh;
  weaponCarbine: THREE.Group;
  weaponStasis: THREE.Group;
  weaponShieldEmitter: THREE.Group;
  shieldDome: THREE.Mesh;
  setActiveGear: (gear: GearId) => void;
}

const INSIGNIA_COLORS: Record<InsigniaId, number> = {
  miner_wrench: 0xe2913b,
  tides_crest: 0x2ec4b6,
  glass_lotus: 0x7bdff2,
  throne_compass: 0xf4c95d,
};

export function createContactShadow(map: THREE.Texture, radius = 0.75): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.015;
  return mesh;
}

export function createIaraModel(
  outfit: OutfitId,
  insignia: InsigniaId,
  repaired: boolean,
  shadowMap: THREE.Texture
): IaraRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);
  group.add(createContactShadow(shadowMap, 0.75));

  const primaryColor =
    outfit === 'mining_uniform'
      ? 0x3b4859
      : outfit === 'pressure_suit'
      ? 0xd6dde8
      : 0x1e2c48;
  const trimColor =
    outfit === 'mining_uniform'
      ? 0xd98a38
      : outfit === 'pressure_suit'
      ? 0xe07a32
      : 0xe6b655;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: outfit === 'pressure_suit' ? 0.45 : 0.78,
    metalness: outfit === 'pressure_suit' ? 0.25 : 0.1,
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: 0.32,
    metalness: 0.72,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x161b24,
    roughness: 0.85,
    metalness: 0.18,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc99678,
    roughness: 0.68,
    metalness: 0.02,
  });

  // Legs (grounded at y=0)
  const legGeo = new THREE.CapsuleGeometry(0.13, 0.52, 6, 10);
  const leftLeg = new THREE.Mesh(legGeo, bootMat);
  leftLeg.position.set(-0.19, 0.42, 0);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, bootMat);
  rightLeg.position.set(0.19, 0.42, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // Torso (extruded beveled chestplate)
  const torsoShape = new THREE.Shape();
  torsoShape.moveTo(-0.27, 0);
  torsoShape.lineTo(0.27, 0);
  torsoShape.lineTo(0.33, 0.65);
  torsoShape.lineTo(-0.33, 0.65);
  torsoShape.closePath();

  const torsoGeo = new THREE.ExtrudeGeometry(torsoShape, {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  torsoGeo.center();
  const torso = new THREE.Mesh(torsoGeo, fabricMat);
  torso.position.set(0, 1.12, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Visible repair weld plate (shows Iara's history)
  if (repaired) {
    const patchGeo = new THREE.BoxGeometry(0.22, 0.16, 0.38);
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0xc87a3e,
      roughness: 0.35,
      metalness: 0.8,
    });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(-0.14, 1.15, 0.01);
    patch.rotation.z = 0.18;
    bodyGroup.add(patch);
  }

  // Ceremonial Coat tails & collar OR EVA O2 Backpack
  if (outfit === 'ceremonial_coat') {
    const coatGeo = new THREE.CylinderGeometry(0.31, 0.46, 0.72, 10, 1, true, Math.PI * 0.15, Math.PI * 1.7);
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x1a2640,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const coatSkirt = new THREE.Mesh(coatGeo, coatMat);
    coatSkirt.position.set(0, 0.62, 0.02);
    coatSkirt.rotation.y = Math.PI;
    coatSkirt.castShadow = true;
    bodyGroup.add(coatSkirt);

    const lapel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 8, 16, Math.PI * 1.3), armorMat);
    lapel.position.set(0, 1.44, -0.02);
    lapel.rotation.x = Math.PI / 2;
    lapel.rotation.z = Math.PI * 0.85;
    bodyGroup.add(lapel);
  } else {
    // Backpack / Dual O2 Cylinders for EVA or Mining Rig
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.24), armorMat);
    pack.position.set(0, 1.15, -0.24);
    pack.castShadow = true;
    bodyGroup.add(pack);

    const tankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.46, 10);
    const tankMat = new THREE.MeshStandardMaterial({
      color: outfit === 'pressure_suit' ? 0x4cc9f0 : 0x6b778c,
      roughness: 0.28,
      metalness: 0.78,
    });
    const tL = new THREE.Mesh(tankGeo, tankMat);
    tL.position.set(-0.12, 1.16, -0.32);
    const tR = new THREE.Mesh(tankGeo, tankMat);
    tR.position.set(0.12, 1.16, -0.32);
    bodyGroup.add(tL, tR);
  }

  // Neck collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.1, 12), armorMat);
  collar.position.set(0, 1.47, 0);
  bodyGroup.add(collar);

  // Head / Helmet
  if (outfit === 'pressure_suit') {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), fabricMat);
    helmet.position.set(0, 1.66, 0);
    helmet.castShadow = true;
    bodyGroup.add(helmet);

    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.65,
      roughness: 0.1,
      metalness: 0.4,
      clearcoat: 1.0,
    });
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.225, 16, 12, Math.PI * 0.14, Math.PI * 0.72, Math.PI * 0.22, Math.PI * 0.45),
      visorMat
    );
    visor.position.set(0, 1.66, 0.03);
    bodyGroup.add(visor);
  } else {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), skinMat);
    head.position.set(0, 1.65, 0);
    head.castShadow = true;
    bodyGroup.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.205, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshStandardMaterial({ color: 0x221b1e, roughness: 0.85 })
    );
    hair.position.set(0, 1.67, -0.02);
    hair.rotation.x = -0.2;
    bodyGroup.add(hair);

    // Mining headlamp or Delegate circlet
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.08), armorMat);
    band.position.set(0, 1.74, 0.17);
    bodyGroup.add(band);
  }

  // Shoulder Pauldrons & Faction Insignia Crest
  const pauldronGeo = new THREE.SphereGeometry(0.15, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const pLeft = new THREE.Mesh(pauldronGeo, armorMat);
  pLeft.position.set(-0.38, 1.38, 0);
  const pRight = new THREE.Mesh(pauldronGeo, armorMat);
  pRight.position.set(0.38, 1.38, 0);
  bodyGroup.add(pLeft, pRight);

  // Glowing Insignia Pin on chest/shoulder
  const insigniaColor = INSIGNIA_COLORS[insignia];
  const insigniaMat = new THREE.MeshStandardMaterial({
    color: insigniaColor,
    emissive: insigniaColor,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.85,
  });
  const insigniaGeo =
    insignia === 'glass_lotus'
      ? new THREE.OctahedronGeometry(0.085, 0)
      : insignia === 'tides_crest'
      ? new THREE.TorusGeometry(0.065, 0.024, 8, 16)
      : insignia === 'throne_compass'
      ? new THREE.CylinderGeometry(0.08, 0.08, 0.03, 6)
      : new THREE.BoxGeometry(0.12, 0.12, 0.04);
  const insigniaMesh = new THREE.Mesh(insigniaGeo, insigniaMat);
  insigniaMesh.position.set(0.18, 1.31, 0.2);
  if (insignia === 'throne_compass') insigniaMesh.rotation.x = Math.PI / 2;
  bodyGroup.add(insigniaMesh);

  // Left arm
  const armGeo = new THREE.CapsuleGeometry(0.09, 0.42, 6, 8);
  const leftArm = new THREE.Mesh(armGeo, fabricMat);
  leftArm.position.set(-0.39, 1.08, 0.05);
  leftArm.rotation.x = -0.2;
  leftArm.castShadow = true;
  bodyGroup.add(leftArm);

  // Right arm + 3 Gear Visuals
  const rightArm = new THREE.Group();
  rightArm.position.set(0.39, 1.3, 0.05);
  bodyGroup.add(rightArm);

  const rightArmMesh = new THREE.Mesh(armGeo, fabricMat);
  rightArmMesh.position.set(0, -0.22, 0.14);
  rightArmMesh.rotation.x = -Math.PI * 0.35;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // 1. Pulse Carbine
  const weaponCarbine = new THREE.Group();
  weaponCarbine.position.set(0, -0.25, 0.42);
  const carbineBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.14, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x263142, roughness: 0.35, metalness: 0.78 })
  );
  const carbineCoil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.1,
      roughness: 0.2,
    })
  );
  carbineCoil.rotation.x = Math.PI / 2;
  carbineCoil.position.set(0, 0.05, 0.18);
  weaponCarbine.add(carbineBody, carbineCoil);
  rightArm.add(weaponCarbine);

  // 2. Stasis Projector
  const weaponStasis = new THREE.Group();
  weaponStasis.position.set(0, -0.25, 0.38);
  const stasisCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.08, 0.44, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.75 })
  );
  stasisCore.rotation.x = Math.PI / 2;
  const stasisRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.025, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x14b8a6,
      emissiveIntensity: 1.3,
    })
  );
  stasisRing.position.z = 0.24;
  weaponStasis.add(stasisCore, stasisRing);
  weaponStasis.visible = false;
  rightArm.add(weaponStasis);

  // 3. Kinetic Shield Emitter
  const weaponShieldEmitter = new THREE.Group();
  weaponShieldEmitter.position.set(0, -0.24, 0.34);
  const emitterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.08, 6),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.9,
      roughness: 0.25,
      metalness: 0.8,
    })
  );
  emitterDisc.rotation.x = Math.PI / 2;
  weaponShieldEmitter.add(emitterDisc);
  weaponShieldEmitter.visible = false;
  rightArm.add(weaponShieldEmitter);

  // Active Kinetic Shield Dome around Iara & nearby evacuees
  const domeGeo = new THREE.SphereGeometry(2.3, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.24,
    roughness: 0.15,
    metalness: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shieldDome = new THREE.Mesh(domeGeo, domeMat);
  shieldDome.position.y = 0.1;
  shieldDome.visible = false;
  group.add(shieldDome);

  const setActiveGear = (gear: GearId) => {
    weaponCarbine.visible = gear === 'pulse_carbine';
    weaponStasis.visible = gear === 'stasis_projector';
    weaponShieldEmitter.visible = gear === 'kinetic_shield';
  };

  return {
    group,
    bodyGroup,
    leftLeg,
    rightLeg,
    rightArm,
    leftArm,
    weaponCarbine,
    weaponStasis,
    weaponShieldEmitter,
    shieldDome,
    setActiveGear,
  };
}

export type EnemyArchetype = 'shield_trooper' | 'interceptor_drone' | 'enforcer_heavy';

export interface EnemyMeshBundle {
  group: THREE.Group;
  bodyMesh: THREE.Object3D;
  energyShieldMesh: THREE.Mesh | null;
  stasisCageMesh: THREE.Mesh;
  telegraphRing: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
}

export function createEnemyModel(
  archetype: EnemyArchetype,
  shadowMap: THREE.Texture
): EnemyMeshBundle {
  const group = new THREE.Group();
  const bodyMesh = new THREE.Group();
  group.add(bodyMesh);
  group.add(createContactShadow(shadowMap, archetype === 'enforcer_heavy' ? 1.15 : 0.78));

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];

  if (archetype === 'shield_trooper') {
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      roughness: 0.35,
      metalness: 0.75,
    });
    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.4,
    });
    hitFlashMaterials.push(armorMat, crimsonMat);

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.82, 8), armorMat);
    legs.position.y = 0.41;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.34), crimsonMat);
    torso.position.y = 1.14;
    const helmet = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.38, 6), armorMat);
    helmet.position.y = 1.66;
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.72), armorMat);
    rifle.position.set(0.32, 1.15, 0.35);

    bodyMesh.add(legs, torso, helmet, rifle);

    // Front energy shield broken by Pulse Carbine
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const energyShieldMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 6, 1, true, -Math.PI * 0.35, Math.PI * 0.7), shieldMat);
    energyShieldMesh.position.set(0, 1.0, 0.25);
    group.add(energyShieldMesh);

    const stasisCageMesh = createStasisCage(1.1);
    group.add(stasisCageMesh);
    const telegraphRing = createTelegraphRing(0.95);
    group.add(telegraphRing);

    return { group, bodyMesh, energyShieldMesh, stasisCageMesh, telegraphRing, hitFlashMaterials };
  }

  if (archetype === 'interceptor_drone') {
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.28,
      metalness: 0.84,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    hitFlashMaterials.push(hullMat, eyeMat);

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), hullMat);
    core.position.y = 1.6;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), eyeMat);
    eye.position.set(0, 1.6, 0.34);

    const wingGeo = new THREE.BoxGeometry(1.45, 0.08, 0.34);
    const wing = new THREE.Mesh(wingGeo, hullMat);
    wing.position.y = 1.65;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.4), hullMat);
    fin.position.set(0, 1.85, -0.22);

    bodyMesh.add(core, eye, wing, fin);

    const stasisCageMesh = createStasisCage(0.95);
    stasisCageMesh.position.y = 0.5;
    group.add(stasisCageMesh);
    const telegraphRing = createTelegraphRing(1.0);
    group.add(telegraphRing);

    return { group, bodyMesh, energyShieldMesh: null, stasisCageMesh, telegraphRing, hitFlashMaterials };
  }

  // Suppression Enforcer (Area-Denial Heavy)
  const heavyMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.45,
    metalness: 0.78,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    emissive: 0x9a3412,
    emissiveIntensity: 0.55,
    roughness: 0.38,
    metalness: 0.45,
  });
  hitFlashMaterials.push(heavyMat, hazardMat);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 0.9, 8), heavyMat);
  base.position.y = 0.45;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.85), hazardMat);
  hull.position.y = 1.35;
  const podL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 8), heavyMat);
  podL.position.set(-0.68, 1.82, 0);
  podL.rotation.x = Math.PI * 0.28;
  const podR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 8), heavyMat);
  podR.position.set(0.68, 1.82, 0);
  podR.rotation.x = Math.PI * 0.28;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.2), hazardMat);
  visor.position.set(0, 1.65, 0.42);
  bodyMesh.add(base, hull, podL, podR, visor);

  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const energyShieldMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.9, 6, 1, true, -Math.PI * 0.4, Math.PI * 0.8), shieldMat);
  energyShieldMesh.position.set(0, 1.1, 0.3);
  group.add(energyShieldMesh);

  const stasisCageMesh = createStasisCage(1.55);
  group.add(stasisCageMesh);
  const telegraphRing = createTelegraphRing(2.6);
  group.add(telegraphRing);

  return { group, bodyMesh, energyShieldMesh, stasisCageMesh, telegraphRing, hitFlashMaterials };
}

function createStasisCage(radius: number): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(radius, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 1.1;
  mesh.visible = false;
  return mesh;
}

function createTelegraphRing(radius: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(radius * 0.78, radius, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.04;
  mesh.visible = false;
  return mesh;
}

export function createEvacueeModel(shadowMap: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(shadowMap, 0.58));

  const suitMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.78, metalness: 0.1 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5, metalness: 0.2 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.2,
  });

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.72, 8), suitMat);
  legs.position.y = 0.36;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.26), vestMat);
  torso.position.y = 1.0;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), suitMat);
  head.position.y = 1.46;
  const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), lampMat);
  beacon.position.set(0, 1.56, 0.14);

  group.add(legs, torso, head, beacon);
  return group;
}

export function createPickupModel(kind: 'power_cell' | 'medkit' | 'o2_canister'): THREE.Group {
  const group = new THREE.Group();
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.44, 16),
    new THREE.MeshBasicMaterial({
      color: kind === 'power_cell' ? 0x38bdf8 : kind === 'medkit' ? 0x34d399 : 0x60a5fa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.03;
  group.add(baseRing);

  if (kind === 'power_cell') {
    const casing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.58, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 })
    );
    casing.position.y = 0.45;
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.42, 10),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.4,
      })
    );
    core.position.y = 0.45;
    group.add(casing, core);
  } else if (kind === 'medkit') {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.34, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.15 })
    );
    box.position.y = 0.42;
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.24, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
    );
    crossV.position.y = 0.42;
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.1, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
    );
    crossH.position.y = 0.42;
    group.add(box, crossV, crossH);
  } else {
    const tank = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.38, 6, 10),
      new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.8,
        roughness: 0.25,
        metalness: 0.6,
      })
    );
    tank.position.y = 0.48;
    const valve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 })
    );
    valve.position.y = 0.84;
    group.add(tank, valve);
  }
  return group;
}

export function createRefugeFreighter(options: {
  infirmaryPowered: boolean;
  glassDomes: boolean;
  throneArks: boolean;
  tidesPorts: boolean;
}): THREE.Group {
  const ship = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: 0x3c4657, roughness: 0.55, metalness: 0.65 });
  const rustMat = new THREE.MeshStandardMaterial({ color: 0xa65f32, roughness: 0.72, metalness: 0.42 });
  const spineMat = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.4, metalness: 0.8 });

  // Central Freighter Spine
  const spine = new THREE.Mesh(new THREE.BoxGeometry(22, 2.2, 3.2), spineMat);
  ship.add(spine);

  // Converted Cargo Habitat Containers + structural truss ribs
  for (let i = -1; i <= 1; i++) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.0, 4.4), i === 0 ? hullMat : rustMat);
    pod.position.set(i * 5.8, 0.6, 0);
    ship.add(pod);

    const rib = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.16, 6, 12), spineMat);
    rib.rotation.y = Math.PI / 2;
    rib.position.set(i * 5.8 + 2.8, 0.4, 0);
    ship.add(rib);
  }

  // Forward Prow & Sensor Mast
  const prow = new THREE.Mesh(new THREE.ConeGeometry(2.1, 4.6, 6), hullMat);
  prow.rotation.z = -Math.PI / 2;
  prow.position.set(13.2, 0.2, 0);
  ship.add(prow);

  // Bridge Tower + Comms Mast
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.4, 3.6), hullMat);
  bridge.position.set(9.2, 2.2, 0);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 3.6, 6), spineMat);
  mast.position.set(9.2, 5.2, 0);
  const navBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
  );
  navBeacon.position.set(9.2, 7.0, 0);
  ship.add(bridge, mast, navBeacon);

  // Dorsal Solar / Radiator Wings
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.25, metalness: 0.8 });
  for (const zSide of [-4.4, 4.4]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.12, 3.6), wingMat);
    wing.position.set(-4, 1.4, zSide);
    ship.add(wing);
  }

  // Infirmary Bay Windows (visibly glow green when powered, dim amber when brownout)
  const infColor = options.infirmaryPowered ? 0x34d399 : 0xb45309;
  const infLight = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 1.0, 4.55),
    new THREE.MeshStandardMaterial({
      color: infColor,
      emissive: infColor,
      emissiveIntensity: options.infirmaryPowered ? 1.1 : 0.35,
    })
  );
  infLight.position.set(0, 0.9, 0);
  ship.add(infLight);

  // Ion Thruster Bells
  for (const zOff of [-1.4, 1.4]) {
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.35, 2.2, 12), spineMat);
    bell.rotation.z = Math.PI / 2;
    bell.position.set(-12, 0, zOff);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 2.4, 10),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
    );
    flame.rotation.z = Math.PI / 2;
    flame.position.set(-14, 0, zOff);
    ship.add(bell, flame);
  }

  // Dynamic World Change: Glass Kingdom Cryo-Domes
  if (options.glassDomes) {
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x7bdff2,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.72,
      roughness: 0.12,
    });
    for (const xOff of [-4, 4]) {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), domeMat);
      dome.position.set(xOff, 2.1, 0);
      ship.add(dome);
    }
  }

  // Dynamic World Change: Wandering Throne Ark-Ships flanking the Refuge
  if (options.throneArks) {
    const arkMat = new THREE.MeshStandardMaterial({ color: 0xd4a448, roughness: 0.28, metalness: 0.85 });
    for (const zSide of [-10, 10]) {
      const ark = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.7, 9.5, 8), arkMat);
      body.rotation.z = Math.PI / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.25, 8, 20), hullMat);
      ring.rotation.y = Math.PI / 2;
      ark.add(body, ring);
      ark.position.set(-2, 2.5, zSide);
      ship.add(ark);
    }
  }

  // Dynamic World Change: Crown of the Tides Trade Beacons
  if (options.tidesPorts) {
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x2ec4b6,
      emissive: 0x14b8a6,
      emissiveIntensity: 1.2,
    });
    for (const xPos of [-9, 9]) {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 5.5, 8), beaconMat);
      pylon.position.set(xPos, -1.5, 5.5);
      ship.add(pylon);
    }
  }

  return ship;
}

export function createJumpGate(): { group: THREE.Group; ring: THREE.Mesh; portal: THREE.Mesh } {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a3548,
    roughness: 0.3,
    metalness: 0.85,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd98a38,
    roughness: 0.25,
    metalness: 0.88,
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(14, 1.15, 10, 36), metalMat);
  group.add(ring);

  // 4 Gate Stabilizer Pylons
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.2, 2.6), goldMat);
    pylon.position.set(Math.cos(angle) * 14, Math.sin(angle) * 14, 0);
    pylon.rotation.z = angle;
    ring.add(pylon);
  }

  const portal = new THREE.Mesh(
    new THREE.CircleGeometry(12.6, 32),
    new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  group.add(portal);

  return { group, ring, portal };
}
