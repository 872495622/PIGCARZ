// Stylized courier. The face looks down local -Z. Feet rest on y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
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

const geos = new Map();

function capsule(radius, length, cap = 4, rad = 10) {
  const key = `c${radius}_${length}_${cap}_${rad}`;
  if (!geos.has(key)) geos.set(key, new THREE.CapsuleGeometry(radius, length, cap, rad));
  return geos.get(key);
}

function sphere(radius, w = 14, h = 10) {
  const key = `s${radius}_${w}_${h}`;
  if (!geos.has(key)) geos.set(key, new THREE.SphereGeometry(radius, w, h));
  return geos.get(key);
}

function box(w, h, d, r = 0.04, seg = 3) {
  const radius = Math.max(0.001, Math.min(r, w * 0.5 - 0.001, h * 0.5 - 0.001, d * 0.5 - 0.001));
  const key = `b${w}_${h}_${d}_${radius}_${seg}`;
  if (!geos.has(key)) geos.set(key, new RoundedBoxGeometry(w, h, d, seg, radius));
  return geos.get(key);
}

function cone(r, h, seg = 7) {
  const key = `n${r}_${h}_${seg}`;
  if (!geos.has(key)) geos.set(key, new THREE.ConeGeometry(r, h, seg));
  return geos.get(key);
}

function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

function hang(radius, length, mat) {
  const m = mesh(capsule(radius, length), mat);
  const half = radius + length / 2;
  m.position.y = -half;
  m.userData.half = half;
  return m;
}

function setHang(m, scaleY, overlap = 0) {
  const s = Math.max(0.2, scaleY);
  m.scale.y = s;
  m.position.y = -m.userData.half * s + overlap;
}

let shared = null;
function stock() {
  if (shared) return shared;
  shared = {
    eye: toonUnique('#fbfaf6'),
    pupil: toonUnique('#241c18'),
    catch: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    mouth: toonUnique('#7a403c'),
    cavity: toonUnique('#4a2a28'),
    blush: toonUnique('#efb0a2'),
    beard: toonUnique('#f4efe6'),
    bag: toonUnique('#f4efe4'),
    flap: toonUnique('#e4d8c4'),
    lute: toonUnique('#e2b143'),
    luteNeck: toonUnique('#8d6a45'),
    dark: toonUnique('#2c3336'),
    belt: toonUnique('#2a3134'),
    cushion: toonUnique('#6e8f72'),
    string: toonUnique('#f7f4ee'),
  };
  return shared;
}

function hairOf(kind, mat) {
  const h = new THREE.Group();
  const add = (geo, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const m = mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    h.add(m);
    return m;
  };
  if (kind === 0) {
    add(sphere(0.23), 0, 0.14, 0.04, 1.05, 0.46, 1.02);
    add(box(0.22, 0.05, 0.08, 0.02), 0, 0.15, -0.12).rotation.x = -0.4;
  } else if (kind === 1) {
    add(sphere(0.24), 0, 0.13, 0.06, 1.06, 0.5, 1);
    add(sphere(0.22), 0, -0.12, 0.1, 1.12, 1.05, 0.68);
    add(capsule(0.048, 0.16), 0.18, -0.08, 0.08);
    add(capsule(0.048, 0.16), -0.18, -0.08, 0.08);
    add(box(0.22, 0.05, 0.08, 0.02), 0, 0.15, -0.13).rotation.x = -0.55;
  } else if (kind === 2) {
    add(sphere(0.22), 0, 0.14, 0.05, 1.02, 0.42, 1);
    add(sphere(0.09), 0, 0.32, 0.06);
    add(box(0.16, 0.045, 0.07, 0.02), 0, 0.16, -0.12).rotation.x = -0.4;
  } else if (kind === 3) {
    add(sphere(0.21), 0, 0.14, 0.04, 1.02, 0.4, 1);
    [[-0.1, 0.04], [-0.035, 0.02], [0.035, 0.03], [0.1, 0.02]].forEach(([x, z], i) => {
      const spike = add(cone(0.05, 0.2 + (i % 2) * 0.05), x, 0.3, z);
      spike.rotation.z = -x * 1.2;
    });
  } else if (kind === 4) {
    add(sphere(0.22), 0, 0.14, 0.05, 1.04, 0.42, 1);
    add(box(0.36, 0.52, 0.18, 0.1, 4), 0, -0.08, 0.12);
    add(capsule(0.05, 0.36), 0.17, -0.22, 0.08);
    add(capsule(0.05, 0.36), -0.17, -0.22, 0.08);
    add(box(0.2, 0.05, 0.07, 0.02), 0, 0.15, -0.13).rotation.x = -0.45;
  } else if (kind === 5) {
    add(sphere(0.19), 0, 0.2, 0.04, 1.02, 0.55, 1.02);
    const brim = add(new THREE.CylinderGeometry(0.28, 0.3, 0.04, 18), 0, 0.14, -0.02);
    brim.rotation.x = 0.12;
    add(box(0.16, 0.04, 0.06, 0.015), 0, 0.1, -0.12);
  } else {
    add(sphere(0.1), 0.15, 0.02, 0.02, 0.9, 0.7, 0.8);
    add(sphere(0.1), -0.15, 0.02, 0.02, 0.9, 0.7, 0.8);
    add(sphere(0.14), 0, 0.0, 0.12, 1.3, 0.55, 0.7);
    const tuft = add(cone(0.05, 0.16), 0.04, 0.26, -0.02);
    tuft.rotation.z = -0.45;
  }
  return h;
}

function makeEye(x, skin, C) {
  const g = new THREE.Group();
  g.position.set(x, 0.03, -0.205);
  const white = mesh(sphere(0.042, 12, 8), C.eye);
  white.scale.set(1, 1, 0.4);
  const pupil = mesh(sphere(0.02, 10, 8), C.pupil);
  pupil.position.set(0, -0.002, -0.018);
  pupil.scale.set(1, 1, 0.45);
  const glint = mesh(sphere(0.008, 6, 4), C.catch);
  glint.position.set(0.012, 0.012, -0.026);
  const lid = mesh(sphere(0.044, 10, 8), skin);
  lid.scale.set(1.02, 0.28, 0.32);
  lid.position.set(0, 0.03, -0.002);
  g.add(white, pupil, glint, lid);
  return g;
}

export function createPerson(options = {}) {
  const look = { ...randomOutfit(), ...(options.look || {}) };
  const C = stock();
  const group = new THREE.Group();
  group.name = 'person';
  const model = new THREE.Group();
  group.add(model);

  const skinMat = toonUnique(SKINS[look.skin] || SKINS[0]);
  const topMat = toonUnique(TOP_STYLES[0].color);
  const sleeveMat = toonUnique(TOP_STYLES[0].color);
  const bottomMat = toonUnique(BOTTOM_STYLES[0].color);
  const shoeMat = toonUnique(SHOE_STYLES[0].color);
  const soleMat = toonUnique('#2c3336');
  const hairMat = toonUnique('#2c3336');
  const pocketMat = toonUnique('#c25959');
  const parcelMat = toonUnique('#f3c258');

  const torso = new THREE.Group();
  model.add(torso);

  const pelvis = mesh(sphere(0.15), bottomMat);
  pelvis.scale.set(1.2, 0.72, 0.95);
  pelvis.position.y = 0.8;
  model.add(pelvis);

  const chest = mesh(capsule(0.15, 0.28, 5, 12), topMat);
  chest.scale.set(1.34, 1, 0.92);
  chest.position.y = 1.12;
  const yoke = mesh(capsule(0.09, 0.32, 4, 10), topMat);
  yoke.rotation.z = Math.PI / 2;
  yoke.scale.set(1, 0.85, 0.8);
  yoke.position.y = 1.26;
  const collar = mesh(box(0.2, 0.07, 0.16, 0.025), topMat);
  collar.position.set(0, 1.3, -0.02);
  const pocket = mesh(box(0.09, 0.08, 0.025, 0.015), pocketMat);
  pocket.position.set(-0.08, 1.06, -0.145);
  const belt = mesh(box(0.38, 0.055, 0.24, 0.02), C.belt);
  belt.position.y = 0.9;
  torso.add(chest, yoke, collar, pocket, belt);

  const neck = mesh(capsule(0.055, 0.06, 3, 8), skinMat);
  neck.position.y = 1.4;
  torso.add(neck);

  function buildLeg(side) {
    const leg = new THREE.Group();
    leg.position.set(0.1 * side, 0.72, 0);
    const thighSkin = hang(0.072, 0.26, skinMat);
    thighSkin.position.y += 0.04;
    const thighCloth = hang(0.096, 0.24, bottomMat);
    const knee = new THREE.Group();
    knee.position.y = -0.34;
    const kneeCap = mesh(sphere(0.078, 10, 8), skinMat);
    kneeCap.scale.set(1.05, 0.82, 1);
    const shinSkin = hang(0.06, 0.24, skinMat);
    shinSkin.position.y += 0.08;
    const shinCloth = hang(0.086, 0.22, bottomMat);
    shinCloth.position.y += 0.08;
    const shoe = mesh(box(0.16, 0.11, 0.26, 0.04), shoeMat);
    shoe.position.set(0, -0.24, -0.04);
    const sole = mesh(box(0.17, 0.04, 0.28, 0.016), soleMat);
    sole.position.set(0, -0.32, -0.045);
    knee.add(kneeCap, shinSkin, shinCloth, shoe, sole);
    leg.add(thighSkin, thighCloth, knee);
    model.add(leg);
    return { leg, knee, thighCloth, shinCloth, kneeCap };
  }

  function buildArm(side) {
    const arm = new THREE.Group();
    arm.userData.side = side;
    arm.position.set(0.22 * side, 1.26, 0);
    const shoulder = mesh(sphere(0.085, 10, 8), sleeveMat);
    shoulder.scale.set(1, 0.85, 0.9);
    const upperSkin = hang(0.046, 0.18, skinMat);
    upperSkin.position.y += 0.05;
    const upperCloth = hang(0.064, 0.16, sleeveMat);
    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    const elbowCap = mesh(sphere(0.055, 8, 6), sleeveMat);
    const foreSkin = hang(0.04, 0.15, skinMat);
    foreSkin.position.y += 0.05;
    const foreCloth = hang(0.054, 0.13, sleeveMat);
    const hand = mesh(box(0.09, 0.1, 0.07, 0.03), skinMat);
    hand.position.set(0, -0.24, -0.015);
    const thumb = mesh(sphere(0.028, 8, 6), skinMat);
    thumb.position.set(-0.048 * side, -0.2, -0.02);
    elbow.add(elbowCap, foreSkin, foreCloth, hand, thumb);
    arm.add(shoulder, upperSkin, upperCloth, elbow);
    torso.add(arm);
    return { arm, elbow, upperCloth, foreCloth, hand };
  }

  const legL = buildLeg(1);
  const legR = buildLeg(-1);
  const armL = buildArm(1);
  const armR = buildArm(-1);

  const headPivot = new THREE.Group();
  headPivot.position.y = 1.5;
  torso.add(headPivot);
  const skull = new THREE.Group();
  skull.position.y = 0.08;
  headPivot.add(skull);
  const head = mesh(sphere(0.22, 18, 14), skinMat);
  head.scale.set(1.02, 1.06, 0.96);
  skull.add(head);

  const ears = new THREE.Group();
  for (const x of [1, -1]) {
    const ear = mesh(sphere(0.055, 8, 6), skinMat);
    ear.scale.set(0.45, 0.85, 0.62);
    ear.position.set(0.21 * x, -0.02, 0.02);
    ears.add(ear);
  }
  skull.add(ears);

  const eyeL = makeEye(0.078, skinMat, C);
  const eyeR = makeEye(-0.078, skinMat, C);
  skull.add(eyeL, eyeR);

  const browL = mesh(box(0.07, 0.018, 0.02, 0.008), hairMat);
  browL.position.set(0.08, 0.095, -0.2);
  browL.rotation.z = -0.3;
  const browR = mesh(box(0.07, 0.018, 0.02, 0.008), hairMat);
  browR.position.set(-0.08, 0.095, -0.2);
  browR.rotation.z = 0.3;
  const nose = mesh(sphere(0.034, 8, 6), skinMat);
  nose.scale.set(0.7, 0.55, 0.65);
  nose.position.set(0, -0.015, -0.205);
  skull.add(browL, browR, nose);

  for (const x of [1, -1]) {
    const blush = mesh(sphere(0.04, 8, 6), C.blush);
    blush.scale.set(1.1, 0.65, 0.35);
    blush.position.set(0.12 * x, -0.045, -0.19);
    skull.add(blush);
  }

  const mouth = new THREE.Group();
  mouth.position.set(0, -0.09, -0.205);
  const smile = mesh(new THREE.TorusGeometry(0.038, 0.01, 6, 12, Math.PI), C.mouth);
  smile.rotation.z = Math.PI;
  const cavity = mesh(box(0.06, 0.04, 0.02, 0.012), C.cavity);
  cavity.position.set(0, -0.01, 0.01);
  cavity.scale.y = 0.25;
  mouth.add(smile, cavity);
  skull.add(mouth);

  const hairs = [0, 1, 2, 3, 4, 5, 6].map((kind) => {
    const h = hairOf(kind, hairMat);
    h.visible = false;
    skull.add(h);
    return h;
  });

  const glasses = new THREE.Group();
  for (const x of [0.078, -0.078]) {
    const ring = mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 16), C.dark);
    ring.position.set(x, 0.032, -0.228);
    glasses.add(ring);
  }
  const bridge = mesh(box(0.04, 0.01, 0.01, 0.004), C.dark);
  bridge.position.set(0, 0.032, -0.228);
  const templeL = mesh(box(0.01, 0.01, 0.14, 0.004), C.dark);
  templeL.position.set(0.145, 0.04, -0.14);
  const templeR = mesh(box(0.01, 0.01, 0.14, 0.004), C.dark);
  templeR.position.set(-0.145, 0.04, -0.14);
  glasses.add(bridge, templeL, templeR);
  glasses.visible = false;
  skull.add(glasses);

  const beard = new THREE.Group();
  const chin = mesh(sphere(0.075, 10, 8), C.beard);
  chin.scale.set(1.05, 0.85, 0.6);
  chin.position.set(0, -0.155, -0.08);
  const mustache = mesh(sphere(0.045, 8, 6), C.beard);
  mustache.scale.set(1.7, 0.42, 0.55);
  mustache.position.set(0, -0.055, -0.2);
  beard.add(chin, mustache);
  beard.visible = false;
  skull.add(beard);

  const satchel = new THREE.Group();
  const bagBody = mesh(box(0.26, 0.3, 0.11, 0.05), C.bag);
  const flap = mesh(box(0.24, 0.12, 0.04, 0.02), C.flap);
  flap.position.set(0, 0.1, 0.02);
  flap.rotation.x = 0.55;
    const strap = mesh(box(0.04, 0.2, 0.035, 0.012), C.bag);
    strap.position.set(0.11, 0.1, -0.05);
    strap.rotation.z = -0.45;
    strap.rotation.x = -0.2;
  satchel.add(bagBody, flap, strap);
  satchel.position.set(0.02, 1.02, 0.16);
  model.add(satchel);

  const parcel = new THREE.Group();
  const parcelBox = mesh(box(0.13, 0.1, 0.11, 0.02), parcelMat);
  const stringA = mesh(box(0.14, 0.012, 0.012, 0.004), C.string);
  const stringB = mesh(box(0.012, 0.012, 0.12, 0.004), C.string);
  parcel.add(parcelBox, stringA, stringB);
  parcel.position.set(0, -0.01, -0.07);
  parcel.visible = false;
  armL.hand.add(parcel);

  const lute = new THREE.Group();
  const luteBody = mesh(sphere(0.15, 12, 10), C.lute);
  luteBody.scale.set(1.05, 1.35, 0.42);
  const hole = mesh(sphere(0.04, 8, 6), C.dark);
  hole.position.set(0, 0.02, -0.065);
  hole.scale.set(1, 1, 0.3);
  const luteNeck = mesh(box(0.04, 0.42, 0.03, 0.012), C.luteNeck);
  luteNeck.position.y = 0.34;
  const peg = mesh(sphere(0.038, 8, 6), C.luteNeck);
  peg.scale.set(1.1, 0.7, 0.6);
  peg.position.y = 0.56;
  lute.add(luteBody, hole, luteNeck, peg);
  lute.position.set(0.0, 1.02, -0.22);
  lute.rotation.set(0.2, -0.15, -0.7);
  lute.visible = false;
  torso.add(lute);

  const cushion = mesh(box(0.5, 0.07, 0.36, 0.03), C.cushion);
  cushion.position.set(0, 0.66, 0.02);
  cushion.visible = false;
  model.add(cushion);

  const state = {
    phase: Math.random() * 6,
    blink: 2 + Math.random() * 3,
    talking: false,
    wet: 0,
    shoeWet: 0,
    sit: !!look.sit,
    outfit: { ...look },
    bases: { top: '#ffffff', sleeve: '#ffffff', bottom: '#ffffff', shoe: '#ffffff', sole: '#333333', pocket: '#cccccc' },
  };
  const scratch = new THREE.Color();
  const wetTint = new THREE.Color('#3a4650');

  function damp(mat, hex, amount) {
    scratch.set(hex);
    if (amount > 0) scratch.lerp(wetTint, amount);
    mat.color.copy(scratch);
  }

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
    scratch.set(top.color).multiplyScalar(0.82);
    pocketMat.color.copy(scratch);
    scratch.set(shoe.color).multiplyScalar(0.55);
    const soleHex = `#${scratch.getHexString()}`;
    soleMat.color.set(soleHex);
    state.bases = {
      top: top.color,
      sleeve: top.color,
      bottom: bottom.color,
      shoe: shoe.color,
      sole: soleHex,
      pocket: `#${pocketMat.color.getHexString()}`,
    };
    hairs.forEach((h, i) => { h.visible = i === (o.hair % hairs.length); });
    ears.visible = o.hair !== 1 && o.hair !== 4;
    glasses.visible = !!o.glasses;
    beard.visible = !!o.beard;
    lute.visible = !!o.lute;
    cushion.visible = !!o.sit;
    state.sit = !!o.sit;

    const cover = THREE.MathUtils.clamp((bottom.length - 0.4) / 0.46, 0, 1);
    setHang(legL.thighCloth, 1.05 + cover * 0.12, 0.08);
    setHang(legR.thighCloth, 1.05 + cover * 0.12, 0.08);
    const long = cover > 0.45;
    legL.kneeCap.material = long ? bottomMat : skinMat;
    legR.kneeCap.material = long ? bottomMat : skinMat;
    legL.shinCloth.visible = long;
    legR.shinCloth.visible = long;
    if (long) {
      setHang(legL.shinCloth, 0.7 + cover * 0.55, 0.06);
      setHang(legR.shinCloth, 0.7 + cover * 0.55, 0.06);
    }
    const sleeve = 0.62 + top.sleeve * 1.1;
    setHang(armL.upperCloth, sleeve, 0.05);
    setHang(armR.upperCloth, sleeve, 0.05);
    const longSleeve = top.sleeve > 0.4;
    armL.foreCloth.visible = longSleeve;
    armR.foreCloth.visible = longSleeve;
    if (longSleeve) {
      setHang(armL.foreCloth, 0.75 + top.sleeve, 0.05);
      setHang(armR.foreCloth, 0.75 + top.sleeve, 0.05);
    }
    applyWet();
  }

  function applyWet() {
    const w = state.wet;
    damp(bottomMat, state.bases.bottom, Math.min(1, w));
    damp(shoeMat, state.bases.shoe, Math.min(1, state.shoeWet));
    damp(soleMat, state.bases.sole, Math.min(1, state.shoeWet));
    damp(topMat, state.bases.top, Math.min(0.55, w * 0.45));
    damp(sleeveMat, state.bases.sleeve, Math.min(0.55, w * 0.45));
    damp(pocketMat, state.bases.pocket, Math.min(0.55, w * 0.45));
  }

  function poseLeg(part, swing, amp) {
    part.leg.rotation.set(-swing * 0.62 * amp, 0, part.leg.position.x > 0 ? 0.04 : -0.04);
    const plant = Math.max(0, -swing);
    const pass = Math.max(0, swing);
    part.knee.rotation.set(-0.06 - amp * (plant * 1.2 + pass * 0.18), 0, 0);
  }

  function poseArm(part, swing, amp, idle) {
    const side = part.arm.userData.side;
    part.arm.rotation.set(swing * 0.55 * amp, 0, side * (0.14 + idle * 0.05));
    part.elbow.rotation.set(-0.22 - idle * 0.06 - amp * 0.05, 0, 0);
  }

  paint();

  return {
    group,
    head: headPivot,
    update(dt, speed, reduce) {
      state.phase += dt * (1.7 + speed * 1.35);
      const amp = reduce ? 0 : Math.min(1, speed / 4.2);
      const idle = reduce ? 0 : 1 - amp;
      if (state.sit) {
        legL.leg.rotation.set(-1.4, 0.2, 0.15);
        legR.leg.rotation.set(-1.4, -0.2, -0.15);
        legL.knee.rotation.set(-2.15, 0, 0);
        legR.knee.rotation.set(-2.15, 0, 0);
        armL.arm.rotation.set(-0.15, 0, 0.22);
        armR.arm.rotation.set(-0.15, 0, -0.22);
        armL.elbow.rotation.set(-0.7, 0, 0);
        armR.elbow.rotation.set(-0.7, 0, 0);
        torso.rotation.set(0.08, 0, 0);
        headPivot.rotation.set(-0.06, 0, 0);
        model.position.y = -0.6;
        cushion.visible = true;
      } else {
        const s = Math.sin(state.phase);
        poseLeg(legL, s, amp);
        poseLeg(legR, -s, amp);
        poseArm(armL, -s, amp, idle);
        poseArm(armR, s, amp, idle);
        const step = Math.abs(Math.sin(state.phase));
        const breath = Math.sin(state.phase * 1.4) * 0.012 * idle;
        model.position.y = step * 0.035 * amp + breath;
        torso.rotation.set(amp * 0.04, -s * 0.1 * amp, 0);
        headPivot.rotation.set(0.03 + breath, s * 0.08 * amp, s * 0.03 * amp);
        cushion.visible = false;
        if (state.outfit.lute) {
          armR.arm.rotation.set(-1.15, -0.15, 0.4);
          armR.elbow.rotation.set(-0.95, 0, 0);
          armL.arm.rotation.set(-0.75, -0.55, 0.35);
          armL.elbow.rotation.set(-0.55 + Math.sin(state.phase * 7) * (reduce ? 0 : 0.14), 0, 0);
        } else if (parcel.visible) {
          armL.arm.rotation.set(-0.5, 0, 0.18);
          armL.elbow.rotation.set(-1.05, 0, 0);
        }
      }
      chest.scale.set(1.34, 1 + Math.sin(state.phase * 1.5) * 0.012 * (reduce ? 0 : 1), 0.92);
      state.blink -= dt;
      const shut = state.blink < 0.1;
      const s = shut ? 0.08 : 1;
      eyeL.scale.y = s;
      eyeR.scale.y = s;
      if (state.blink < 0) state.blink = 2.4 + Math.random() * 3.2;
      const open = state.talking ? 0.45 + Math.sin(state.phase * 14) * 0.35 : 0;
      smile.scale.y = 1 - open * 0.65;
      cavity.scale.y = 0.2 + open * 1.6;
    },
    setOutfit(o) {
      state.outfit = { ...state.outfit, ...o };
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
      if (color) parcelMat.color.set(color);
    },
    get outfit() { return { ...state.outfit }; },
  };
}
