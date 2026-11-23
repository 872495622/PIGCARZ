/** Art-directed placement. Numbers in, descriptors out. No renderer. */

import {
  PLAYER_R,
  arcMeters,
  blocked,
  moveMeters,
  pathDistance,
  relief,
  spotDir,
  SEA,
} from './planet.js';

const HOUSE_WALLS = ['#d9d3c3', '#cfc6b4', '#e4d8c8', '#d7d0c2', '#e6d5c4'];
const HOUSE_ROOFS = ['#8d9a8a', '#7f8f96', '#a3a089', '#6e7c84', '#9aa392'];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function reserve(list, lat, lon, radius) {
  list.push({ lat, lon, radius, height: 0, ghost: true });
}

export function buildLayout() {
  const rand = rng(23);
  const props = [];
  const colliders = [];
  const npcs = [];

  const addNpc = (id, lat, lon, extra = {}) => {
    npcs.push({ id, lat, lon, ...extra });
    reserve(colliders, lat, lon, 1.7);
  };

  const P = (id) => spotDir(id);

  const ward = P('ward');
  const square = P('square');
  const span = P('span');
  const clay = P('clay');
  const beach = P('beach');
  const works = P('works');
  const grove = P('grove');
  const stones = P('stones');
  const temple = P('temple');
  const falls = P('falls');
  const far = P('far');

  const spawn = moveMeters(ward.lat, ward.lon, -2.2, -3.4);

  addNpc('nia', ...xy(moveMeters(square.lat, square.lon, 6.2, -1.2)));
  addNpc('lila', ...xy(moveMeters(square.lat, square.lon, -1.2, 4.5)));
  addNpc('vendor', ...xy(moveMeters(square.lat, square.lon, -5.5, -3.2)));
  addNpc('ren', ...xy(moveMeters(clay.lat, clay.lon, 3.2, 2.4)));
  addNpc('student', ...xy(moveMeters(span.lat, span.lon, 1.2, 2.6)));
  addNpc('rao', ...xy(moveMeters(beach.lat, beach.lon, -4.5, 2.2)));
  addNpc('bo', ...xy(moveMeters(works.lat, works.lon, 2.4, 5.2)));
  addNpc('jin', ...xy(moveMeters(works.lat, works.lon, -1.5, -8.4)));
  addNpc('watch', ...xy(moveMeters(works.lat, works.lon, 7.2, -2.2)));
  addNpc('moss', ...xy(moveMeters(grove.lat, grove.lon, 2.8, 1.6)));
  addNpc('plum', ...xy(moveMeters(stones.lat, stones.lon, 2.2, -2.4)));
  addNpc('jun', ...xy(moveMeters(temple.lat, temple.lon, -2.5, -14.5)));
  addNpc('calm', ...xy(moveMeters(temple.lat, temple.lon, 0.4, 1.2)), { sit: true });
  addNpc('soren', ...xy(moveMeters(falls.lat, falls.lon, 1.4, -6.2)), { lute: true });
  addNpc('nova', ...xy(moveMeters(far.lat, far.lon, 2.5, 1.2)), { scope: true });

  // Landmarks that own their ground.
  prop(props, colliders, 'kettle', square.lat, square.lon, 0.4, { rot: 0.15 });
  prop(props, colliders, 'stall', ...xy(moveMeters(square.lat, square.lon, -1.6, 7.8)), { rot: -0.4 });
  prop(props, colliders, 'vending', ...xy(moveMeters(square.lat, square.lon, 8.4, 3.6)), { rot: 1.1 });
  prop(props, colliders, 'mailbox', ...xy(moveMeters(square.lat, square.lon, 4.2, 4.4)), { rot: 0.2 });
  prop(props, colliders, 'boat', ...xy(moveMeters(beach.lat, beach.lon, 3.5, -1.2)), { rot: 0.6 });
  prop(props, colliders, 'cup', ...xy(moveMeters(beach.lat, beach.lon, -2.2, -5.5)), { rot: 0.2 });
  prop(props, colliders, 'factory', works.lat, works.lon, 0, { rot: 0.3 });
  prop(props, colliders, 'cave', ...xy(moveMeters(grove.lat, grove.lon, -1.2, -1.4)), { rot: 0.8 });
  prop(props, colliders, 'gate', ...xy(moveMeters(temple.lat, temple.lon, 0, -4.6)), { rot: 0.5 });
  prop(props, colliders, 'falls', falls.lat, falls.lon, 0, { rot: -1.2 });
  prop(props, colliders, 'paperTree', ...xy(moveMeters(grove.lat, grove.lon, 6.5, 3.2)), {});
  prop(props, colliders, 'scope', ...xy(moveMeters(far.lat, far.lon, -1.4, 2.4)), { rot: 1 });

  scatterHouses(props, colliders, rand, ward, 8, 7.5, 16);
  scatterHouses(props, colliders, rand, square, 7, 13, 20);
  scatterHouses(props, colliders, rand, span, 3, 8, 14);
  // The clay-red house is the landmark, plus two neighbors.
  prop(props, colliders, 'house', clay.lat, clay.lon, 0, {
    rot: 0.4,
    w: 4.4,
    d: 3.6,
    h: 3.4,
    wall: '#b85a4a',
    roof: '#6e7c84',
    floors: 2,
    towel: true,
    hero: true,
  });
  scatterHouses(props, colliders, rand, moveMeters(clay.lat, clay.lon, 8, -6), 2, 4, 8);
  scatterHouses(props, colliders, rand, beach, 2, 9, 12, { hut: true });
  scatterHouses(props, colliders, rand, far, 1, 8, 8, { ruin: true });

  polesAlong(props, colliders, ward, square, 6);
  cones(props, colliders, moveMeters(square.lat, square.lon, -8.5, -1), 4);

  graveyard(props, colliders, stones);
  reeds(props, falls);
  groveTrees(props, colliders, rand, grove, 16);
  scatterTrees(props, colliders, rand, 22);
  rocks(props, colliders, rand, falls, 7, 2.2);
  rocks(props, colliders, rand, temple, 5, 1.4);
  rocks(props, colliders, rand, far, 6, 1.6);
  flowers(props, moveMeters(square.lat, square.lon, -1.2, 5.6), 10);
  flowers(props, grove, 8);
  crates(props, colliders, moveMeters(works.lat, works.lon, -5.5, 2.2));
  bridgeRails(props, span);
  laundry(props, ward);

  const couriers = [
    { id: 'c1', road: 'loopA', speed: 3.2, phase: 0.1 },
    { id: 'c2', road: 'loopB', speed: 2.8, phase: 0.45 },
    { id: 'c3', road: 'loopC', speed: 3.4, phase: 0.72 },
  ];

  return { props, colliders: colliders.filter((c) => !c.ghost), npcs, spawn, couriers };
}

function xy(p) {
  return [p.lat, p.lon];
}

function prop(props, colliders, kind, lat, lon, lift, extra) {
  if (lift && typeof lift === 'object') {
    extra = lift;
    lift = extra.lift || 0;
  }
  extra = extra || {};
  const desc = { kind, lat, lon, lift: lift || 0, ...extra };
  props.push(desc);
  if (kind === 'gate') {
    const rot = extra.rot || 0;
    for (const side of [1.45, -1.45]) {
      const p = moveMeters(lat, lon, -Math.sin(rot) * side, Math.cos(rot) * side);
      colliders.push({ lat: p.lat, lon: p.lon, radius: 0.4, height: 2.8 });
    }
    return;
  }
  const solid = SOLID[kind];
  if (solid) {
    colliders.push({
      lat,
      lon,
      radius: extra.radius || solid.radius,
      height: extra.height || solid.height,
    });
  }
}

const SOLID = {
  house: { radius: 2.3, height: 3.2 },
  kettle: { radius: 1.35, height: 2.4 },
  stall: { radius: 1.6, height: 2.2 },
  vending: { radius: 0.7, height: 2 },
  mailbox: { radius: 0.4, height: 1.2 },
  boat: { radius: 2.4, height: 1.6 },
  cup: { radius: 1.5, height: 1.15 },
  factory: { radius: 4.2, height: 5 },
  cave: { radius: 2.2, height: 2.6 },
  falls: { radius: 2.4, height: 3.2 },
  paperTree: { radius: 0.7, height: 4 },
  tree: { radius: 0.48, height: 3.4 },
  rock: { radius: 0.9, height: 1.15 },
  pole: { radius: 0.28, height: 3 },
  cone: { radius: 0.34, height: 0.62 },
  grave: { radius: 0.4, height: 0.9 },
  crate: { radius: 0.48, height: 0.62 },
  scope: { radius: 0.45, height: 1.4 },
};

function scatterHouses(props, colliders, rand, origin, count, inner, outer, opt = {}) {
  let placed = 0;
  let tries = 0;
  while (placed < count && tries < count * 18) {
    tries += 1;
    const ang = rand() * Math.PI * 2;
    const dist = inner + rand() * (outer - inner);
    const p = moveMeters(origin.lat, origin.lon, Math.cos(ang) * dist, Math.sin(ang) * dist);
    if (relief(p.lat, p.lon) < 0.95) continue;
    if (pathDistance(p.lat, p.lon) < 5.2) continue;
    if (blocked(p.lat, p.lon, 0, colliders)) continue;
    const hut = opt.hut;
    const ruin = opt.ruin;
    prop(props, colliders, 'house', p.lat, p.lon, 0, {
      rot: ang,
      w: hut ? 2.6 : 3.1 + rand() * 1.3,
      d: hut ? 2.4 : 2.6 + rand() * 0.8,
      h: ruin ? 1.8 : hut ? 2.2 : 2.5 + rand() * 1.1,
      wall: ruin ? '#c8c2b4' : HOUSE_WALLS[(rand() * HOUSE_WALLS.length) | 0],
      roof: ruin ? '#8d887e' : HOUSE_ROOFS[(rand() * HOUSE_ROOFS.length) | 0],
      floors: !hut && !ruin && rand() > 0.62 ? 2 : 1,
      towel: rand() > 0.55,
      flat: rand() > 0.45 || ruin,
      radius: hut ? 1.7 : 2.35,
      height: ruin ? 2 : 3.3,
    });
    placed += 1;
  }
}

function polesAlong(props, colliders, a, b, count) {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const lat = a.lat + (b.lat - a.lat) * t;
    const lon = a.lon + (b.lon - a.lon) * t;
    const p = moveMeters(lat, lon, 0, 4.4);
    if (relief(p.lat, p.lon) < 0.9) continue;
    if (blocked(p.lat, p.lon, 0, colliders)) continue;
    prop(props, colliders, 'pole', p.lat, p.lon, 0, { rot: 0.2 });
  }
}

function cones(props, colliders, origin, n) {
  for (let i = 0; i < n; i += 1) {
    const p = moveMeters(origin.lat, origin.lon, i * 1.1, (i % 2) * 0.8);
    prop(props, colliders, 'cone', p.lat, p.lon, 0, {});
  }
}

function graveyard(props, colliders, stones) {
  for (let i = 0; i < 8; i += 1) {
    const p = moveMeters(stones.lat, stones.lon, -4 + (i % 4) * 2.3, -2 + Math.floor(i / 4) * 2.4);
    if (blocked(p.lat, p.lon, 0, colliders)) continue;
    prop(props, colliders, 'grave', p.lat, p.lon, 0, { rot: 0.15 * i });
  }
}

function reeds(props, falls) {
  for (let i = 0; i < 9; i += 1) {
    const p = moveMeters(falls.lat, falls.lon, -3 + (i % 5) * 1.3, -7.5 - (i % 3) * 0.7);
    props.push({ kind: 'reed', lat: p.lat, lon: p.lon, lift: 0, s: 0.7 + (i % 3) * 0.25 });
  }
}

function groveTrees(props, colliders, rand, grove, n) {
  let placed = 0;
  let tries = 0;
  while (placed < n && tries < n * 12) {
    tries += 1;
    const ang = rand() * Math.PI * 2;
    const dist = 4 + rand() * 14;
    const p = moveMeters(grove.lat, grove.lon, Math.cos(ang) * dist, Math.sin(ang) * dist);
    if (relief(p.lat, p.lon) < 0.9) continue;
    if (pathDistance(p.lat, p.lon) < 2.4) continue;
    if (blocked(p.lat, p.lon, 0, colliders)) continue;
    prop(props, colliders, 'tree', p.lat, p.lon, 0, {
      s: 0.85 + rand() * 0.7,
      pale: rand() > 0.7,
      radius: 0.5,
    });
    placed += 1;
  }
}

function scatterTrees(props, colliders, rand, n) {
  const anchors = ['ward', 'span', 'stones', 'far', 'works', 'clay'].map((id) => spotDir(id));
  let placed = 0;
  let tries = 0;
  while (placed < n && tries < n * 14) {
    tries += 1;
    const a = anchors[tries % anchors.length];
    const ang = rand() * Math.PI * 2;
    const dist = 8 + rand() * 16;
    const p = moveMeters(a.lat, a.lon, Math.cos(ang) * dist, Math.sin(ang) * dist);
    if (relief(p.lat, p.lon) < 0.95) continue;
    if (pathDistance(p.lat, p.lon) < 3) continue;
    if (blocked(p.lat, p.lon, 0, colliders)) continue;
    prop(props, colliders, 'tree', p.lat, p.lon, 0, { s: 0.7 + rand() * 0.55, radius: 0.46 });
    placed += 1;
  }
}

function rocks(props, colliders, rand, origin, n, spread) {
  for (let i = 0; i < n; i += 1) {
    const ang = rand() * Math.PI * 2;
    const dist = spread + rand() * spread;
    const p = moveMeters(origin.lat, origin.lon, Math.cos(ang) * dist, Math.sin(ang) * dist);
    if (relief(p.lat, p.lon) < SEA) continue;
    if (blocked(p.lat, p.lon, 0, colliders)) continue;
    const s = 0.6 + rand() * 1.1;
    prop(props, colliders, 'rock', p.lat, p.lon, 0, {
      s,
      rot: rand() * 3,
      radius: 0.55 * s + 0.3,
      height: 0.7 * s + 0.3,
    });
  }
}

function flowers(props, origin, n) {
  for (let i = 0; i < n; i += 1) {
    const p = moveMeters(origin.lat, origin.lon, Math.cos(i) * (1.2 + (i % 3)), Math.sin(i * 1.7) * 1.4);
    props.push({
      kind: 'flower',
      lat: p.lat,
      lon: p.lon,
      lift: 0,
      color: ['#c25959', '#f3c258', '#de794e', '#8cc48c', '#f4f1ea'][i % 5],
    });
  }
}

function crates(props, colliders, origin) {
  for (let i = 0; i < 3; i += 1) {
    const p = moveMeters(origin.lat, origin.lon, i * 1.15, (i % 2) * 0.9);
    prop(props, colliders, 'crate', p.lat, p.lon, 0, { rot: i });
  }
}

function bridgeRails(props, span) {
  for (const side of [-2.4, 2.4]) {
    for (let i = -2; i <= 2; i += 1) {
      const p = moveMeters(span.lat, span.lon, i * 2.2, side);
      props.push({ kind: 'rail', lat: p.lat, lon: p.lon, lift: 0, rot: 0 });
    }
  }
}

function laundry(props, ward) {
  for (let i = 0; i < 3; i += 1) {
    const p = moveMeters(ward.lat, ward.lon, -6 + i * 4, 5.2);
    props.push({
      kind: 'laundry',
      lat: p.lat,
      lon: p.lon,
      lift: 0,
      color: ['#f4f1ea', '#de794e', '#66bde6'][i],
    });
  }
}

export function clearanceReport(layout) {
  const issues = [];
  for (const npc of layout.npcs) {
    const h = relief(npc.lat, npc.lon);
    if (h < SEA + 0.35 && npc.id !== 'rao') issues.push(`${npc.id} low ${h.toFixed(2)}`);
    const hit = blocked(npc.lat, npc.lon, 0, layout.colliders);
    if (hit) issues.push(`${npc.id} inside collider r=${hit.radius}`);
  }
  const s = layout.spawn;
  if (blocked(s.lat, s.lon, 0, layout.colliders)) issues.push('spawn blocked');
  if (relief(s.lat, s.lon) < 0.9) issues.push('spawn wet');
  for (const c of layout.colliders) {
    if (c.radius <= 0) issues.push('bad radius');
    if (arcMeters(c.lat, c.lon, s.lat, s.lon) < PLAYER_R) issues.push('collider on spawn');
  }
  return issues;
}
