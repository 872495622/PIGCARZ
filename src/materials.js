import * as THREE from 'three';

function ramp(hexes) {
  const canvas = document.createElement('canvas');
  canvas.width = hexes.length;
  canvas.height = 1;
  const g = canvas.getContext('2d');
  hexes.forEach((hex, i) => {
    g.fillStyle = hex;
    g.fillRect(i, 0, 1, 1);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export const worldRamp = ramp(['#6a6a6a', '#f4f4f4', '#ffffff']);
export const actorRamp = ramp(['#4e4e4e', '#ffffff', '#ffffff', '#ffffff']);

const shared = new Map();

export function toon(hex, actor = false) {
  const key = `${hex}:${actor ? 'a' : 'w'}`;
  if (!shared.has(key)) {
    shared.set(key, new THREE.MeshToonMaterial({
      color: new THREE.Color(hex),
      gradientMap: actor ? actorRamp : worldRamp,
    }));
  }
  return shared.get(key);
}

export function toonUnique(hex, actor = true) {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(hex),
    gradientMap: actor ? actorRamp : worldRamp,
  });
}

export function srgbToLinear(v) {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
