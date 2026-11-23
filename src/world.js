import * as THREE from 'three';
import { buildLayout } from './layout.js';
import {
  R,
  SEA,
  frame,
  groundColor,
  moveMeters,
  point,
  surfaceRadius,
  vadd,
  vscale,
} from './planet.js';
import { srgbToLinear, toon, worldRamp } from './materials.js';

const geoBox = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function painted(geo, hex) {
  const m = new THREE.Mesh(geo, toon(hex));
  m.castShadow = true;
  return m;
}

function basisMatrix(lat, lon, rot = 0, lift = 0) {
  const { east, north, up } = frame(lat, lon);
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const x = vadd(vscale(east, c), vscale(north, s));
  const z = vadd(vscale(east, -s), vscale(north, c));
  const p = point(lat, lon, lift);
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(x[0], x[1], x[2]),
    new THREE.Vector3(up[0], up[1], up[2]),
    new THREE.Vector3(z[0], z[1], z[2]),
  );
  m.setPosition(p[0], p[1], p[2]);
  return m;
}

function plant(object, lat, lon, rot = 0, lift = 0) {
  object.updateMatrix();
  const local = object.matrix.clone();
  const placed = basisMatrix(lat, lon, rot, lift);
  object.matrix.copy(placed.multiply(local));
  object.matrixAutoUpdate = false;
  object.position.set(0, 0, 0);
  object.quaternion.identity();
  object.scale.set(1, 1, 1);
  object.updateMatrixWorld(true);
  return object;
}

export function createWorld() {
  const layout = buildLayout();
  const terrain = buildTerrain();
  const water = buildSea();
  const root = new THREE.Group();
  const fallsMats = [];
  for (const desc of layout.props) {
    const made = buildProp(desc, fallsMats);
    if (!made) continue;
    plant(made, desc.lat, desc.lon, desc.rot || 0, desc.lift || 0);
    root.add(made);
  }
  const cat = buildCat();
  const stall = layout.props.find((p) => p.kind === 'stall');
  if (stall) {
    const paw = moveMeters(stall.lat, stall.lon, 1.35, -1.15);
    plant(cat, paw.lat, paw.lon, 0.6, 0);
  }
  root.add(cat);
  return { layout, terrain, water, props: root, fallsMats, cat };
}

function buildTerrain() {
  const geo = new THREE.IcosahedronGeometry(1, 6);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).normalize();
    const lat = Math.asin(Math.min(1, Math.max(-1, v.y)));
    const lon = Math.atan2(v.x, v.z);
    const r = surfaceRadius(lat, lon);
    pos.setXYZ(i, v.x * r, v.y * r, v.z * r);
    const c = groundColor(lat, lon);
    colors[i * 3] = srgbToLinear(c[0]);
    colors[i * 3 + 1] = srgbToLinear(c[1]);
    colors[i * 3 + 2] = srgbToLinear(c[2]);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({
    vertexColors: true,
    gradientMap: worldRamp,
  }));
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

function buildSea() {
  const geo = new THREE.SphereGeometry(R + SEA, 64, 40);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vW;
      varying vec3 vN;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vW;
      varying vec3 vN;
      void main() {
        vec3 view = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(normalize(vN), view), 0.0), 1.6);
        float rip = sin(vW.x * 0.55 + uTime * 1.3) * sin(vW.z * 0.48 - uTime);
        vec3 deep = vec3(0.16, 0.42, 0.44);
        vec3 shallow = vec3(0.55, 0.78, 0.74);
        vec3 col = mix(deep, shallow, fres) + rip * 0.025;
        gl_FragColor = vec4(col, 0.78);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sea';
  return mesh;
}

function buildProp(desc, fallsMats) {
  switch (desc.kind) {
    case 'house': return house(desc);
    case 'tree':
    case 'paperTree': return tree(desc);
    case 'kettle': return kettle();
    case 'stall': return stall();
    case 'vending': return vending();
    case 'mailbox': return mailbox();
    case 'boat': return boat();
    case 'cup': return cup();
    case 'factory': return factory();
    case 'cave': return cave();
    case 'gate': return gate();
    case 'falls': return falls(fallsMats);
    case 'grave': return grave();
    case 'pole': return pole();
    case 'cone': return cone();
    case 'rock': return rock(desc);
    case 'flower': return flower(desc);
    case 'reed': return reed(desc);
    case 'crate': {
      const crate = painted(geoBox(0.7, 0.55, 0.7), '#cbbfa6');
      crate.position.y = 0.28;
      return crate;
    }
    case 'rail': return rail();
    case 'laundry': return laundry(desc);
    case 'scope': return scope();
    default: return null;
  }
}

function house(desc) {
  const g = new THREE.Group();
  const w = desc.w || 3.2;
  const d = desc.d || 2.8;
  const h = desc.h || 2.6;
  const wall = painted(geoBox(w, h, d), desc.wall || '#d9d3c3');
  wall.position.y = h / 2;
  g.add(wall);
  if (desc.flat) {
    const roof = painted(geoBox(w + 0.35, 0.16, d + 0.35), desc.roof || '#8d9a8a');
    roof.position.y = h + 0.08;
    g.add(roof);
  } else {
    const roof = painted(new THREE.ConeGeometry(Math.max(w, d) * 0.62, 0.85, 4), desc.roof || '#8d9a8a');
    roof.position.y = h + 0.38;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
  }
  const win = toon('#314248');
  for (const side of [-1, 1]) {
    const pane = new THREE.Mesh(geoBox(0.42, 0.48, 0.06), win);
    pane.position.set(side * w * 0.22, h * 0.62, -d / 2 - 0.02);
    pane.castShadow = true;
    g.add(pane);
    if (desc.floors === 2) {
      const upper = new THREE.Mesh(geoBox(0.38, 0.36, 0.06), win);
      upper.position.set(side * w * 0.22, h * 0.28, -d / 2 - 0.02);
      upper.castShadow = true;
      g.add(upper);
    }
  }
  const door = painted(geoBox(0.48, 0.9, 0.06), '#5c5148');
  door.position.set(0, 0.46, -d / 2 - 0.02);
  g.add(door);
  if (desc.towel) {
    const towel = painted(geoBox(0.36, 0.55, 0.04), desc.hero ? '#f7f4ee' : '#de794e');
    towel.position.set(w * 0.18, h * 0.5, -d / 2 - 0.06);
    g.add(towel);
  }
  return g;
}

function tree(desc) {
  const g = new THREE.Group();
  const s = desc.kind === 'paperTree' ? 1.35 : (desc.s || 1);
  const trunk = painted(new THREE.CylinderGeometry(0.11 * s, 0.18 * s, 1.15 * s, 5), '#6d645c');
  trunk.position.y = 0.55 * s;
  const pale = desc.pale || desc.kind === 'paperTree';
  const crown = painted(new THREE.SphereGeometry(0.82 * s, 7, 6), pale ? '#d9d3c4' : '#73956f');
  crown.position.y = 1.45 * s;
  crown.scale.y = pale ? 0.62 : 0.82;
  const crown2 = painted(new THREE.SphereGeometry(0.55 * s, 6, 5), pale ? '#cfc6b4' : '#87a884');
  crown2.position.set(0.28 * s, 1.25 * s, 0.1);
  g.add(trunk, crown, crown2);
  return g;
}

function kettle() {
  const g = new THREE.Group();
  const body = painted(new THREE.SphereGeometry(1.15, 12, 10), '#8d9498');
  body.position.y = 1.15;
  body.scale.y = 0.86;
  const lid = painted(new THREE.CylinderGeometry(0.46, 0.5, 0.12, 10), '#6e757a');
  lid.position.y = 2.05;
  const knob = painted(new THREE.SphereGeometry(0.12, 6, 5), '#c25959');
  knob.position.y = 2.18;
  const spout = painted(new THREE.CylinderGeometry(0.16, 0.22, 0.9, 6), '#8d9498');
  spout.position.set(0, 1.35, -0.95);
  spout.rotation.x = Math.PI / 2.4;
  const handle = painted(new THREE.TorusGeometry(0.42, 0.07, 6, 12, Math.PI), '#6e757a');
  handle.position.set(0, 1.4, 0.85);
  handle.rotation.y = Math.PI;
  g.add(body, lid, knob, spout, handle);
  return g;
}

function stall() {
  const g = new THREE.Group();
  const counter = painted(geoBox(2.2, 0.9, 1.1), '#d7c4a8');
  counter.position.y = 0.55;
  const awning = painted(geoBox(2.5, 0.12, 1.4), '#c25959');
  awning.position.y = 2.05;
  const poleL = painted(new THREE.CylinderGeometry(0.05, 0.05, 2, 5), '#6d645c');
  const poleR = poleL.clone();
  poleL.position.set(-1, 1, -0.5);
  poleR.position.set(1, 1, -0.5);
  g.add(counter, awning, poleL, poleR);
  return g;
}

function vending() {
  const g = new THREE.Group();
  const body = painted(geoBox(0.8, 1.7, 0.55), '#7f8f96');
  body.position.y = 0.85;
  const glass = painted(geoBox(0.55, 0.7, 0.06), '#9fd0cb');
  glass.position.set(0, 1.15, -0.28);
  ['#c25959', '#f3c258', '#66bde6'].forEach((hex, i) => {
    const b = painted(geoBox(0.12, 0.12, 0.05), hex);
    b.position.set(-0.18 + i * 0.18, 0.55, -0.3);
    g.add(b);
  });
  g.add(body, glass);
  return g;
}

function mailbox() {
  const g = new THREE.Group();
  const post = painted(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 5), '#6d645c');
  post.position.y = 0.55;
  const box = painted(geoBox(0.46, 0.34, 0.32), '#c25959');
  box.position.y = 1.15;
  g.add(post, box);
  return g;
}

function boat() {
  const g = new THREE.Group();
  const hull = painted(new THREE.SphereGeometry(1.5, 8, 6), '#4f7ea8');
  hull.scale.set(1.35, 0.38, 0.72);
  hull.position.y = 0.45;
  const stripe = painted(geoBox(2.5, 0.12, 0.2), '#f7f4ee');
  stripe.position.y = 0.62;
  const cabin = painted(geoBox(0.8, 0.55, 0.7), '#e7e1d4');
  cabin.position.set(-0.2, 0.95, 0);
  g.add(hull, stripe, cabin);
  return g;
}

function cup() {
  const g = new THREE.Group();
  const cup = painted(new THREE.CylinderGeometry(1.15, 0.85, 0.9, 12), '#f7f4ee');
  cup.position.y = 0.45;
  const rim = painted(new THREE.TorusGeometry(1.12, 0.08, 6, 16), '#c25959');
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.9;
  const handle = painted(new THREE.TorusGeometry(0.32, 0.07, 6, 10), '#f7f4ee');
  handle.position.set(1.15, 0.5, 0);
  g.add(cup, rim, handle);
  return g;
}

function factory() {
  const g = new THREE.Group();
  const shed = painted(geoBox(5.5, 2.6, 3.4), '#9aa3a1');
  shed.position.y = 1.3;
  const tank = painted(new THREE.CylinderGeometry(0.8, 0.8, 2.2, 10), '#6e787c');
  tank.position.set(2.3, 1.1, 1.4);
  const tank2 = tank.clone();
  tank2.position.x = -2.2;
  const stack = painted(new THREE.CylinderGeometry(0.38, 0.46, 3.2, 8), '#6d645c');
  stack.position.set(-1.4, 2.8, 0.4);
  const band = painted(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 8), '#de794e');
  band.position.set(-1.4, 3.6, 0.4);
  const door = painted(geoBox(0.9, 1.3, 0.08), '#3e4a50');
  door.position.set(0.4, 0.65, -1.72);
  g.add(shed, tank, tank2, stack, band, door);
  return g;
}

function cave() {
  const g = new THREE.Group();
  const arch = painted(new THREE.TorusGeometry(1.5, 0.55, 6, 10, Math.PI), '#8a867e');
  arch.rotation.z = Math.PI;
  arch.rotation.y = Math.PI;
  arch.position.y = 1.35;
  const mouth = painted(new THREE.SphereGeometry(1.05, 8, 6), '#2a3034');
  mouth.position.set(0, 1.05, 0.2);
  mouth.scale.set(1.1, 0.9, 0.45);
  g.add(arch, mouth);
  return g;
}

function gate() {
  const g = new THREE.Group();
  const wood = '#6d7a72';
  const postL = painted(geoBox(0.28, 2.5, 0.28), wood);
  const postR = postL.clone();
  postL.position.set(0, 1.25, -1.45);
  postR.position.set(0, 1.25, 1.45);
  const beam = painted(geoBox(0.24, 0.28, 3.3), wood);
  beam.position.y = 2.45;
  const moss = painted(geoBox(0.3, 0.12, 1.2), '#8cc48c');
  moss.position.set(0.05, 2.55, 0.4);
  g.add(postL, postR, beam, moss);
  return g;
}

function falls(mats) {
  const g = new THREE.Group();
  const rockMat = '#9a958c';
  const a = painted(new THREE.DodecahedronGeometry(1.3, 0), rockMat);
  a.position.y = 1.1;
  a.scale.set(1.2, 1.4, 0.8);
  const b = painted(new THREE.DodecahedronGeometry(0.9, 0), '#8d887e');
  b.position.set(0.8, 0.7, 0.5);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float band = fract(vUv.y * 6.0 - uTime * 0.8);
        float streak = smoothstep(0.35, 0.5, band) * smoothstep(0.85, 0.55, band);
        vec3 col = mix(vec3(0.62, 0.82, 0.8), vec3(0.95, 0.97, 0.95), streak);
        float a = 0.55 + streak * 0.4;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  mats.push(mat);
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.8), mat);
  ribbon.position.set(0, 1.7, -0.15);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.8, 14), mat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.08, -1.5);
  g.add(a, b, ribbon, pool);
  return g;
}

function grave() {
  const g = new THREE.Group();
  const stone = painted(geoBox(0.55, 0.7, 0.16), '#d5d0c6');
  stone.position.y = 0.5;
  const cap = painted(new THREE.SphereGeometry(0.28, 6, 5), '#d5d0c6');
  cap.scale.y = 0.6;
  cap.position.y = 0.85;
  g.add(stone, cap);
  return g;
}

function pole() {
  const g = new THREE.Group();
  const post = painted(new THREE.CylinderGeometry(0.06, 0.07, 3.1, 5), '#5c6568');
  post.position.y = 1.55;
  const arm = painted(geoBox(0.9, 0.06, 0.06), '#5c6568');
  arm.position.set(0.3, 2.9, 0);
  g.add(post, arm);
  return g;
}

function cone() {
  const g = new THREE.Group();
  const c = painted(new THREE.CylinderGeometry(0.05, 0.28, 0.62, 7), '#de794e');
  c.position.y = 0.31;
  const band = painted(new THREE.CylinderGeometry(0.12, 0.16, 0.1, 7), '#f7f4ee');
  band.position.y = 0.28;
  g.add(c, band);
  return g;
}

function rock(desc) {
  const s = desc.s || 1;
  const m = painted(new THREE.DodecahedronGeometry(0.55 * s, 0), '#a39e94');
  m.position.y = 0.35 * s;
  return m;
}

function flower(desc) {
  const g = new THREE.Group();
  const stem = painted(new THREE.CylinderGeometry(0.02, 0.025, 0.35, 4), '#6e8f72');
  stem.position.y = 0.18;
  const head = painted(new THREE.SphereGeometry(0.09, 5, 4), desc.color || '#c25959');
  head.position.y = 0.38;
  g.add(stem, head);
  return g;
}

function reed(desc) {
  const s = desc.s || 1;
  const m = painted(new THREE.ConeGeometry(0.05, 0.8 * s, 4), '#8a9a70');
  m.position.y = 0.4 * s;
  return m;
}

function rail() {
  const g = new THREE.Group();
  const post = painted(geoBox(0.12, 0.85, 0.12), '#4f7ea8');
  post.position.y = 0.42;
  const bar = painted(geoBox(0.1, 0.08, 2.1), '#4f7ea8');
  bar.position.y = 0.78;
  g.add(post, bar);
  return g;
}

function laundry(desc) {
  const cloth = painted(geoBox(0.7, 0.45, 0.04), desc.color || '#f7f4ee');
  cloth.position.y = 2.1;
  return cloth;
}

function scope() {
  const g = new THREE.Group();
  const leg = painted(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5), '#6d645c');
  leg.position.y = 0.55;
  const tube = painted(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8), '#3d6f8a');
  tube.rotation.z = Math.PI / 2.3;
  tube.position.y = 1.25;
  g.add(leg, tube);
  return g;
}

function buildCat() {
  const g = new THREE.Group();
  const body = painted(geoBox(0.42, 0.28, 0.22), '#c4a574');
  body.position.y = 0.28;
  const head = painted(new THREE.SphereGeometry(0.14, 7, 6), '#c4a574');
  head.position.set(0, 0.42, -0.16);
  const earL = painted(new THREE.ConeGeometry(0.05, 0.12, 4), '#c4a574');
  const earR = earL.clone();
  earL.position.set(0.07, 0.56, -0.16);
  earR.position.set(-0.07, 0.56, -0.16);
  const tail = painted(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 4), '#c4a574');
  tail.position.set(0, 0.36, 0.22);
  tail.rotation.x = 0.8;
  tail.name = 'tail';
  g.add(body, head, earL, earR, tail);
  g.name = 'cat';
  return g;
}

export function tickWorld(world, time) {
  if (world.water.material.uniforms) world.water.material.uniforms.uTime.value = time;
  for (const mat of world.fallsMats) mat.uniforms.uTime.value = time;
  const tail = world.cat.getObjectByName('tail');
  if (tail) tail.rotation.z = Math.sin(time * 2.2) * 0.4;
}
