/** Sphere math, relief, and roads for Pebble Post. Pure numbers, no rendering. */

export const R = 58;
export const SEA = 0.42;
export const WALK = 4.55;
export const SPRINT = 8.15;
export const PLAYER_R = 0.42;

const D = Math.PI / 180;

export const SPOTS = {
  ward: { lat: 6, lon: -18 },
  square: { lat: 12, lon: 22 },
  span: { lat: 16, lon: 52 },
  clay: { lat: 6, lon: 80 },
  beach: { lat: -14, lon: 102 },
  works: { lat: -20, lon: -4 },
  grove: { lat: 4, lon: -68 },
  stones: { lat: 36, lon: 6 },
  temple: { lat: 58, lon: 34 },
  falls: { lat: 30, lon: -38 },
  far: { lat: 2, lon: 168 },
};

export const PLACES = [
  { id: 'ward', en: 'LANTERN WARD', zh: '灯笼巷', spot: 'ward', radius: 16 },
  { id: 'square', en: 'KETTLE SQUARE', zh: '壶广场', spot: 'square', radius: 15 },
  { id: 'span', en: 'BLUE SPAN', zh: '青桥', spot: 'span', radius: 13 },
  { id: 'clay', en: 'CLAY HOUSE', zh: '赤泥小屋', spot: 'clay', radius: 12 },
  { id: 'beach', en: 'SALT STEPS', zh: '盐滩', spot: 'beach', radius: 18 },
  { id: 'works', en: 'HUM WORKS', zh: '嗡嗡厂', spot: 'works', radius: 16 },
  { id: 'grove', en: 'PAPER GROVE', zh: '纸林', spot: 'grove', radius: 18 },
  { id: 'stones', en: 'QUIET STONES', zh: '静石坡', spot: 'stones', radius: 14 },
  { id: 'temple', en: 'MOSS TEMPLE', zh: '苔寺', spot: 'temple', radius: 14 },
  { id: 'falls', en: 'REED FALLS', zh: '芦瀑', spot: 'falls', radius: 14 },
  { id: 'far', en: 'FAR SIDE', zh: '远面', spot: 'far', radius: 18 },
];

const ROADS = [
  ['ward', 'square', 'span', 'clay', [0, 92], [-6, 100]],
  ['square', 'stones', [48, 16], 'temple'],
  ['stones', 'falls', 'grove', 'ward'],
  ['ward', 'works', [-16, 28], [-8, 70], [0, 92]],
  [[44, 28], 'temple'],
  ['works', [-28, -4]],
];

const CLEARINGS = [
  { spot: 'square', radius: 9.5, kind: 'path' },
  { spot: 'temple', radius: 7.5, kind: 'path' },
  { spot: 'works', radius: 9, kind: 'path' },
  { spot: 'stones', radius: 7, kind: 'path' },
  { spot: 'span', radius: 5.5, kind: 'path' },
  { spot: 'beach', radius: 8, kind: 'sand' },
];

export function deg(lat, lon) {
  return { lat: lat * D, lon: lon * D };
}

export function spotDir(id) {
  const s = SPOTS[id];
  return deg(s.lat, s.lon);
}

function nodeDeg(node) {
  if (typeof node === 'string') return SPOTS[node];
  return { lat: node[0], lon: node[1] };
}

export function vdir(lat, lon) {
  const cl = Math.cos(lat);
  return [cl * Math.sin(lon), Math.sin(lat), cl * Math.cos(lon)];
}

export function vdot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vlen(a) {
  return Math.hypot(a[0], a[1], a[2]);
}

export function vadd(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vscale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function vnorm(a) {
  const l = vlen(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export function vcross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function ang(lat1, lon1, lat2, lon2) {
  const d = vdot(vdir(lat1, lon1), vdir(lat2, lon2));
  return Math.acos(Math.min(1, Math.max(-1, d)));
}

export function arcMeters(lat1, lon1, lat2, lon2) {
  return ang(lat1, lon1, lat2, lon2) * R;
}

/** Local east / north / up. Right-handed: east × north = up. */
export function frame(lat, lon) {
  const up = vdir(lat, lon);
  let east = vcross([0, 1, 0], up);
  if (vlen(east) < 1e-4) east = [1, 0, 0];
  east = vnorm(east);
  const north = vnorm(vcross(up, east));
  return { east, north, up };
}

export function moveMeters(lat, lon, eastM, northM) {
  const dLat = northM / R;
  const dLon = eastM / (R * Math.max(0.28, Math.cos(lat)));
  let nlat = lat + dLat;
  let nlon = lon + dLon;
  nlat = Math.max(-1.45, Math.min(1.45, nlat));
  nlon = Math.atan2(Math.sin(nlon), Math.cos(nlon));
  return { lat: nlat, lon: nlon };
}

/**
 * Heading 0 faces east, positive turns toward north.
 * Nose of the character is local -Z, character-right is local +X.
 */
export function orient(lat, lon, heading) {
  const { east, north, up } = frame(lat, lon);
  const forward = vnorm(vadd(vscale(east, Math.cos(heading)), vscale(north, Math.sin(heading))));
  // Facing east, the body's right hand points south. Nose is local -Z, so the
  // matrix Z column is -forward and the X column is this right vector.
  const right = vnorm(vadd(vscale(east, Math.sin(heading)), vscale(north, -Math.cos(heading))));
  return { forward, right, up };
}

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise(lat, lon) {
  const x = lat * 3.2;
  const y = lon * 3.2;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash(x0, y0);
  const b = hash(x0 + 1, y0);
  const c = hash(x0, y0 + 1);
  const d = hash(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function blob(lat, lon, lat0, lon0, rad) {
  const d = ang(lat, lon, lat0, lon0) / rad;
  if (d >= 1) return 0;
  const t = 1 - d * d;
  return t * t;
}

let roadSamples = null;
let roadBuckets = null;

function buildRoads() {
  const samples = [];
  for (const road of ROADS) {
    const pts = road.map((n) => {
      const d = nodeDeg(n);
      return deg(d.lat, d.lon);
    });
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const dist = arcMeters(a.lat, a.lon, b.lat, b.lon);
      const steps = Math.max(1, Math.ceil(dist / 3));
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const dirA = vdir(a.lat, a.lon);
        const dirB = vdir(b.lat, b.lon);
        const mixed = vnorm(vadd(vscale(dirA, 1 - t), vscale(dirB, t)));
        const lat = Math.asin(Math.min(1, Math.max(-1, mixed[1])));
        const lon = Math.atan2(mixed[0], mixed[2]);
        samples.push({ lat, lon });
      }
    }
  }
  const cell = 10 * D;
  const buckets = new Map();
  samples.forEach((s, i) => {
    const key = `${Math.floor(s.lat / cell)}:${Math.floor(s.lon / cell)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  });
  roadSamples = samples;
  roadBuckets = { buckets, cell };
}

export function pathDistance(lat, lon) {
  if (!roadSamples) buildRoads();
  const { buckets, cell } = roadBuckets;
  const cx = Math.floor(lat / cell);
  const cy = Math.floor(lon / cell);
  let best = 80;
  for (let ix = -1; ix <= 1; ix += 1) {
    for (let iy = -1; iy <= 1; iy += 1) {
      const list = buckets.get(`${cx + ix}:${cy + iy}`);
      if (!list) continue;
      for (const i of list) {
        const s = roadSamples[i];
        const d = arcMeters(lat, lon, s.lat, s.lon);
        if (d < best) best = d;
      }
    }
  }
  for (const c of CLEARINGS) {
    if (c.kind !== 'path') continue;
    const p = spotDir(c.spot);
    const d = arcMeters(lat, lon, p.lat, p.lon);
    best = Math.min(best, Math.max(0, d - c.radius));
  }
  return best;
}

export function relief(lat, lon) {
  const temple = spotDir('temple');
  const stones = spotDir('stones');
  const falls = spotDir('falls');
  const beach = spotDir('beach');
  const far = spotDir('far');
  let h = 1.42 + (noise(lat, lon) - 0.5) * 0.38;
  h += blob(lat, lon, temple.lat, temple.lon, 0.62) * 5.1;
  h += blob(lat, lon, stones.lat, stones.lon, 0.38) * 1.7;
  h += blob(lat, lon, falls.lat, falls.lon, 0.2) * 2.35;
  h += blob(lat, lon, far.lat, far.lon, 0.55) * 0.85;
  h -= blob(lat, lon, beach.lat, beach.lon, 0.34) * 2.55;
  const flattenSpots = ['ward', 'square', 'span', 'clay', 'works', 'grove'];
  let town = 0;
  for (const id of flattenSpots) {
    const p = spotDir(id);
    town = Math.max(town, blob(lat, lon, p.lat, p.lon, id === 'grove' ? 0.32 : 0.28));
  }
  h = h * (1 - town * 0.72) + 1.48 * (town * 0.72);
  return h;
}

export function surfaceRadius(lat, lon) {
  return R + relief(lat, lon);
}

const COLORS = {
  grass: [0.62, 0.7, 0.55],
  grassB: [0.54, 0.64, 0.5],
  path: [0.85, 0.81, 0.73],
  pathEdge: [0.72, 0.68, 0.6],
  sand: [0.9, 0.82, 0.66],
  wetSand: [0.78, 0.7, 0.52],
  rock: [0.64, 0.63, 0.58],
  moss: [0.48, 0.62, 0.5],
};

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function groundColor(lat, lon) {
  const h = relief(lat, lon);
  const beach = spotDir('beach');
  const nearBeach = arcMeters(lat, lon, beach.lat, beach.lon);
  const temple = spotDir('temple');
  const nearTemple = arcMeters(lat, lon, temple.lat, temple.lon);
  const grove = spotDir('grove');
  const nearGrove = arcMeters(lat, lon, grove.lat, grove.lon);
  const dPath = pathDistance(lat, lon);
  if (h < SEA - 0.05) return COLORS.wetSand;
  if (h < 0.95 && nearBeach < 22) return mix(COLORS.sand, COLORS.wetSand, (0.95 - h) / 0.7);
  if (dPath < 2.15) return COLORS.path;
  if (dPath < 2.7) return COLORS.pathEdge;
  if (h > 4.3 || (nearTemple < 10 && h > 3.4)) return mix(COLORS.rock, COLORS.moss, 0.35);
  if (nearGrove < 20) return mix(COLORS.grassB, COLORS.moss, 0.25);
  const n = noise(lat * 2.4, lon * 2.4);
  return mix(COLORS.grass, COLORS.grassB, n);
}

export function placeAt(lat, lon) {
  let best = null;
  let bestD = Infinity;
  for (const p of PLACES) {
    const s = spotDir(p.spot);
    const d = arcMeters(lat, lon, s.lat, s.lon);
    if (d < p.radius && d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

export function blocked(lat, lon, hop, colliders) {
  for (const c of colliders) {
    const d = arcMeters(lat, lon, c.lat, c.lon);
    if (d < c.radius + PLAYER_R && hop < c.height - 0.15) return c;
  }
  return null;
}

export function tryMove(lat, lon, eastM, northM, hop, colliders) {
  const full = moveMeters(lat, lon, eastM, northM);
  if (!blocked(full.lat, full.lon, hop, colliders)) return full;
  const e = moveMeters(lat, lon, eastM, 0);
  if (!blocked(e.lat, e.lon, hop, colliders)) return e;
  const n = moveMeters(lat, lon, 0, northM);
  if (!blocked(n.lat, n.lon, hop, colliders)) return n;
  return { lat, lon };
}

export function point(lat, lon, hop = 0) {
  return vscale(vdir(lat, lon), surfaceRadius(lat, lon) + hop);
}

export function finiteNormal(lat, lon) {
  const e = 0.004;
  const p = point(lat, lon, 0);
  const a = point(lat, lon + e, 0);
  const b = point(lat + e, lon, 0);
  const n = vnorm(vcross(
    [a[0] - p[0], a[1] - p[1], a[2] - p[2]],
    [b[0] - p[0], b[1] - p[1], b[2] - p[2]],
  ));
  if (vdot(n, vdir(lat, lon)) < 0) return vscale(n, -1);
  return n;
}
