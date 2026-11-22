import * as THREE from 'three';

export interface ProceduralTextureSet {
  deckMap: THREE.CanvasTexture;
  deckBump: THREE.CanvasTexture;
  hazardMap: THREE.CanvasTexture;
  lunarRockMap: THREE.CanvasTexture;
  lunarRockBump: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Industrial Orbital Deck Plating (Albedo + Bump)
  const deckCanvas = document.createElement('canvas');
  deckCanvas.width = 512;
  deckCanvas.height = 512;
  const dctx = deckCanvas.getContext('2d')!;
  dctx.fillStyle = '#1b2432';
  dctx.fillRect(0, 0, 512, 512);

  // Subtle brushed metal grain
  for (let i = 0; i < 650; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    dctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)';
    dctx.fillRect(x, y, 28, 2);
  }

  // Panel seams & rivets
  dctx.strokeStyle = '#0e141e';
  dctx.lineWidth = 4;
  for (let p = 0; p <= 512; p += 128) {
    dctx.beginPath();
    dctx.moveTo(p, 0);
    dctx.lineTo(p, 512);
    dctx.stroke();
    dctx.beginPath();
    dctx.moveTo(0, p);
    dctx.lineTo(512, p);
    dctx.stroke();
  }
  dctx.strokeStyle = 'rgba(130, 165, 205, 0.16)';
  dctx.lineWidth = 1.5;
  for (let gx = 0; gx < 512; gx += 128) {
    for (let gy = 0; gy < 512; gy += 128) {
      dctx.strokeRect(gx + 8, gy + 8, 112, 112);
      dctx.fillStyle = '#2d3b4e';
      dctx.fillRect(gx + 14, gy + 14, 5, 5);
      dctx.fillRect(gx + 108, gy + 14, 5, 5);
      dctx.fillRect(gx + 14, gy + 108, 5, 5);
      dctx.fillRect(gx + 108, gy + 108, 5, 5);
    }
  }

  const deckMap = new THREE.CanvasTexture(deckCanvas);
  deckMap.colorSpace = THREE.SRGBColorSpace;
  deckMap.wrapS = THREE.RepeatWrapping;
  deckMap.wrapT = THREE.RepeatWrapping;
  deckMap.repeat.set(12, 12);
  deckMap.anisotropy = maxAnisotropy;

  // Grayscale deck bump
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bctx = bumpCanvas.getContext('2d')!;
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);
  bctx.strokeStyle = '#202020';
  bctx.lineWidth = 5;
  for (let p = 0; p <= 512; p += 128) {
    bctx.beginPath();
    bctx.moveTo(p, 0);
    bctx.lineTo(p, 512);
    bctx.stroke();
    bctx.beginPath();
    bctx.moveTo(0, p);
    bctx.lineTo(512, p);
    bctx.stroke();
  }
  const deckBump = new THREE.CanvasTexture(bumpCanvas);
  deckBump.wrapS = THREE.RepeatWrapping;
  deckBump.wrapT = THREE.RepeatWrapping;
  deckBump.repeat.set(12, 12);
  deckBump.anisotropy = maxAnisotropy;

  // 2. Industrial Amber/Slate Hazard Trim
  const hazCanvas = document.createElement('canvas');
  hazCanvas.width = 256;
  hazCanvas.height = 256;
  const hctx = hazCanvas.getContext('2d')!;
  hctx.fillStyle = '#1f252e';
  hctx.fillRect(0, 0, 256, 256);
  hctx.fillStyle = '#d98a38';
  for (let i = -256; i < 512; i += 48) {
    hctx.beginPath();
    hctx.moveTo(i, 0);
    hctx.lineTo(i + 24, 0);
    hctx.lineTo(i - 40, 256);
    hctx.lineTo(i - 64, 256);
    hctx.closePath();
    hctx.fill();
  }
  const hazardMap = new THREE.CanvasTexture(hazCanvas);
  hazardMap.colorSpace = THREE.SRGBColorSpace;
  hazardMap.wrapS = THREE.RepeatWrapping;
  hazardMap.wrapT = THREE.RepeatWrapping;
  hazardMap.repeat.set(4, 1);
  hazardMap.anisotropy = maxAnisotropy;

  // 3. Lunar Regolith / Moon-Carved Basalt
  const rockCanvas = document.createElement('canvas');
  rockCanvas.width = 512;
  rockCanvas.height = 512;
  const rctx = rockCanvas.getContext('2d')!;
  rctx.fillStyle = '#252934';
  rctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 420; i++) {
    const cx = (i * 97) % 512;
    const cy = (i * 193) % 512;
    const r = 4 + (i % 18);
    rctx.fillStyle = i % 3 === 0 ? 'rgba(18, 20, 28, 0.45)' : 'rgba(68, 76, 94, 0.25)';
    rctx.beginPath();
    rctx.arc(cx, cy, r, 0, Math.PI * 2);
    rctx.fill();
  }
  const lunarRockMap = new THREE.CanvasTexture(rockCanvas);
  lunarRockMap.colorSpace = THREE.SRGBColorSpace;
  lunarRockMap.wrapS = THREE.RepeatWrapping;
  lunarRockMap.wrapT = THREE.RepeatWrapping;
  lunarRockMap.repeat.set(8, 8);
  lunarRockMap.anisotropy = maxAnisotropy;

  const lunarRockBump = new THREE.CanvasTexture(rockCanvas);
  lunarRockBump.wrapS = THREE.RepeatWrapping;
  lunarRockBump.wrapT = THREE.RepeatWrapping;
  lunarRockBump.repeat.set(8, 8);
  lunarRockBump.anisotropy = maxAnisotropy;

  // 4. Radial Contact Shadow Disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(3, 5, 10, 0.78)');
  grad.addColorStop(0.55, 'rgba(3, 5, 10, 0.35)');
  grad.addColorStop(1, 'rgba(3, 5, 10, 0.0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);
  contactShadowMap.colorSpace = THREE.SRGBColorSpace;

  return {
    deckMap,
    deckBump,
    hazardMap,
    lunarRockMap,
    lunarRockBump,
    contactShadowMap,
    dispose: () => {
      deckMap.dispose();
      deckBump.dispose();
      hazardMap.dispose();
      lunarRockMap.dispose();
      lunarRockBump.dispose();
      contactShadowMap.dispose();
    },
  };
}
