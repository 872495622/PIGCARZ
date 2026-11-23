import * as THREE from 'three';
import { toonUnique } from './materials.js';

export const TOP_STYLES = [
  { color: '#f7f4ee', sleeve: 0.34 },
  { color: '#2c3336', sleeve: 0.34 },
  { color: '#c25959', sleeve: 0.46 },
  { color: '#3d6f8a', sleeve: 0.5 },
  { color: '#e2b143', sleeve: 0.22 },
  { color: '#6e8f72', sleeve: 0.46 },
  { color: '#de794e', sleeve: 0.36 },
  { color: '#d7c4a8', sleeve: 0.4 },
];

export const BOTTOM_STYLES = [
  { color: '#2c3a55', length: 0.46 },
  { color: '#c25959', length: 0.42 },
  { color: '#cbbfa6', length: 0.78 },
  { color: '#6e8f72', length: 0.5 },
  { color: '#2c3336', length: 0.84 },
  { color: '#8d6a45', length: 0.44 },
];

export const SHOE_STYLES = [
  { color: '#f7f4ee' },
  { color: '#2c3336' },
  { color: '#c25959' },
  { color: '#3d6f8a' },
  { color: '#c48a62' },
  { color: '#4a4038' },
];

export const SKINS = ['#f3d2b5', '#e7b892', '#c48a62', '#8d5a3c'];

export const LOOKS = {
  nia: { hair: 1, top: 2, bottom: 3, shoes: 2, skin: 1 },
  ren: { hair: 6, top: 6, bottom: 2, shoes: 5, skin: 2, glasses: true, beard: true },
  moss: { hair: 4, top: 5, bottom: 4, shoes: 5, skin: 2 },
  lila: { hair: 1, top: 4, bottom: 3, shoes: 0, skin: 0 },
  bo: { hair: 5, top: 7, bottom: 4, shoes: 5, skin: 1 },
  jun: { hair: 0, top: 0, bottom: 2, shoes: 1, skin: 0, glasses: true },
  jin: { hair: 2, top: 0, bottom: 4, shoes: 3, skin: 1, glasses: true },
  plum: { hair: 2, top: 7, bottom: 3, shoes: 4, skin: 2 },
  calm: { hair: 6, top: 5, bottom: 4, shoes: 4, skin: 1, sit: true },
  rao: { hair: 5, top: 3, bottom: 4, shoes: 5, skin: 3 },
  soren: { hair: 6, top: 6, bottom: 2, shoes: 4, skin: 2, beard: true, lute: true },
  vendor: { hair: 1, top: 4, bottom: 0, shoes: 2, skin: 1 },
  student: { hair: 0, top: 3, bottom: 0, shoes: 3, skin: 0 },
  watch: { hair: 5, top: 7, bottom: 4, shoes: 5, skin: 2 },
  nova: { hair: 3, top: 1, bottom: 4, shoes: 1, skin: 0 },
};

export function randomOutfit(rand = Math.random) {
  return {
    hair: (rand() * 7) | 0,
    top: (rand() * TOP_STYLES.length) | 0,
    bottom: (rand() * BOTTOM_STYLES.length) | 0,
    shoes: (rand() * SHOE_STYLES.length) | 0,
    skin: (rand() * SKINS.length) | 0,
  };
}

function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

export function createPerson(options = {}) {
  const look = { ...randomOutfit(), ...(options.look || {}) };
  const group = new THREE.Group();
  const model = new THREE.Group();
  group.add(model);

  const skinMat = toonUnique(SKINS[look.skin] || SKINS[0]);
  const topMat = toonUnique(TOP_STYLES[0].color);
  const sleeveMat = toonUnique(TOP_STYLES[0].color);
  const bottomMat = toonUnique(BOTTOM_STYLES[0].color);
  const shoeMat = toonUnique(SHOE_STYLES[0].color);
  const hairMat = toonUnique('#2c3336');
  const bagMat = toonUnique('#f7f4ee');
  const dark = toonUnique('#2c3336');

  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(0.12, 0.8, 0);
  legR.position.set(-0.12, 0.8, 0);
  const calfL = mesh(new THREE.BoxGeometry(0.12, 0.52, 0.14), skinMat);
  const calfR = mesh(new THREE.BoxGeometry(0.12, 0.52, 0.14), skinMat);
  calfL.position.y = -0.28;
  calfR.position.y = -0.28;
  const pantsL = mesh(new THREE.BoxGeometry(0.17, 0.58, 0.18), bottomMat);
  const pantsR = mesh(new THREE.BoxGeometry(0.17, 0.58, 0.18), bottomMat);
  pantsL.position.y = -0.28;
  pantsR.position.y = -0.28;
  const shoeL = mesh(new THREE.BoxGeometry(0.18, 0.1, 0.28), shoeMat);
  const shoeR = mesh(new THREE.BoxGeometry(0.18, 0.1, 0.28), shoeMat);
  shoeL.position.set(0, -0.56, -0.04);
  shoeR.position.set(0, -0.56, -0.04);
  legL.add(calfL, pantsL, shoeL);
  legR.add(calfR, pantsR, shoeR);
  model.add(legL, legR);

  const torso = mesh(new THREE.BoxGeometry(0.46, 0.5, 0.26), topMat);
  torso.position.y = 1.08;
  model.add(torso);

  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(0.32, 1.26, 0);
  armR.position.set(-0.32, 1.26, 0);
  const sleeveL = mesh(new THREE.BoxGeometry(0.13, 0.46, 0.13), sleeveMat);
  const sleeveR = mesh(new THREE.BoxGeometry(0.13, 0.46, 0.13), sleeveMat);
  sleeveL.position.y = -0.2;
  sleeveR.position.y = -0.2;
  const handL = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skinMat);
  const handR = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skinMat);
  handL.position.y = -0.46;
  handR.position.y = -0.46;
  armL.add(sleeveL, handL);
  armR.add(sleeveR, handR);
  model.add(armL, armR);

  const headPivot = new THREE.Group();
  headPivot.position.y = 1.52;
  const head = mesh(new THREE.SphereGeometry(0.23, 10, 8), skinMat);
  headPivot.add(head);
  const eyeL = mesh(new THREE.SphereGeometry(0.035, 6, 5), dark);
  const eyeR = mesh(new THREE.SphereGeometry(0.035, 6, 5), dark);
  eyeL.position.set(0.08, 0.03, -0.18);
  eyeR.position.set(-0.08, 0.03, -0.18);
  const mouth = mesh(new THREE.BoxGeometry(0.08, 0.025, 0.02), dark);
  mouth.position.set(0, -0.08, -0.2);
  headPivot.add(eyeL, eyeR, mouth);

  const hairs = [0, 1, 2, 3, 4, 5, 6].map((kind) => {
    const h = new THREE.Group();
    if (kind === 0) {
      const cap = mesh(new THREE.SphereGeometry(0.24, 8, 6), hairMat);
      cap.scale.set(1, 0.55, 1);
      cap.position.y = 0.12;
      h.add(cap);
    } else if (kind === 1) {
      const bob = mesh(new THREE.SphereGeometry(0.26, 8, 6), hairMat);
      bob.scale.set(1.02, 0.85, 1.05);
      bob.position.y = 0.04;
      h.add(bob);
    } else if (kind === 2) {
      const base = mesh(new THREE.SphereGeometry(0.24, 8, 6), hairMat);
      base.scale.set(1, 0.5, 1);
      base.position.y = 0.12;
      const bun = mesh(new THREE.SphereGeometry(0.1, 7, 6), hairMat);
      bun.position.y = 0.28;
      h.add(base, bun);
    } else if (kind === 3) {
      for (const x of [-0.1, 0, 0.1]) {
        const spike = mesh(new THREE.ConeGeometry(0.06, 0.22, 4), hairMat);
        spike.position.set(x, 0.28, -0.02);
        h.add(spike);
      }
    } else if (kind === 4) {
      const long = mesh(new THREE.BoxGeometry(0.36, 0.55, 0.28), hairMat);
      long.position.set(0, -0.02, 0.06);
      h.add(long);
    } else if (kind === 5) {
      const brim = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 10), hairMat);
      brim.position.y = 0.16;
      const crown = mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.16, 8), hairMat);
      crown.position.y = 0.26;
      h.add(brim, crown);
    } else {
      const tuft = mesh(new THREE.ConeGeometry(0.08, 0.16, 4), hairMat);
      tuft.position.set(0.06, 0.24, -0.04);
      tuft.rotation.z = -0.4;
      h.add(tuft);
    }
    h.visible = false;
    headPivot.add(h);
    return h;
  });

  const glasses = new THREE.Group();
  for (const x of [0.08, -0.08]) {
    const ring = mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 10), dark);
    ring.position.set(x, 0.03, -0.2);
    glasses.add(ring);
  }
  const bridge = mesh(new THREE.BoxGeometry(0.06, 0.015, 0.015), dark);
  bridge.position.set(0, 0.03, -0.2);
  glasses.add(bridge);
  glasses.visible = false;
  headPivot.add(glasses);

  const beard = mesh(new THREE.SphereGeometry(0.1, 7, 6), toonUnique('#f7f4ee'));
  beard.scale.set(1, 0.7, 0.6);
  beard.position.set(0, -0.14, -0.1);
  beard.visible = false;
  headPivot.add(beard);
  model.add(headPivot);

  const bag = mesh(new THREE.BoxGeometry(0.32, 0.36, 0.12), bagMat);
  bag.position.set(0, 1.05, 0.2);
  const flap = mesh(new THREE.BoxGeometry(0.3, 0.1, 0.04), toonUnique('#e4e0d6'));
  flap.position.set(0, 1.2, 0.26);
  const parcel = mesh(new THREE.BoxGeometry(0.16, 0.12, 0.12), toonUnique('#f3c258'));
  parcel.position.set(0.02, 1.28, 0.22);
  parcel.visible = false;
  model.add(bag, flap, parcel);

  const lute = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(0.28, 0.34, 0.08), toonUnique('#e2b143'));
  const neck = mesh(new THREE.BoxGeometry(0.05, 0.42, 0.04), toonUnique('#8d6a45'));
  neck.position.y = 0.34;
  lute.add(body, neck);
  lute.position.set(0.05, 0.95, -0.22);
  lute.visible = false;
  model.add(lute);

  const state = {
    phase: Math.random() * 6,
    blink: 2 + Math.random() * 3,
    talking: false,
    wet: 0,
    shoeWet: 0,
    sit: !!look.sit,
    outfit: { ...look },
    bases: {},
  };

  function paint() {
    const o = state.outfit;
    const top = TOP_STYLES[o.top % TOP_STYLES.length];
    const bottom = BOTTOM_STYLES[o.bottom % BOTTOM_STYLES.length];
    const shoe = SHOE_STYLES[o.shoes % SHOE_STYLES.length];
    const skin = SKINS[o.skin % SKINS.length];
    const ink = o.hair === 6 ? '#d8d2c6' : '#2c3336';
    skinMat.color.set(skin);
    topMat.color.set(top.color);
    sleeveMat.color.set(top.color);
    bottomMat.color.set(bottom.color);
    shoeMat.color.set(shoe.color);
    hairMat.color.set(ink);
    hairs.forEach((h, i) => { h.visible = i === o.hair % hairs.length; });
    glasses.visible = !!o.glasses;
    beard.visible = !!o.beard;
    lute.visible = !!o.lute;
    const len = 0.5 + bottom.length * 0.6;
    pantsL.scale.y = len;
    pantsR.scale.y = len;
    pantsL.position.y = -0.02 - 0.29 * len;
    pantsR.position.y = -0.02 - 0.29 * len;
    sleeveL.scale.y = 0.7 + top.sleeve;
    sleeveR.scale.y = 0.7 + top.sleeve;
    state.bases = {
      top: top.color,
      sleeve: top.color,
      bottom: bottom.color,
      shoe: shoe.color,
    };
    applyWet();
  }

  function applyWet() {
    const w = state.wet;
    const damp = (mat, hex, amount) => {
      mat.color.set(hex);
      if (amount > 0) mat.color.lerp(new THREE.Color('#3a4650'), amount);
    };
    damp(bottomMat, state.bases.bottom, Math.min(1, w));
    damp(shoeMat, state.bases.shoe, Math.min(1, state.shoeWet));
    damp(topMat, state.bases.top, Math.min(0.55, w * 0.45));
    damp(sleeveMat, state.bases.sleeve, Math.min(0.55, w * 0.45));
  }

  paint();

  return {
    group,
    head: headPivot,
    update(dt, speed, reduce) {
      state.phase += dt * (1.6 + speed * 1.5);
      const amp = reduce ? 0 : Math.min(1, speed / 4.2);
      if (state.sit) {
        legL.rotation.x = -1.2;
        legR.rotation.x = -1.2;
        model.position.y = -0.34;
        armL.rotation.x = 0.2;
        armR.rotation.x = 0.15;
      } else {
        legL.rotation.x = Math.sin(state.phase) * 0.75 * amp;
        legR.rotation.x = Math.sin(state.phase + Math.PI) * 0.75 * amp;
        armL.rotation.x = Math.sin(state.phase + Math.PI) * 0.65 * amp;
        armR.rotation.x = Math.sin(state.phase) * 0.65 * amp;
        model.position.y = Math.abs(Math.sin(state.phase)) * 0.045 * amp;
      }
      if (state.outfit.lute) {
        armL.rotation.x = -0.7 + Math.sin(state.phase * 2.4) * 0.18;
      }
      state.blink -= dt;
      const shut = state.blink < 0.12;
      const s = shut ? 0.12 : 1;
      eyeL.scale.y = s;
      eyeR.scale.y = s;
      if (state.blink < 0) state.blink = 2.2 + Math.random() * 3.4;
      mouth.scale.y = state.talking ? 0.5 + Math.random() * 2.4 : 1;
    },
    setOutfit(o) {
      state.outfit = { ...state.outfit, ...o };
      state.sit = !!state.outfit.sit;
      paint();
    },
    setWet(target, dt) {
      const rise = 1 - Math.exp(-dt * 1.6);
      const cloth = target > state.wet ? rise : 1 - Math.exp(-dt * 0.28);
      const shoes = target > 0.5 ? rise : 1 - Math.exp(-dt * 0.1);
      state.wet += (target - state.wet) * cloth;
      state.shoeWet += ((target > 0.5 ? 1 : 0) - state.shoeWet) * shoes;
      applyWet();
    },
    setTalking(on) { state.talking = on; },
    setParcel(color) {
      parcel.visible = !!color;
      if (color) parcel.material.color.set(color);
    },
    get outfit() { return { ...state.outfit }; },
  };
}
