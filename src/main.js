import '@fontsource/lilita-one/latin.css';
import '@fontsource/patrick-hand/latin.css';
import '@fontsource/ma-shan-zheng/chinese-simplified.css';
import '@fontsource/zcool-qingke-huangyou/chinese-simplified.css';
import * as THREE from 'three';
import { createAudio } from './audio.js';
import {
  COPY,
  EMOTES,
  NPCS,
  QUESTS,
  QUEST_ORDER,
  activeQuests,
  allDone,
  freshQuests,
  hasMark,
  introLines,
  objective,
  parcelColor,
  talk,
} from './content.js';
import { createPerson, randomOutfit, LOOKS, TOP_STYLES, BOTTOM_STYLES, SHOE_STYLES } from './person.js';
import {
  R,
  SEA,
  SPRINT,
  WALK,
  arcMeters,
  frame,
  moveMeters,
  orient,
  placeAt,
  point,
  relief,
  spotDir,
  surfaceRadius,
  tryMove,
  vdot,
} from './planet.js';
import { createWorld, tickWorld } from './world.js';

const SAVE = 'pebble-post-v1';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio = createAudio();

const canvas = document.querySelector('#c');
const ui = {
  title: document.querySelector('#title'),
  logo: document.querySelector('#logo'),
  tag: document.querySelector('#tag'),
  hint: document.querySelector('#hint'),
  begin: document.querySelector('#begin'),
  lang: document.querySelector('#lang'),
  aboutOpen: document.querySelector('#about-open'),
  about: document.querySelector('#about'),
  aboutBody: document.querySelector('#about-body'),
  aboutClose: document.querySelector('#about-close'),
  place: document.querySelector('#place'),
  listBtn: document.querySelector('#btn-list'),
  list: document.querySelector('#list'),
  listTitle: document.querySelector('#list-title'),
  tasks: document.querySelector('#tasks'),
  stack: document.querySelector('#stack'),
  sound: document.querySelector('#btn-sound'),
  wearBtn: document.querySelector('#btn-wear'),
  emoteBtn: document.querySelector('#btn-emote'),
  langMini: document.querySelector('#btn-lang'),
  wardrobe: document.querySelector('#wardrobe'),
  wearTitle: document.querySelector('#wear-title'),
  wearRows: document.querySelector('#wear-rows'),
  wearClose: document.querySelector('#wear-close'),
  emotes: document.querySelector('#emotes'),
  emoteGrid: document.querySelector('#emote-grid'),
  slip: document.querySelector('#slip'),
  slipTab: document.querySelector('#slip-tab'),
  slipText: document.querySelector('#slip-text'),
  slipPrev: document.querySelector('#slip-prev'),
  slipNext: document.querySelector('#slip-next'),
  dialogue: document.querySelector('#dialogue'),
  dlgTab: document.querySelector('#dlg-tab'),
  dlgText: document.querySelector('#dlg-text'),
  dlgNext: document.querySelector('#dlg-next'),
  ending: document.querySelector('#ending'),
  endTitle: document.querySelector('#end-title'),
  endBody: document.querySelector('#end-body'),
  endTime: document.querySelector('#end-time'),
  endStay: document.querySelector('#end-stay'),
  endAgain: document.querySelector('#end-again'),
  endCredit: document.querySelector('#end-credit'),
  joy: document.querySelector('#joy'),
  knob: document.querySelector('#joy-knob'),
  live: document.querySelector('#live'),
  boot: document.querySelector('#boot'),
};

const state = load();
let mode = 'title';
let lat = 0;
let lon = 0;
let hop = 0;
let vel = 0;
let heading = 0;
let onGround = true;
let coyote = 0;
let playTime = state.playTime || 0;
let slipFocus = null;
let placeId = '';
let horizontal = 0;
const keys = new Set();
let jumpQueued = false;
let wardrobeOpen = false;
let listOpen = false;
let emoteOpen = false;
let dialog = null;
let lineShown = 0;
let lineStamp = 0;
const heard = new Set(state.heard || []);
const inkSkip = [];
const emoteLive = [];
const pointer = {
  id: null, x: 0, y: 0, sx: 0, sy: 0, t: 0, drag: false, joy: false, held: false, touch: false, jx: 0, jz: 0,
};

function load() {
  const base = {
    q: freshQuests(),
    outfit: randomOutfit(),
    lang: (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en',
    muted: false,
    introSeen: false,
    heard: [],
    playTime: 0,
    finished: false,
  };
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (!raw) return base;
    const q = freshQuests();
    for (const id of QUEST_ORDER) {
      const n = raw.q?.[id];
      if (typeof n === 'number' && Number.isFinite(n)) {
        q[id] = Math.max(0, Math.min(QUESTS[id].steps, n | 0));
      }
    }
    const next = {
      ...base,
      ...raw,
      q,
      outfit: { ...base.outfit, ...(raw.outfit || {}) },
      heard: Array.isArray(raw.heard) ? raw.heard : [],
    };
    if (next.finished) {
      next.q = freshQuests();
      next.finished = false;
      next.playTime = 0;
      next.introSeen = true;
      next.heard = [];
    }
    return next;
  } catch {
    return base;
  }
}

function save() {
  try {
    localStorage.setItem(SAVE, JSON.stringify({
      q: state.q,
      outfit: player?.outfit || state.outfit,
      lang: state.lang,
      muted: state.muted,
      introSeen: state.introSeen,
      heard: [...heard],
      playTime,
      finished: state.finished,
    }));
  } catch { /* private mode */ }
}

function tr(entry) {
  if (!entry) return '';
  return entry[state.lang] || entry.en || '';
}

function applyLang() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh' : 'en';
  ui.logo.innerHTML = state.lang === 'zh' ? '卵石邮局' : 'PEBBLE<br />POST';
  ui.tag.textContent = tr(COPY.tag);
  ui.hint.textContent = tr(COPY.hint);
  ui.begin.textContent = tr(COPY.begin);
  ui.aboutOpen.textContent = tr(COPY.about);
  ui.aboutBody.textContent = tr(COPY.aboutBody);
  ui.aboutClose.textContent = tr(COPY.close);
  ui.lang.textContent = state.lang === 'zh' ? 'EN' : '中文';
  ui.langMini.textContent = state.lang === 'zh' ? 'EN' : '文';
  ui.listTitle.textContent = tr(COPY.checklist);
  ui.wearTitle.textContent = tr(COPY.wardrobe);
  ui.wearClose.textContent = tr(COPY.close);
  ui.endTitle.textContent = tr(COPY.made);
  ui.endBody.textContent = tr(COPY.madeBody);
  ui.endStay.textContent = tr(COPY.stay);
  ui.endAgain.textContent = tr(COPY.again);
  ui.endCredit.textContent = tr(COPY.credit);
  ui.listBtn.setAttribute('aria-label', tr(COPY.list));
  ui.sound.setAttribute('aria-label', tr(COPY.sound));
  ui.wearBtn.setAttribute('aria-label', tr(COPY.wardrobe));
  ui.emoteBtn.setAttribute('aria-label', tr(COPY.emotes));
  renderList();
  renderSlip();
  if (dialog) renderLine(true);
  const mins = Math.max(1, Math.round(playTime / 60));
  ui.endTime.textContent = state.lang === 'zh' ? `你在外面 ${mins} 分钟。` : `You were out for ${mins} min.`;
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (err) {
  ui.boot.hidden = false;
  ui.boot.textContent = 'WebGL is unavailable in this browser.';
  throw err;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x81bfbc, 105, 240);
scene.background = new THREE.Color(0x81bfbc);
const camera = new THREE.PerspectiveCamera(48, 1, 0.08, 400);
camera.position.set(0, 40, 120);

const hemi = new THREE.HemisphereLight(0xfff6ea, 0x7f9c90, 0.9);
const amb = new THREE.AmbientLight(0xfff4e8, 0.22);
const sun = new THREE.DirectionalLight(0xfff7ee, 1.35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 46;
sun.shadow.camera.left = -16;
sun.shadow.camera.right = 16;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -16;
sun.shadow.bias = -0.00035;
sun.shadow.normalBias = 0.045;
scene.add(hemi, amb, sun, sun.target);

const world = createWorld();
scene.add(world.terrain, world.water, world.props);

const player = createPerson({ look: state.outfit });
scene.add(player.group);
const spawn = world.layout.spawn;
lat = spawn.lat;
lon = spawn.lon;
heading = headingToward(spawn, spotDir('square'));

const actors = [];
for (const npc of world.layout.npcs) {
  const look = LOOKS[npc.id] || randomOutfit();
  if (npc.sit) look.sit = true;
  if (npc.lute) look.lute = true;
  const person = createPerson({ look });
  const mark = markSprite();
  mark.position.y = 2.15;
  mark.visible = false;
  person.group.add(mark);
  inkSkip.push(mark);
  scene.add(person.group);
  actors.push({
    ...npc,
    person,
    mark,
    heading: headingToward({ lat: npc.lat, lon: npc.lon }, spotDir('square')),
    base: 0,
  });
  actors[actors.length - 1].base = actors[actors.length - 1].heading;
}

const loops = {
  loopA: sampleLoop(['ward', 'square', 'span', 'clay', 'span', 'square']),
  loopB: sampleLoop(['square', 'stones', 'falls', 'grove', 'ward']),
  loopC: sampleLoop(['ward', 'works', 'square', 'span', 'square']),
};
const couriers = world.layout.couriers.map((c) => {
  const person = createPerson({ look: randomOutfit() });
  scene.add(person.group);
  const actor = {
    id: c.id,
    person,
    lat: 0,
    lon: 0,
    heading: 0,
    base: 0,
    phase: c.phase,
    speed: c.speed,
    points: loops[c.road],
    emoteIn: 4 + Math.random() * 6,
    mark: null,
  };
  actors.push(actor);
  return actor;
});

const birds = new THREE.Group();
for (let i = 0; i < 5; i += 1) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.2), new THREE.MeshToonMaterial({ color: 0xf7f4ee }));
  b.userData.i = i;
  birds.add(b);
}
scene.add(birds);

const normalMat = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vN;
    void main() {
      vN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vN;
    void main() {
      gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, gl_FragCoord.z);
    }
  `,
});
const composite = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: null },
    tNormal: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tColor;
    uniform sampler2D tNormal;
    uniform vec2 uRes;
    varying vec2 vUv;
    void main() {
      vec3 col = texture2D(tColor, vUv).rgb;
      vec2 px = 1.0 / uRes;
      vec4 c0 = texture2D(tNormal, vUv);
      float edge = 0.0;
      vec4 n1 = texture2D(tNormal, vUv + vec2(px.x, 0.0));
      vec4 n2 = texture2D(tNormal, vUv + vec2(-px.x, 0.0));
      vec4 n3 = texture2D(tNormal, vUv + vec2(0.0, px.y));
      vec4 n4 = texture2D(tNormal, vUv + vec2(0.0, -px.y));
      float depthE = max(max(abs(c0.a - n1.a), abs(c0.a - n2.a)), max(abs(c0.a - n3.a), abs(c0.a - n4.a)));
      float normE = max(max(distance(c0.rgb, n1.rgb), distance(c0.rgb, n2.rgb)), max(distance(c0.rgb, n3.rgb), distance(c0.rgb, n4.rgb)));
      edge = max(smoothstep(0.02, 0.055, depthE), smoothstep(0.12, 0.3, normE));
      float gap = fract(sin(dot(floor(gl_FragCoord.xy / 3.0), vec2(19.1, 73.7))) * 43758.5);
      if (gap > 0.84) edge *= 0.2;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l), col, 1.16);
      col *= vec3(1.05, 1.02, 0.96);
      col = mix(col, vec3(0.42, 0.62, 0.58), 0.05);
      col = mix(col, vec3(0.216, 0.247, 0.259), clamp(edge, 0.0, 1.0));
      col = mix(col * 12.92, 1.055 * pow(max(col, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), col));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
const beautyTarget = new THREE.WebGLRenderTarget(2, 2);
const normalTarget = new THREE.WebGLRenderTarget(2, 2);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), composite);
const quadScene = new THREE.Scene();
quadScene.add(quad);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const emoteTextures = Object.fromEntries(EMOTES.map((e) => [e.id, drawEmote(e.id)]));
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const camDesired = new THREE.Vector3();
const lookDesired = new THREE.Vector3();
const upDesired = new THREE.Vector3();
const camPos = new THREE.Vector3(0, 80, 140);
let camReady = false;
let phone = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches;
let lowFps = 0;

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  phone = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches;
  camera.aspect = w / Math.max(1, h);
  camera.fov = phone ? 56 : 48;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  const pr = renderer.getPixelRatio();
  beautyTarget.setSize(w * pr, h * pr);
  normalTarget.setSize(w * pr, h * pr);
  composite.uniforms.uRes.value.set(w * pr, h * pr);
}
window.addEventListener('resize', resize);
resize();

applyLang();
buildWardrobe();
buildEmotes();
ui.sound.classList.toggle('on', !state.muted);
ui.sound.setAttribute('aria-pressed', state.muted ? 'false' : 'true');

ui.begin.addEventListener('click', beginGame);
ui.lang.addEventListener('click', toggleLang);
ui.langMini.addEventListener('click', toggleLang);
ui.aboutOpen.addEventListener('click', () => show(ui.about, true));
ui.aboutClose.addEventListener('click', () => show(ui.about, false));
ui.listBtn.addEventListener('click', () => { listOpen = !listOpen; show(ui.list, listOpen); renderList(); });
ui.sound.addEventListener('click', () => {
  state.muted = !state.muted;
  audio.setMuted(state.muted);
  ui.sound.classList.toggle('on', !state.muted);
  ui.sound.setAttribute('aria-pressed', state.muted ? 'false' : 'true');
  save();
});
ui.wearBtn.addEventListener('click', () => {
  wardrobeOpen = !wardrobeOpen;
  show(ui.wardrobe, wardrobeOpen);
  if (wardrobeOpen) { emoteOpen = false; show(ui.emotes, false); }
});
ui.wearClose.addEventListener('click', () => { wardrobeOpen = false; show(ui.wardrobe, false); });
ui.emoteBtn.addEventListener('click', () => {
  emoteOpen = !emoteOpen;
  show(ui.emotes, emoteOpen);
  if (emoteOpen) { wardrobeOpen = false; show(ui.wardrobe, false); }
});
ui.dlgNext.addEventListener('click', (e) => { e.stopPropagation(); advanceDialog(); });
ui.dialogue.addEventListener('click', advanceDialog);
ui.slipPrev.addEventListener('click', () => cycleSlip(-1));
ui.slipNext.addEventListener('click', () => cycleSlip(1));
ui.endStay.addEventListener('click', () => {
  state.finished = true;
  save();
  show(ui.ending, false);
});
ui.endAgain.addEventListener('click', () => {
  state.q = freshQuests();
  state.finished = false;
  playTime = 0;
  heard.clear();
  slipFocus = null;
  show(ui.ending, false);
  save();
  renderList();
  renderSlip();
});

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Enter' && mode === 'title' && !e.repeat) beginGame();
  const playing = mode === 'play' && ui.ending.hidden;
  if ((e.code === 'KeyE' || e.code === 'Enter') && playing && !dialog && !wardrobeOpen && !e.repeat) tryTalk(nearestActor());
  if ((e.code === 'Space' || e.code === 'Enter') && dialog && !e.repeat) advanceDialog();
  else if (e.code === 'Space' && playing && !dialog && !wardrobeOpen) jumpQueued = true;
  if (playing && !e.repeat && e.code === 'KeyL') ui.wearBtn.click();
  if (playing && !e.repeat && e.code === 'KeyJ') ui.listBtn.click();
  if (playing && !e.repeat && e.code === 'KeyK') ui.emoteBtn.click();
  if (playing && !e.repeat && e.code === 'KeyM') ui.sound.click();
  if (e.code === 'Escape') {
    wardrobeOpen = false; listOpen = false; emoteOpen = false;
    show(ui.wardrobe, false); show(ui.list, false); show(ui.emotes, false); show(ui.about, false);
  }
  if (!e.repeat && mode === 'play' && !dialog) {
    const digit = e.code.startsWith('Digit') ? Number(e.code.slice(5)) : NaN;
    if (digit >= 0 && digit <= 9) spawnEmote(player.group, EMOTES[digit === 0 ? 9 : digit - 1].id);
  }
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

const clock = new THREE.Clock();
for (const actor of actors) {
  if (!actor.points) faceGroup(actor.person.group, actor.lat, actor.lon, actor.heading, 0);
}
faceGroup(player.group, lat, lon, heading, 0);
for (const courier of couriers) updateCourier(courier, 0);

renderer.setAnimationLoop(onFrame);

function beginGame() {
  if (mode !== 'title') return;
  audio.resume();
  audio.setMuted(state.muted);
  audio.whoosh();
  show(ui.title, false);
  show(ui.about, false);
  ui.listBtn.hidden = false;
  ui.stack.hidden = false;
  mode = 'descend';
  state.descendStart = performance.now();
  state.camFrom = camera.position.clone();
  state.camUpFrom = camera.up.clone();
  camReady = false;
  faceGroup(player.group, lat, lon, heading, hop);
}

function toggleLang() {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  applyLang();
  save();
}

function onFrame() {
  try {
    const dt = Math.min(0.12, clock.getDelta());
    const time = clock.elapsedTime;
    tickWorld(world, time);
    updateBirds(time);
    if (mode === 'title') titleCamera(time);
    else updatePlay(dt);
    updateCamera(dt);
    updateSun();
    renderFrame(dt);
  } catch (err) {
    renderer.setAnimationLoop(null);
    ui.boot.hidden = false;
    ui.boot.textContent = err && err.message ? err.message : String(err);
    console.error(err);
  }
}

function updatePlay(dt) {
  const talking = !!dialog;
  const canMove = mode === 'play' && !talking && !wardrobeOpen && ui.ending.hidden;
  if (mode === 'descend') {
    state.descend = (performance.now() - state.descendStart) / (reduceMotion ? 700 : 2100);
    if (state.descend >= 1) {
      mode = 'play';
      if (!state.introSeen) openDialog('self', introLines(), null);
    }
  }
  if (mode === 'play') playTime += dt;

  let ix = 0;
  let iz = 0;
  if (canMove) {
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
    if (pointer.joy) {
      ix += pointer.jx || 0;
      iz += pointer.jz || 0;
    }
  }
  const wish = new THREE.Vector3();
  if (pointer.joy) wish.copy(wishVector(ix, iz));
  else if (ix || iz) {
    const facing = orient(lat, lon, heading);
    wish.addScaledVector(new THREE.Vector3(...facing.forward), iz);
    wish.addScaledVector(new THREE.Vector3(...facing.right), ix);
  }
  const heldFor = pointer.held ? performance.now() - pointer.t : 0;
  if (canMove && pointer.held && !pointer.joy && (pointer.drag || heldFor > 160)) mouseWish(wish);
  const east = new THREE.Vector3(...frameOf().east);
  const north = new THREE.Vector3(...frameOf().north);
  const eastM = wish.dot(east);
  const northM = wish.dot(north);
  const mag = Math.hypot(eastM, northM);
  const inWater = relief(lat, lon) < SEA + 0.28;
  const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight') || (pointer.drag && !pointer.joy);
  const speed = (inWater ? 0.62 : 1) * (sprinting ? SPRINT : WALK);
  horizontal = 0;
  if (mag > 0.08 && canMove) {
    const step = speed * dt;
    const next = tryMove(lat, lon, (eastM / mag) * step, (northM / mag) * step, hop, world.layout.colliders);
    lat = next.lat;
    lon = next.lon;
    const targetHeading = Math.atan2(northM, eastM);
    heading = dampAngle(heading, targetHeading, 1 - Math.exp(-12 * dt));
    horizontal = speed * Math.min(1, mag);
  }
  if (jumpQueued && canMove && (onGround || coyote > 0)) {
    vel = inWater ? 5.2 : 6.9;
    onGround = false;
    coyote = 0;
  }
  jumpQueued = false;
  vel -= 24 * dt;
  hop += vel * dt;
  if (hop <= 0) {
    if (!onGround) vel = 0;
    hop = 0;
    onGround = true;
    coyote = 0.12;
  } else {
    onGround = false;
    coyote = Math.max(0, coyote - dt);
  }

  faceGroup(player.group, lat, lon, heading, hop);
  player.update(dt, horizontal, reduceMotion);
  player.setWet(inWater ? 1 : 0, dt);
  player.setParcel(parcelColor(state.q));
  player.setTalking(false);

  for (const courier of couriers) updateCourier(courier, dt);
  for (const actor of actors) {
    if (!actor.points) {
      let face = actor.base;
      if (dialog && dialog.id === actor.id) face = headingToward(actor, { lat, lon });
      actor.heading = dampAngle(actor.heading, face, 1 - Math.exp(-6 * dt));
      faceGroup(actor.person.group, actor.lat, actor.lon, actor.heading, 0);
      actor.person.update(dt, 0, reduceMotion);
      actor.person.setTalking(!!dialog && dialog.id === actor.id && lineShown < lineFull().length);
      if (actor.mark) {
        const marked = hasMark(actor.id, state.q, heard);
        actor.mark.visible = marked;
        actor.mark.position.y = 2.12 + Math.sin(clock.elapsedTime * 2.4 + actor.lat) * 0.06;
      }
    }
  }
  updateEmotes(dt);
  const here = placeAt(lat, lon);
  if ((here?.id || '') !== placeId) {
    placeId = here?.id || '';
    if (here) {
      ui.place.textContent = tr(here);
      ui.place.classList.remove('show');
      void ui.place.offsetWidth;
      ui.place.classList.add('show');
    }
  }
  if (dialog) typeLine(dt);
  const soren = actors.find((a) => a.id === 'soren');
  const sorenPos = point(soren.lat, soren.lon, 1.2);
  const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const toS = new THREE.Vector3(sorenPos[0], sorenPos[1], sorenPos[2]).sub(camera.position);
  audio.update({
    region: placeId,
    sorenDist: arcMeters(lat, lon, soren.lat, soren.lon),
    sorenPan: toS.lengthSq() > 0.001 ? toS.normalize().dot(camRight) : 0,
    moving: horizontal,
    wet: inWater ? 1 : 0,
  });
}

function updateCamera(dt) {
  if (mode === 'title') return;
  const o = orient(lat, lon, heading);
  const up = new THREE.Vector3(...o.up);
  const forward = new THREE.Vector3(...o.forward);
  const right = new THREE.Vector3(...o.right);
  const pos = new THREE.Vector3(...point(lat, lon, hop));
  const head = pos.clone().addScaledVector(up, 1.45);
  if (dialog && dialog.id !== 'self') {
    const npc = actors.find((a) => a.id === dialog.id);
    if (npc) {
      const np = new THREE.Vector3(...point(npc.lat, npc.lon, 1.2));
      const mid = head.clone().lerp(np, 0.48);
      const across = np.clone().sub(head).projectOnPlane(up).normalize();
      const side = new THREE.Vector3().crossVectors(up, across).normalize();
      camDesired.copy(mid).addScaledVector(up, 1.15).addScaledVector(side, 3.5).addScaledVector(across, -0.4);
      lookDesired.copy(mid).addScaledVector(up, 0.15);
    }
  } else if (wardrobeOpen) {
    camDesired.copy(head).addScaledVector(forward, 4.6).addScaledVector(up, 0.05);
    lookDesired.copy(head).addScaledVector(up, -0.55);
  } else {
    const dist = phone ? 7.2 : 8.2;
    camDesired.copy(head)
      .addScaledVector(forward, -dist)
      .addScaledVector(up, phone ? 2.6 : 2.25)
      .addScaledVector(right, phone ? 0 : -0.85);
    lookDesired.copy(head).addScaledVector(forward, phone ? 2.2 : 6.5);
    protectCamera(camDesired, head);
  }
  upDesired.copy(up);
  const k = 1 - Math.exp(-dt * (reduceMotion ? 18 : 7));
  if (mode === 'descend' && !camReady && state.camFrom) {
    const e = ease(Math.min(1, state.descend));
    camera.position.lerpVectors(state.camFrom, camDesired, e);
    camera.up.copy(state.camUpFrom).lerp(upDesired, e).normalize();
    camPos.copy(camera.position);
    camera.lookAt(lookDesired);
    if (state.descend >= 1) camReady = true;
    return;
  }
  camPos.lerp(camDesired, k);
  camera.up.lerp(upDesired, k).normalize();
  camera.position.copy(camPos);
  camera.lookAt(lookDesired);
  camReady = true;
}

function protectCamera(desired, head) {
  for (let n = 0; n < 3; n += 1) {
    const len = desired.length();
    const la = Math.asin(THREE.MathUtils.clamp(desired.y / len, -1, 1));
    const lo = Math.atan2(desired.x, desired.z);
    const above = len - surfaceRadius(la, lo);
    if (above < 0.7) desired.copy(head).lerp(desired, 0.72);
    else if (above < 4 && worldHit(la, lo, above)) desired.lerp(head, 0.45);
    else break;
  }
}

function worldHit(la, lo, above) {
  return world.layout.colliders.some((c) => arcMeters(la, lo, c.lat, c.lon) < c.radius + 0.4 && above < c.height);
}

function titleCamera(time) {
  const lonT = time * 0.18;
  const latT = 0.35 + Math.sin(time * 0.15) * 0.08;
  const dir = new THREE.Vector3(...point(latT, lonT, 0)).normalize();
  camera.up.set(0, 1, 0);
  camera.position.copy(dir.multiplyScalar(R + 86));
  camera.lookAt(0, 0, 0);
  camPos.copy(camera.position);
}

function updateSun() {
  const o = orient(lat, lon, heading);
  const up = new THREE.Vector3(...o.up);
  const right = new THREE.Vector3(...o.right);
  const forward = new THREE.Vector3(...o.forward);
  const dir = new THREE.Vector3()
    .addScaledVector(up, 0.86)
    .addScaledVector(right, 0.32)
    .addScaledVector(forward, -0.28)
    .normalize();
  const p = new THREE.Vector3(...point(lat, lon, 1.2));
  sun.target.position.copy(p);
  sun.position.copy(p).addScaledVector(dir, 22);
  sun.target.updateMatrixWorld();
}

function renderFrame(dt) {
  for (const obj of inkSkip) {
    obj.userData.was = obj.visible;
    obj.visible = false;
  }
  for (const item of emoteLive) item.sprite.visible = false;
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(normalTarget);
  renderer.setClearColor(0x8080ff, 1);
  scene.overrideMaterial = normalMat;
  renderer.render(scene, camera);
  scene.overrideMaterial = null;
  for (const obj of inkSkip) obj.visible = obj.userData.was;
  for (const item of emoteLive) item.sprite.visible = true;
  renderer.shadowMap.enabled = true;
  renderer.setRenderTarget(beautyTarget);
  renderer.setClearColor(0x81bfbc, 1);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  composite.uniforms.tColor.value = beautyTarget.texture;
  composite.uniforms.tNormal.value = normalTarget.texture;
  renderer.render(quadScene, ortho);
  const fps = 1 / Math.max(dt, 0.0001);
  if (fps < 38) lowFps += 1;
  else lowFps = Math.max(0, lowFps - 1);
  if (lowFps > 40 && renderer.getPixelRatio() > 1) {
    renderer.setPixelRatio(1);
    sun.shadow.mapSize.set(512, 512);
    resize();
    lowFps = 0;
  }
}

function wishVector(ix, iz) {
  const f = frameOf();
  const up = new THREE.Vector3(...f.up);
  const camF = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2).multiplyScalar(-1).projectOnPlane(up);
  const camR = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).projectOnPlane(up);
  if (camF.lengthSq() < 1e-5) return new THREE.Vector3();
  camF.normalize();
  camR.normalize();
  return new THREE.Vector3().addScaledVector(camF, iz).addScaledVector(camR, ix);
}

function mouseWish(wish) {
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObject(world.terrain, false)[0];
  if (!hit) return;
  const f = frameOf();
  const up = new THREE.Vector3(...f.up);
  const delta = hit.point.clone().sub(new THREE.Vector3(...point(lat, lon, hop))).projectOnPlane(up);
  if (delta.length() < 1.2) return;
  wish.add(delta.normalize().multiplyScalar(1.15));
}

function frameOf() {
  return frameLat(lat, lon);
}

function frameLat(a, b) {
  return frame(a, b);
}

function faceGroup(group, a, b, head, lift) {
  const p = point(a, b, lift);
  const o = orient(a, b, head);
  group.position.set(p[0], p[1], p[2]);
  const z = new THREE.Vector3(-o.forward[0], -o.forward[1], -o.forward[2]);
  const basis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(o.right[0], o.right[1], o.right[2]),
    new THREE.Vector3(o.up[0], o.up[1], o.up[2]),
    z,
  );
  group.quaternion.setFromRotationMatrix(basis);
}

function headingToward(from, to) {
  const f = frame(from.lat, from.lon);
  const a = point(from.lat, from.lon, 0);
  const b = point(to.lat, to.lon, 0);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  return Math.atan2(vdot(d, f.north), vdot(d, f.east));
}

function dampAngle(a, b, t) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * Math.min(1, Math.max(0, t));
}

function updateCourier(courier, dt) {
  const pts = courier.points;
  if (!pts.length) return;
  const hopDist = courier.speed * dt;
  courier.phase = (courier.phase + hopDist / Math.max(1, pts.length * 2)) % 1;
  const f = courier.phase * pts.length;
  const i = Math.floor(f) % pts.length;
  const j = (i + 1) % pts.length;
  const p = pts[i];
  const n = pts[j];
  courier.lat = p.lat;
  courier.lon = p.lon;
  courier.heading = headingToward(p, n);
  faceGroup(courier.person.group, courier.lat, courier.lon, courier.heading, 0);
  courier.person.update(dt, courier.speed, reduceMotion);
  courier.emoteIn -= dt;
  if (courier.emoteIn < 0) {
    spawnEmote(courier.person.group, EMOTES[(Math.random() * EMOTES.length) | 0].id);
    courier.emoteIn = 7 + Math.random() * 8;
  }
}

function sampleLoop(ids) {
  const pts = [];
  for (let i = 0; i < ids.length; i += 1) {
    const a = spotDir(ids[i]);
    const b = spotDir(ids[(i + 1) % ids.length]);
    const dist = arcMeters(a.lat, a.lon, b.lat, b.lon);
    const steps = Math.max(1, Math.ceil(dist / 2));
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const da = point(a.lat, a.lon, 0);
      const db = point(b.lat, b.lon, 0);
      const x = da[0] * (1 - t) + db[0] * t;
      const y = da[1] * (1 - t) + db[1] * t;
      const z = da[2] * (1 - t) + db[2] * t;
      const len = Math.hypot(x, y, z) || 1;
      const latP = Math.asin(THREE.MathUtils.clamp(y / len, -1, 1));
      const lonP = Math.atan2(x, z);
      const side = i % 2 === 0 ? 1.7 : -1.7;
      pts.push(moveMeters(latP, lonP, side, 0));
    }
  }
  return pts;
}

function onPointerDown(e) {
  if (mode === 'title') return;
  pointer.id = e.pointerId;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.sx = e.clientX;
  pointer.sy = e.clientY;
  pointer.t = performance.now();
  pointer.drag = false;
  pointer.held = true;
  pointer.touch = e.pointerType === 'touch';
  pointer.joy = pointer.touch;
  setNdc(e);
  canvas.setPointerCapture?.(e.pointerId);
}

function onPointerMove(e) {
  if (pointer.id !== e.pointerId) return;
  setNdc(e);
  const dx = e.clientX - pointer.sx;
  const dy = e.clientY - pointer.sy;
  if (dx * dx + dy * dy > 36) pointer.drag = true;
  if (pointer.joy && pointer.drag) {
    ui.joy.hidden = false;
    ui.joy.style.left = `${pointer.sx}px`;
    ui.joy.style.top = `${pointer.sy}px`;
    const cx = Math.max(-1, Math.min(1, dx / 56));
    const cy = Math.max(-1, Math.min(1, dy / 56));
    ui.knob.style.left = `${42 + cx * 36}px`;
    ui.knob.style.top = `${42 + cy * 36}px`;
    pointer.jx = cx;
    pointer.jz = -cy;
  }
}

function onPointerUp(e) {
  if (pointer.id !== e.pointerId) return;
  const quick = performance.now() - pointer.t < 280 && !pointer.drag;
  if (quick && mode === 'play') {
    setNdc(e);
    const npc = npcUnderCursor();
    if (npc) tryTalk(npc);
    else if (pointer.touch && !dialog && !wardrobeOpen && ui.ending.hidden) jumpQueued = true;
  }
  pointer.id = null;
  pointer.drag = false;
  pointer.held = false;
  pointer.joy = false;
  pointer.touch = false;
  pointer.jx = 0;
  pointer.jz = 0;
  ui.joy.hidden = true;
}

function setNdc(e) {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function npcUnderCursor() {
  raycaster.setFromCamera(ndc, camera);
  const roots = actors.map((a) => a.person.group);
  const hits = raycaster.intersectObjects(roots, true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && !actors.some((a) => a.person.group === obj)) obj = obj.parent;
  const actor = actors.find((a) => a.person.group === obj);
  if (!actor) return null;
  if (arcMeters(lat, lon, actor.lat, actor.lon) > 8) return null;
  return actor;
}

function nearestActor() {
  let best = null;
  let bestD = 3.4;
  let marked = null;
  let markedD = 3.4;
  for (const actor of actors) {
    const d = arcMeters(lat, lon, actor.lat, actor.lon);
    if (d < bestD) { best = actor; bestD = d; }
    if (d < markedD && hasMark(actor.id, state.q, heard)) { marked = actor; markedD = d; }
  }
  return marked || best;
}

function tryTalk(actor) {
  if (!actor || dialog) return;
  if (arcMeters(lat, lon, actor.lat, actor.lon) > 3.6 && actor !== npcUnderCursor()) return;
  const result = talk(actor.id, state.q);
  openDialog(actor.id, result.lines, result.patch);
}

function openDialog(id, lines, patch) {
  dialog = { id, lines, i: 0, patch };
  lineShown = 0;
  lineStamp = 0;
  const meta = NPCS[id];
  ui.dlgTab.textContent = meta ? tr(meta.name) : '';
  ui.dlgTab.style.background = meta?.color || '#66bde6';
  show(ui.dialogue, true);
  renderLine(false);
  ui.live.textContent = lineFull();
}

function lineFull() {
  if (!dialog) return '';
  return tr(dialog.lines[dialog.i]);
}

function renderLine(full) {
  const text = lineFull();
  ui.dlgText.textContent = full ? text : text.slice(0, lineShown);
}

function typeLine(dt) {
  const text = lineFull();
  if (lineShown >= text.length) return;
  lineStamp += dt;
  const step = text.length > 0 && /[\u3400-\u9fff]/.test(text) ? 12 : 35;
  while (lineStamp > 1 / step && lineShown < text.length) {
    lineShown += 1;
    lineStamp -= 1 / step;
    if (lineShown % 2 === 0) audio.blip(dialog.id === 'self' ? 460 : 380 + (dialog.id.length * 17) % 180);
  }
  ui.dlgText.textContent = text.slice(0, lineShown);
}

function advanceDialog() {
  if (!dialog) return;
  const text = lineFull();
  if (lineShown < text.length) {
    lineShown = text.length;
    ui.dlgText.textContent = text;
    return;
  }
  dialog.i += 1;
  if (dialog.i >= dialog.lines.length) closeDialog();
  else {
    lineShown = 0;
    lineStamp = 0;
    renderLine(false);
    ui.live.textContent = lineFull();
  }
}

function closeDialog() {
  const closing = dialog;
  dialog = null;
  show(ui.dialogue, false);
  if (!closing) return;
  if (closing.id === 'self') {
    state.introSeen = true;
  } else if (closing.patch) {
    const doneBefore = allDone(state.q);
    Object.assign(state.q, closing.patch);
    const key = Object.keys(closing.patch)[0];
    if (activeQuests(state.q).includes(key)) slipFocus = key;
    if (!doneBefore && allDone(state.q)) openEnding();
  } else {
    heard.add(closing.id);
  }
  save();
  renderList();
  renderSlip();
}

function openEnding() {
  state.finished = false;
  const mins = Math.max(1, Math.round(playTime / 60));
  ui.endTime.textContent = state.lang === 'zh' ? `你在外面 ${mins} 分钟。` : `You were out for ${mins} min.`;
  show(ui.ending, true);
}

function renderList() {
  ui.tasks.replaceChildren();
  for (const id of QUEST_ORDER) {
    const quest = QUESTS[id];
    const step = state.q[id];
    const li = document.createElement('li');
    li.className = `task${step >= quest.steps ? ' done' : ''}${step === 0 ? ' wait' : ''}`;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = tr(quest.title);
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = `(${Math.min(step, quest.steps)}/${quest.steps})`;
    li.append(name, count);
    ui.tasks.append(li);
  }
}

function renderSlip() {
  const active = activeQuests(state.q);
  if (!active.length || dialog) {
    show(ui.slip, false);
    return;
  }
  if (!active.includes(slipFocus)) slipFocus = active[active.length - 1];
  const step = state.q[slipFocus];
  const text = objective(slipFocus, step);
  if (!text) {
    show(ui.slip, false);
    return;
  }
  const carrying = parcelColor(state.q) === QUESTS[slipFocus].color;
  ui.slipTab.textContent = tr(carrying ? COPY.received : COPY.next);
  ui.slipTab.style.background = QUESTS[slipFocus].color;
  ui.slipText.textContent = tr(text);
  const many = active.length > 1;
  ui.slipPrev.hidden = !many;
  ui.slipNext.hidden = !many;
  show(ui.slip, true);
}

function cycleSlip(dir) {
  const active = activeQuests(state.q);
  if (active.length < 2) return;
  let i = active.indexOf(slipFocus);
  if (i < 0) i = 0;
  slipFocus = active[(i + dir + active.length) % active.length];
  renderSlip();
}

function buildWardrobe() {
  const rows = [
    ['hair', COPY.hair, 7],
    ['top', COPY.top, TOP_STYLES.length],
    ['bottom', COPY.bottom, BOTTOM_STYLES.length],
    ['shoes', COPY.shoes, SHOE_STYLES.length],
  ];
  for (const [key, label, count] of rows) {
    const row = document.createElement('div');
    row.className = 'wear-row hand';
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.textContent = '‹';
    const name = document.createElement('span');
    name.textContent = tr(label);
    name.dataset.key = key;
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '›';
    prev.addEventListener('click', () => cycleWear(key, -1, count));
    next.addEventListener('click', () => cycleWear(key, 1, count));
    row.append(prev, name, next);
    ui.wearRows.append(row);
  }
}

function cycleWear(key, dir, count) {
  const outfit = player.outfit;
  outfit[key] = (outfit[key] + dir + count) % count;
  player.setOutfit(outfit);
  state.outfit = player.outfit;
  save();
}

function buildEmotes() {
  EMOTES.forEach((emote, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emoteGlyph(emote.id);
    btn.setAttribute('aria-label', tr(emote));
    btn.addEventListener('click', () => {
      spawnEmote(player.group, emote.id);
      emoteOpen = false;
      show(ui.emotes, false);
    });
    btn.dataset.index = String(index);
    ui.emoteGrid.append(btn);
  });
}

function spawnEmote(anchor, id) {
  const mat = new THREE.SpriteMaterial({ map: emoteTextures[id], depthWrite: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.72, 0.72, 0.72);
  scene.add(sprite);
  emoteLive.push({ sprite, anchor, age: 0 });
  audio.blip(640);
}

function updateEmotes(dt) {
  for (let i = emoteLive.length - 1; i >= 0; i -= 1) {
    const item = emoteLive[i];
    item.age += dt;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(item.anchor.quaternion);
    item.sprite.position.copy(item.anchor.position).addScaledVector(up, 1.9 + item.age * 0.45);
    const fade = item.age > 1.35 ? 1 - (item.age - 1.35) / 0.55 : 1;
    item.sprite.material.opacity = Math.max(0, fade);
    if (item.age > 1.9) {
      item.sprite.removeFromParent();
      item.sprite.material.dispose();
      emoteLive.splice(i, 1);
    }
  }
}

function updateBirds(time) {
  birds.children.forEach((bird, i) => {
    const a = time * 0.22 + i * 1.3;
    const p = point(0.42 + Math.sin(a) * 0.12, a, 9 + Math.sin(time * 1.4 + i) * 1.4);
    bird.position.set(p[0], p[1], p[2]);
    bird.lookAt(0, 0, 0);
    bird.rotation.z += Math.sin(time * 9 + i) * 0.02;
  });
}

function markSprite() {
  const mat = new THREE.SpriteMaterial({ map: drawEmote('mark'), depthWrite: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.48, 0.48, 0.48);
  return sprite;
}

function drawEmote(id) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f8f8f8';
  g.beginPath();
  g.arc(64, 64, 58, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#373f42';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.fillStyle = '#de794e';
  if (id === 'mark') {
    g.fillStyle = '#373f42';
    for (const x of [36, 64, 92]) {
      g.beginPath();
      g.arc(x, 66, 7, 0, Math.PI * 2);
      g.fill();
    }
  } else if (id === 'heart') {
    g.beginPath();
    g.moveTo(64, 92);
    g.bezierCurveTo(20, 70, 28, 36, 64, 52);
    g.bezierCurveTo(100, 36, 108, 70, 64, 92);
    g.fill();
  } else if (id === 'star') {
    g.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      const b = a + Math.PI / 5;
      g.lineTo(64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34);
      g.lineTo(64 + Math.cos(b) * 14, 64 + Math.sin(b) * 14);
    }
    g.closePath();
    g.fillStyle = '#f3c258';
    g.fill();
  } else if (id === 'sun') {
    g.fillStyle = '#f2c84b';
    g.beginPath();
    g.arc(64, 64, 18, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#de794e';
    for (let i = 0; i < 8; i += 1) {
      const a = i / 8 * Math.PI * 2;
      g.beginPath();
      g.moveTo(64 + Math.cos(a) * 26, 64 + Math.sin(a) * 26);
      g.lineTo(64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40);
      g.stroke();
    }
  } else if (id === 'tea') {
    g.strokeStyle = '#373f42';
    g.strokeRect(34, 48, 40, 30);
    g.beginPath();
    g.arc(78, 62, 10, -1, 1);
    g.stroke();
    g.fillStyle = '#8cc48c';
    g.fillRect(40, 54, 28, 8);
  } else if (id === 'flower') {
    g.fillStyle = '#c25959';
    for (let i = 0; i < 5; i += 1) {
      const a = i / 5 * Math.PI * 2;
      g.beginPath();
      g.arc(64 + Math.cos(a) * 16, 64 + Math.sin(a) * 16, 12, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#f3c258';
    g.beginPath();
    g.arc(64, 64, 8, 0, Math.PI * 2);
    g.fill();
  } else if (id === 'fish') {
    g.fillStyle = '#66bde6';
    g.beginPath();
    g.ellipse(60, 64, 26, 14, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(86, 64);
    g.lineTo(108, 50);
    g.lineTo(108, 78);
    g.fill();
  } else if (id === 'moon') {
    g.fillStyle = '#f7f4ee';
    g.beginPath();
    g.arc(70, 64, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#81bfbc';
    g.beginPath();
    g.arc(82, 56, 22, 0, Math.PI * 2);
    g.fill();
  } else if (id === 'spark') {
    g.strokeStyle = '#de794e';
    g.beginPath();
    g.moveTo(64, 28);
    g.lineTo(64, 100);
    g.moveTo(28, 64);
    g.lineTo(100, 64);
    g.moveTo(40, 40);
    g.lineTo(88, 88);
    g.moveTo(88, 40);
    g.lineTo(40, 88);
    g.stroke();
  } else if (id === 'note') {
    g.fillStyle = '#373f42';
    g.beginPath();
    g.ellipse(52, 86, 12, 9, -0.4, 0, Math.PI * 2);
    g.fill();
    g.fillRect(62, 36, 5, 50);
    g.beginPath();
    g.moveTo(67, 36);
    g.lineTo(96, 28);
    g.lineTo(96, 40);
    g.lineTo(67, 48);
    g.fill();
  } else {
    g.strokeStyle = '#373f42';
    g.beginPath();
    g.arc(48, 70, 10, 0.2, Math.PI - 0.2);
    g.stroke();
    g.beginPath();
    g.moveTo(58, 62);
    g.quadraticCurveTo(78, 28, 96, 58);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function emoteGlyph(id) {
  return { wave: '👋', heart: '♥', star: '★', sun: '☀', tea: '茶', flower: '❀', fish: '鱼', moon: '月', spark: '✦', note: '♪' }[id] || '•';
}

function show(el, on) {
  el.hidden = !on;
  el.classList.toggle('hidden', !on);
}

function ease(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return 1 - (1 - x) ** 3;
}
