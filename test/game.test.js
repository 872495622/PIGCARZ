import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R,
  SEA,
  SPOTS,
  arcMeters,
  frame,
  moveMeters,
  orient,
  pathDistance,
  relief,
  spotDir,
  tryMove,
  vcross,
  vdot,
  vlen,
} from '../src/planet.js';
import { allDone, freshQuests, hasMark, talk } from '../src/content.js';
import { buildLayout, clearanceReport } from '../src/layout.js';

test('frames stay orthonormal and east points toward increasing longitude', () => {
  const f = frame(0, 0);
  assert.ok(Math.abs(vdot(f.east, f.north)) < 1e-6);
  assert.ok(Math.abs(vdot(f.east, f.up)) < 1e-6);
  assert.ok(Math.abs(vlen(vcross(f.east, f.north)) - 1) < 1e-6);
  assert.ok(vdot(vcross(f.east, f.north), f.up) > 0.99);
  const step = moveMeters(0, 0, 5, 0);
  assert.ok(step.lon > 0, 'eastward move increases longitude');
  const north = moveMeters(0, 0, 0, 5);
  assert.ok(north.lat > 0, 'northward move increases latitude');
});

test('facing east puts the right hand to the south and keeps a right-handed basis', () => {
  const o = orient(0.2, -0.4, 0);
  assert.ok(Math.abs(vdot(o.forward, o.up)) < 1e-6);
  assert.ok(Math.abs(vdot(o.right, o.up)) < 1e-6);
  assert.ok(Math.abs(vdot(o.right, o.forward)) < 1e-6);
  const z = o.forward.map((n) => -n);
  const triple = vdot(o.right, vcross(o.up, z));
  assert.ok(triple > 0.99, 'right × up should be -forward');
});

test('town stays dry, the beach dips under the sea, the temple is the high point', () => {
  for (const id of ['ward', 'square', 'span', 'clay', 'works', 'grove', 'stones', 'falls', 'far']) {
    const p = spotDir(id);
    const h = relief(p.lat, p.lon);
    assert.ok(h > SEA + 0.45, `${id} relief ${h.toFixed(2)} should be walkable`);
  }
  const beach = spotDir('beach');
  assert.ok(relief(beach.lat, beach.lon) < SEA, 'beach should meet the water');
  const temple = relief(spotDir('temple').lat, spotDir('temple').lon);
  const square = relief(spotDir('square').lat, spotDir('square').lon);
  assert.ok(temple > square + 2, 'temple rises above the square');
});

test('connected districts are a short walk apart and not piled on top of each other', () => {
  const pairs = [
    ['ward', 'square'],
    ['square', 'span'],
    ['span', 'clay'],
    ['square', 'stones'],
    ['stones', 'falls'],
    ['falls', 'grove'],
    ['grove', 'ward'],
    ['ward', 'works'],
    ['stones', 'temple'],
  ];
  for (const [a, b] of pairs) {
    const pa = spotDir(a);
    const pb = spotDir(b);
    const d = arcMeters(pa.lat, pa.lon, pb.lat, pb.lon);
    assert.ok(d > 18 && d < 75, `${a} → ${b} is ${d.toFixed(1)}m`);
  }
  const names = Object.keys(SPOTS);
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const d = arcMeters(
        spotDir(names[i]).lat,
        spotDir(names[i]).lon,
        spotDir(names[j]).lat,
        spotDir(names[j]).lon,
      );
      assert.ok(d > 16, `${names[i]} and ${names[j]} overlap at ${d.toFixed(1)}m`);
    }
  }
});

test('roads pass through the square and not through the sea', () => {
  const square = spotDir('square');
  assert.ok(pathDistance(square.lat, square.lon) < 1);
  const beach = spotDir('beach');
  const inland = moveMeters(beach.lat, beach.lon, -18, 10);
  assert.equal(typeof pathDistance(inland.lat, inland.lon), 'number');
});

test('movement slides instead of sticking inside a collider', () => {
  const start = spotDir('ward');
  const colliders = [{ lat: start.lat, lon: start.lon, radius: 2, height: 3 }];
  const away = tryMove(start.lat, start.lon, 6, 0, 0, colliders);
  const back = tryMove(away.lat, away.lon, -1, 0, 0, colliders);
  assert.ok(arcMeters(back.lat, back.lon, start.lat, start.lon) > 1);
});

test('each errand advances only in order and the round completes at five', () => {
  let q = freshQuests();
  assert.equal(hasMark('nia', q, new Set()), true);
  q = { ...q, ...talk('nia', q).patch };
  assert.equal(q.letter, 1);
  assert.equal(talk('ren', q).patch.letter, 2);
  q = { ...q, ...talk('ren', q).patch };
  q = { ...q, ...talk('nia', q).patch };
  assert.equal(q.letter, 3);
  q = { ...q, ...talk('moss', q).patch };
  q = { ...q, ...talk('lila', q).patch };
  q = { ...q, ...talk('moss', q).patch };
  q = { ...q, ...talk('bo', q).patch };
  q = { ...q, ...talk('jun', q).patch };
  q = { ...q, ...talk('jin', q).patch };
  q = { ...q, ...talk('plum', q).patch };
  q = { ...q, ...talk('calm', q).patch };
  q = { ...q, ...talk('plum', q).patch };
  q = { ...q, ...talk('rao', q).patch };
  assert.equal(hasMark('soren', q, new Set()), true);
  q = { ...q, ...talk('soren', q).patch };
  assert.equal(allDone(q), true);
  assert.equal(hasMark('nia', q, new Set()), false);
  assert.equal(talk('soren', q).patch, null);
});

test('layout leaves every speaker and the spawn on open ground', () => {
  const layout = buildLayout();
  const issues = clearanceReport(layout);
  assert.deepEqual(issues, [], issues.join('; '));
  const ids = new Set(layout.npcs.map((n) => n.id));
  for (const id of ['nia', 'ren', 'moss', 'lila', 'bo', 'jun', 'jin', 'plum', 'calm', 'rao', 'soren']) {
    assert.ok(ids.has(id), id);
  }
  assert.ok(layout.props.some((p) => p.kind === 'house' && p.wall === '#b85a4a'));
  assert.ok(layout.props.filter((p) => p.kind === 'house').length >= 12);
  assert.ok(R > 40);
});
