import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import '@fontsource/lilita-one/latin.css';
import '@fontsource/patrick-hand/latin.css';
import '@fontsource/ma-shan-zheng/chinese-simplified.css';
import { createPerson, LOOKS } from './person.js';
import { NPCS } from './content.js';

const CAST = ['nia', 'ren', 'moss', 'lila', 'bo', 'jun', 'jin', 'plum', 'calm', 'rao', 'soren', 'vendor', 'student', 'watch', 'nova'];
const params = new URLSearchParams(location.search);
const canvas = document.querySelector('#c');
const who = document.querySelector('#who');
const castEl = document.querySelector('#cast');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x81bfbc);
scene.fog = new THREE.Fog(0x81bfbc, 28, 70);

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.05, 0);
controls.enablePan = false;
controls.minDistance = 1.8;
controls.maxDistance = 46;
controls.maxPolarAngle = Math.PI * 0.49;
controls.update();

scene.add(new THREE.HemisphereLight(0xfff6ea, 0x6f9088, 0.85));
scene.add(new THREE.AmbientLight(0xfff4e8, 0.18));
const sun = new THREE.DirectionalLight(0xfff7ee, 1.25);
sun.position.set(-4, 8, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 28;
sun.shadow.camera.left = -14;
sun.shadow.camera.right = 14;
sun.shadow.camera.top = 14;
sun.shadow.camera.bottom = -8;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshToonMaterial({ color: 0xc5ddd6 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const rig = new THREE.Group();
scene.add(rig);
const people = CAST.map((id, i) => {
  const person = createPerson({ look: LOOKS[id] });
  person.group.position.x = (i - (CAST.length - 1) / 2) * 1.7;
  rig.add(person.group);
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = NPCS[id].name.en;
  button.addEventListener('click', () => select(i, true));
  castEl.appendChild(button);
  return { id, person, button };
});

const buttons = {
  walk: document.querySelector('#walk'),
  turn: document.querySelector('#turn'),
  parcel: document.querySelector('#parcel'),
  wet: document.querySelector('#wet'),
  lineup: document.querySelector('#lineup'),
};

let index = Math.max(0, CAST.indexOf(params.get('id') || 'nia'));
let lineup = params.has('lineup');
let walking = params.has('walk');
let turning = params.has('turn');
let showParcel = params.has('parcel');
let wet = params.has('wet');
const yaw = (Number(params.get('yaw')) || 0) * Math.PI / 180;
const dist = Number(params.get('dist')) || 5.2;
const lookY = Number(params.get('look')) || 0.88;

function frame(hero) {
  if (lineup) {
    camera.position.set(0, 6.2, -38);
    controls.target.set(0, 0.95, 0);
  } else if (hero) {
    const d = dist;
    camera.position.set(Math.sin(yaw) * d, lookY + 0.42, -Math.cos(yaw) * d);
    controls.target.set(0, lookY, 0);
  }
  controls.update();
}

function select(i, fromClick) {
  index = (i + people.length) % people.length;
  if (fromClick) lineup = false;
  const current = people[index];
  who.textContent = `${NPCS[current.id].name.en}  ·  ${NPCS[current.id].name.zh}  ·  ${NPCS[current.id].role.en}`;
  people.forEach((entry, n) => {
    entry.button.classList.toggle('on', n === index && !lineup);
    entry.person.group.visible = lineup || n === index;
    if (!lineup && n === index) entry.person.group.position.x = 0;
    if (lineup) entry.person.group.position.x = (n - (people.length - 1) / 2) * 1.7;
  });
  buttons.lineup.classList.toggle('on', lineup);
  if (fromClick || !params.has('yaw')) frame(!fromClick);
  else frame(true);
}

function paintModes() {
  buttons.walk.classList.toggle('on', walking);
  buttons.turn.classList.toggle('on', turning);
  buttons.parcel.classList.toggle('on', showParcel);
  buttons.wet.classList.toggle('on', wet);
  buttons.lineup.classList.toggle('on', lineup);
}

buttons.walk.addEventListener('click', () => { walking = !walking; paintModes(); });
buttons.turn.addEventListener('click', () => { turning = !turning; paintModes(); });
buttons.parcel.addEventListener('click', () => { showParcel = !showParcel; paintModes(); });
buttons.wet.addEventListener('click', () => { wet = !wet; paintModes(); });
buttons.lineup.addEventListener('click', () => {
  lineup = !lineup;
  paintModes();
  select(index, false);
  frame(true);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') select(index + 1, true);
  if (event.key === 'ArrowLeft') select(index - 1, true);
});

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
      vec4 n1 = texture2D(tNormal, vUv + vec2(px.x, 0.0));
      vec4 n2 = texture2D(tNormal, vUv + vec2(-px.x, 0.0));
      vec4 n3 = texture2D(tNormal, vUv + vec2(0.0, px.y));
      vec4 n4 = texture2D(tNormal, vUv + vec2(0.0, -px.y));
      float depthE = max(max(abs(c0.a - n1.a), abs(c0.a - n2.a)), max(abs(c0.a - n3.a), abs(c0.a - n4.a)));
      float normE = max(max(distance(c0.rgb, n1.rgb), distance(c0.rgb, n2.rgb)), max(distance(c0.rgb, n3.rgb), distance(c0.rgb, n4.rgb)));
      float edge = max(smoothstep(0.02, 0.055, depthE), smoothstep(0.18, 0.38, normE));
      float gap = fract(sin(dot(floor(gl_FragCoord.xy / 3.0), vec2(19.1, 73.7))) * 43758.5);
      if (gap > 0.84) edge *= 0.2;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l), col, 1.16);
      col *= vec3(1.05, 1.02, 0.96);
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

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  const pr = renderer.getPixelRatio();
  beautyTarget.setSize(w * pr, h * pr);
  normalTarget.setSize(w * pr, h * pr);
  composite.uniforms.uRes.value.set(w * pr, h * pr);
}
window.addEventListener('resize', resize);
resize();

paintModes();
select(index, false);
frame(true);
if (params.has('bare')) document.querySelector('.hud').style.display = 'none';

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (turning && !lineup) people[index].person.group.rotation.y += dt * 0.45;
  for (const entry of people) {
    if (!entry.person.group.visible) continue;
    const speed = walking && !entry.person.outfit.sit ? 2.4 : 0;
    entry.person.setParcel(showParcel && !entry.person.outfit.lute ? '#f3c258' : null);
    entry.person.setWet(wet ? 1 : 0, dt);
    entry.person.update(dt, speed, false);
  }
  controls.update();
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(normalTarget);
  renderer.setClearColor(0x8080ff, 1);
  scene.overrideMaterial = normalMat;
  renderer.render(scene, camera);
  scene.overrideMaterial = null;
  renderer.shadowMap.enabled = true;
  renderer.setRenderTarget(beautyTarget);
  renderer.setClearColor(0x81bfbc, 1);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  composite.uniforms.tColor.value = beautyTarget.texture;
  composite.uniforms.tNormal.value = normalTarget.texture;
  renderer.render(quadScene, ortho);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
