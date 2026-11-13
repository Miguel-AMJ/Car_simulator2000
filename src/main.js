import * as THREE from 'three';
import './style.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignora falhas em ambientes sem suporte ou sem HTTPS.
    });
  });
}

const root = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d8df');
scene.fog = new THREE.Fog('#a9d8df', 100, 310);
const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 700);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#e7fbff', '#54745d', 2));
const sun = new THREE.DirectionalLight('#fff0c9', 3.2);
sun.position.set(-45, 80, 35);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: '#91b77c', roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.55;
scene.add(ground);

const coursePoints = [
  [-56, -8], [-48, -42], [-18, -65], [21, -62], [54, -39],
  [60, -8], [48, 22], [62, 49], [34, 65], [0, 60],
  [-28, 54], [-58, 34], [-68, 8],
].map(([x, z]) => new THREE.Vector3(x, 0, z));
const track = new THREE.CatmullRomCurve3(coursePoints, true, 'catmullrom', 0.45);
const trackLength = track.getLength();
const roadWidth = 12;

function trackFrame(progress) {
  const u = ((progress % 1) + 1) % 1;
  const point = track.getPointAt(u);
  const tangent = track.getTangentAt(u).normalize();
  return { point, tangent, normal: new THREE.Vector3(-tangent.z, 0, tangent.x) };
}

function makeRibbon(width, material, segments, yOffset = 0) {
  const positions = [];
  const indices = [];
  for (let index = 0; index <= segments; index += 1) {
    const { point, normal } = trackFrame(index / segments);
    positions.push(point.x - normal.x * width / 2, point.y + yOffset, point.z - normal.z * width / 2);
    positions.push(point.x + normal.x * width / 2, point.y + yOffset, point.z + normal.z * width / 2);
    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

makeRibbon(roadWidth + 2.8, new THREE.MeshStandardMaterial({ color: '#d3c5a1', roughness: 1 }), 420, -0.32);
makeRibbon(roadWidth, new THREE.MeshStandardMaterial({ color: '#414947', roughness: 0.96 }), 420, -0.18);
makeRibbon(0.22, new THREE.MeshStandardMaterial({ color: '#e8d999', roughness: 0.9 }), 420, -0.145);

const dashGeometry = new THREE.BoxGeometry(0.16, 0.025, 2.1);
const dashMaterial = new THREE.MeshStandardMaterial({ color: '#f5f0d7', roughness: 0.8 });
for (let index = 0; index < 70; index += 1) {
  const { point, tangent } = trackFrame(index / 70);
  const dash = new THREE.Mesh(dashGeometry, dashMaterial);
  dash.position.set(point.x, -0.12, point.z);
  dash.rotation.y = Math.atan2(tangent.x, tangent.z);
  scene.add(dash);
}

const startLine = new THREE.Group();
for (let index = 0; index < 12; index += 1) {
  const tile = new THREE.Mesh(new THREE.BoxGeometry(roadWidth / 12, 0.035, 1.25), new THREE.MeshStandardMaterial({ color: index % 2 ? '#f5f1df' : '#26312d', roughness: 0.75 }));
  tile.position.set((index - 5.5) * roadWidth / 12, -0.1, 0);
  startLine.add(tile);
}
const startFrame = trackFrame(0.15);
startLine.position.copy(startFrame.point);
startLine.position.y = -0.1;
startLine.rotation.y = Math.atan2(startFrame.tangent.x, startFrame.tangent.z);
scene.add(startLine);

const scenery = new THREE.Group();
const trees = [];
const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6);
const crownGeometry = new THREE.ConeGeometry(1.7, 4.8, 7);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#795b3d', roughness: 1 });
const leafMaterials = ['#49785d', '#5a8863', '#688e62'].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
const branchGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.55, 5);
const branchMaterial = new THREE.MeshStandardMaterial({ color: '#6e5338', roughness: 1 });
const crackMaterial = new THREE.MeshStandardMaterial({ color: '#30251d', roughness: 1 });
const postGeometry = new THREE.BoxGeometry(0.28, 1.1, 0.28);
const postMaterial = new THREE.MeshStandardMaterial({ color: '#fff3d4', roughness: 0.82 });
for (let index = 0; index < 100; index += 1) {
  const { point, normal } = trackFrame(index / 100);
  for (const side of [-1, 1]) {
    const offset = side * (10 + ((index * 17) % 11));
    const x = point.x + normal.x * offset;
    const z = point.z + normal.z * offset;
    if (index % 2 === 0 || side === 1) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.1;
      const crown = new THREE.Mesh(crownGeometry, leafMaterials[index % leafMaterials.length]);
      crown.position.y = 4.2;
      const branches = [];
      for (const branchSide of [-1, 1]) {
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.set(branchSide * 0.55, 2.8 + (index % 3) * 0.35, 0);
        branch.rotation.z = branchSide * -0.75;
        tree.add(branch);
        branches.push(branch);
      }
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.7, 0.035), crackMaterial);
      crack.position.set(0.08, 1.2, 0.22);
      crack.rotation.z = -0.32;
      crack.visible = false;
      tree.add(trunk, crown, crack);
      tree.position.set(x, 0, z);
      const scale = 0.72 + (index % 4) * 0.13;
      tree.scale.setScalar(scale);
      scenery.add(tree);
      trees.push({ tree, crown, branches, crack, x, z, scale, fallen: false });
    } else {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(point.x + normal.x * side * 7.3, 0.3, point.z + normal.z * side * 7.3);
      scenery.add(post);
    }
  }
}
scene.add(scenery);

const hillMaterial = new THREE.MeshStandardMaterial({ color: '#8fae84', roughness: 1 });
for (let index = 0; index < 15; index += 1) {
  const hill = new THREE.Mesh(new THREE.ConeGeometry(24 + (index % 4) * 7, 18 + (index % 3) * 5, 6), hillMaterial);
  const angle = index / 15 * Math.PI * 2;
  hill.position.set(Math.cos(angle) * 180, 5, Math.sin(angle) * 180);
  hill.rotation.y = index * 0.7;
  scene.add(hill);
}

const car = new THREE.Group();
const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#ee684d', metalness: 0.18, roughness: 0.32 });
const bodyGeometry = new THREE.BoxGeometry(2.05, 0.68, 4.05, 8, 4, 12);
const bodyOriginalPositions = bodyGeometry.attributes.position.array.slice();
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.y = 0.92;
car.add(body);
const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.26, 1.18), bodyMaterial);
hood.position.set(0, 1.28, 1.12);
car.add(hood);
const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.75), new THREE.MeshStandardMaterial({ color: '#b8e3e5', metalness: 0.25, roughness: 0.2 }));
cabin.position.set(0, 1.48, -0.45);
car.add(cabin);
const tireMaterial = new THREE.MeshStandardMaterial({ color: '#242827', roughness: 0.85 });
const wheels = [];
for (const x of [-1.03, 1.03]) {
  for (const z of [-1.25, 1.24]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 12), tireMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.55, z);
    car.add(wheel);
    wheels.push({ mesh: wheel, x, z });
  }
}
const lampMaterial = new THREE.MeshStandardMaterial({ color: '#fff2bd', emissive: '#e5c37b', emissiveIntensity: 0.65 });
const headlights = [];
for (const x of [-0.66, 0.66]) {
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.12), lampMaterial);
  lamp.position.set(x, 1.02, 2.04);
  car.add(lamp);
  headlights.push(lamp);
}
const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.22), bodyMaterial);
frontBumper.position.set(0, 0.62, 2.08);
const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.22), bodyMaterial);
rearBumper.position.set(0, 0.62, -2.08);
car.add(frontBumper, rearBumper);
const bumpers = [frontBumper, rearBumper];
scene.add(car);

const smokeMaterial = new THREE.MeshStandardMaterial({ color: '#e2e8df', transparent: true, opacity: 0, depthWrite: false });
const smokeGeometry = new THREE.SphereGeometry(0.28, 7, 6);
const smokePuffs = Array.from({ length: 14 }, () => {
  const puff = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
  puff.visible = false;
  scene.add(puff);
  return { mesh: puff, life: 0, velocity: new THREE.Vector3() };
});

const ui = {
  credits: document.querySelector('#credits'), speed: document.querySelector('#speed'), gear: document.querySelector('#gear'),
  lap: document.querySelector('#lap'), timer: document.querySelector('#timer'), progress: document.querySelector('#progress'),
  modeLabel: document.querySelector('#mode-label'), driftScore: document.querySelector('#drift-score'),
  personalBest: document.querySelector('#personal-best'), welcome: document.querySelector('#welcome-panel'),
  pausePanel: document.querySelector('#pause-panel'), hud: document.querySelector('#game-hud'), feedback: document.querySelector('#drive-feedback'),
  repairButton: document.querySelector('#repair-button'), impactMessage: document.querySelector('#impact-message'),
  assistButton: document.querySelector('#assist-button'), boostButton: document.querySelector('#boost-button'),
  turboCharge: document.querySelector('#turbo-charge'),
};
const storageKey = 'apex-run-save-v1';
let saveData;
try { saveData = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { saveData = {}; }
saveData.credits = Number(saveData.credits) || 0;
saveData.bestSprint = Number(saveData.bestSprint) || 0;
saveData.bestDrift = Number(saveData.bestDrift) || 0;
ui.credits.textContent = saveData.credits.toLocaleString('pt-BR');

const modeNames = { sprint: 'SPRINT · COSTA DOURADA', drift: 'DRIFT ATTACK · COSTA DOURADA', free: 'PASSEIO LIVRE · COSTA DOURADA' };
const modeDurations = { sprint: 90, drift: 60, free: Infinity };
let selectedMode = 'sprint';
let gameState = 'menu';
let elapsed = 0;
let distanceTravelled = 0;
let speed = 0;
let lateralOffset = 0;
let lateralVelocity = 0;
let driftPoints = 0;
let lapStartedAt = 0;
let bestLap = Infinity;
let collisionCooldown = 0;
let carDamage = 0;
let dents = [];
let smokeEmissionTimer = 0;
let assistEnabled = true;
let turboCharge = 100;
let turboActive = false;
const normalSpeedLimit = 64;
const turboSpeedLimit = 82;
const fatalImpactSpeed = 250;
const keys = new Set();
const mobileJoystick = document.querySelector('#mobile-joystick');
const joystickThumb = document.querySelector('#joystick-thumb');
let mobileSteer = 0;
let mobileGas = false;
let mobileBrake = false;
let mobileTurbo = false;
const clock = new THREE.Clock();
let audioContext;
let engineOscillator;
let engineGain;
let soundMuted = false;

function initializeEngineSound() {
  if (!window.AudioContext) return;
  if (!audioContext) {
    audioContext = new AudioContext();
    engineOscillator = audioContext.createOscillator();
    engineGain = audioContext.createGain();
    engineOscillator.type = 'sawtooth';
    engineGain.gain.value = 0;
    engineOscillator.connect(engineGain);
    engineGain.connect(audioContext.destination);
    engineOscillator.start();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
}

function updateEngineSound() {
  if (!audioContext || !engineOscillator || !engineGain) return;
  const now = audioContext.currentTime;
  engineOscillator.frequency.setTargetAtTime(58 + speed * 2.7, now, 0.08);
  const volume = !soundMuted && gameState === 'playing' ? 0.012 + speed / 64 * 0.035 : 0;
  engineGain.gain.setTargetAtTime(volume, now, 0.08);
}

function formatTime(seconds, precision = 1) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
  const wholeSeconds = Math.floor(safe % 60).toString().padStart(2, '0');
  const fraction = Math.floor((safe % 1) * (precision === 3 ? 1000 : 10)).toString().padStart(precision, '0');
  return `${minutes}:${wholeSeconds}.${fraction}`;
}

function refreshBest() {
  ui.personalBest.textContent = selectedMode === 'drift'
    ? (saveData.bestDrift ? `${Math.floor(saveData.bestDrift).toLocaleString('pt-BR')} PTS` : '-- PTS')
    : (selectedMode === 'sprint' && saveData.bestSprint ? formatTime(saveData.bestSprint, 3) : '--:--.---');
}
refreshBest();

document.querySelectorAll('.mode-button').forEach((button) => {
  button.addEventListener('click', () => {
    selectedMode = button.dataset.mode;
    document.querySelectorAll('.mode-button').forEach((item) => item.classList.toggle('is-selected', item === button));
    refreshBest();
  });
});

function setPanel(panel) {
  ui.welcome.classList.toggle('is-hidden', panel !== 'welcome');
  ui.pausePanel.classList.toggle('is-hidden', panel !== 'pause');
  ui.hud.classList.toggle('is-visible', panel === 'game');
  ui.feedback.classList.toggle('is-visible', panel === 'game' && selectedMode === 'drift');
}

function showPause(title, copy) {
  document.querySelector('#result-title').innerHTML = title.replace('\n', '<br />').replace('BOX.', '<em>BOX.</em>');
  document.querySelector('#result-copy').textContent = copy;
  document.querySelector('#result-time').textContent = formatTime(elapsed);
  document.querySelector('#result-score').textContent = Math.floor(driftPoints).toLocaleString('pt-BR');
  document.querySelector('#resume-button span').textContent = title.startsWith('PAUSA') ? 'VOLTAR À PISTA' : 'CORRER DE NOVO';
  setPanel('pause');
}

function rebuildBodyGeometry() {
  const positions = bodyGeometry.attributes.position.array;
  positions.set(bodyOriginalPositions);
  for (const dent of dents) {
    for (let index = 0; index < positions.length; index += 3) {
      const x = bodyOriginalPositions[index];
      const y = bodyOriginalPositions[index + 1];
      const z = bodyOriginalPositions[index + 2];
      const faceCoordinate = dent.axis === 'x' ? x : z;
      if (faceCoordinate * dent.direction < (dent.axis === 'x' ? 0.92 : 1.86)) continue;
      const distance = dent.axis === 'x' ? Math.abs(z - dent.center) : Math.abs(x - dent.center);
      const influence = Math.max(0, 1 - distance / dent.radius);
      const weight = influence * influence * Math.max(0.35, 1 - Math.abs(y) / 0.9);
      if (dent.axis === 'x') positions[index] -= dent.direction * dent.depth * weight;
      else positions[index + 2] -= dent.direction * dent.depth * weight;
      positions[index + 1] -= dent.depth * 0.22 * weight;
    }
  }
  bodyGeometry.attributes.position.needsUpdate = true;
  bodyGeometry.computeVertexNormals();
}

function repairCar(force = false) {
  if (carDamage === 0 || (gameState === 'ended' && !force)) return;
  dents = [];
  carDamage = 0;
  rebuildBodyGeometry();
  body.scale.set(1, 1, 1);
  hood.position.set(0, 1.28, 1.12);
  for (const wheel of wheels) wheel.mesh.visible = true;
  for (const lamp of headlights) lamp.visible = true;
  for (const bumper of bumpers) bumper.visible = true;
  ui.repairButton.disabled = true;
  ui.repairButton.classList.remove('has-damage');
  ui.impactMessage.classList.remove('is-visible');
}

function setAssistEnabled(enabled) {
  assistEnabled = enabled;
  ui.assistButton.classList.toggle('is-active', enabled);
  ui.assistButton.setAttribute('aria-pressed', String(enabled));
  ui.assistButton.setAttribute('aria-label', `Assistência de aceleração automática ${enabled ? 'ativada' : 'desativada'}`);
}

function updateTurboCharge(dt, active) {
  turboActive = active && turboCharge > 0 && gameState === 'playing';
  turboCharge = THREE.MathUtils.clamp(turboCharge + (turboActive ? -38 : 17) * dt, 0, 100);
  if (turboCharge <= 0) turboActive = false;
  ui.turboCharge.style.width = `${turboCharge}%`;
  ui.boostButton.classList.toggle('is-active', turboActive);
  ui.boostButton.classList.toggle('is-empty', turboCharge < 1);
  ui.boostButton.setAttribute('aria-pressed', String(turboActive));
  ui.boostButton.setAttribute('aria-label', turboActive ? 'Turbo ativado' : 'Ativar turbo');
}

function getAssistTargetSpeed(progress, tangent) {
  const lookAhead = THREE.MathUtils.clamp(speed / trackLength * 0.9, 0.012, 0.055);
  const futureTangent = trackFrame(progress + lookAhead).tangent;
  const bend = Math.acos(THREE.MathUtils.clamp(tangent.dot(futureTangent), -1, 1));
  let targetSpeed = THREE.MathUtils.clamp(49 - bend * 25, 25, 49);
  if (Math.abs(lateralVelocity) > 4) targetSpeed = Math.min(targetSpeed, 33);

  const forward = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
  const side = new THREE.Vector3(-forward.z, 0, forward.x);
  for (const treeData of trees) {
    if (treeData.fallen) continue;
    const dx = treeData.x - car.position.x;
    const dz = treeData.z - car.position.z;
    const ahead = dx * forward.x + dz * forward.z;
    const across = Math.abs(dx * side.x + dz * side.z);
    if (ahead > 0 && ahead < 13 && across < 3.8) {
      targetSpeed = Math.min(targetSpeed, THREE.MathUtils.clamp((ahead - 3.4) * 2.2, 0, 18));
    }
  }
  return targetSpeed + (turboActive ? 22 : 0);
}

function applyTreeDamage(treeData, impactSpeed) {
  if (impactSpeed < 10) return;
  treeData.crown.visible = false;
  if (impactSpeed >= 20) treeData.crack.visible = true;
  if (impactSpeed >= 40) {
    treeData.branches[0].visible = false;
    treeData.crown.scale.setScalar(0.45);
  }
  if (impactSpeed > 80 && !treeData.fallen) {
    treeData.fallen = true;
    treeData.branches.forEach((branch) => { branch.visible = false; });
    treeData.tree.rotation.z = treeData.x >= car.position.x ? Math.PI / 2 : -Math.PI / 2;
    treeData.tree.position.y = 0.15;
  }
}

function applyCarDamage(impactSpeed, localImpact) {
  if (impactSpeed < 10) return;
  let axis;
  let direction;
  let center;
  if (Math.abs(localImpact.x) > Math.abs(localImpact.z) * 0.52) {
    axis = 'x';
    direction = Math.sign(localImpact.x) || 1;
    center = THREE.MathUtils.clamp(localImpact.z, -1.65, 1.65);
  } else {
    axis = 'z';
    direction = Math.sign(localImpact.z) || 1;
    center = THREE.MathUtils.clamp(localImpact.x, -0.75, 0.75);
  }
  const depth = impactSpeed < 20 ? 0.1 : impactSpeed < 40 ? 0.3 : impactSpeed <= 80 ? 0.42 : 0.58;
  dents.push({ axis, direction, center, depth, radius: impactSpeed < 20 ? 0.72 : 1.05 });
  rebuildBodyGeometry();
  carDamage = Math.min(1, carDamage + depth);
  body.scale.y = Math.max(0.78, 1 - carDamage * 0.2);
  if (axis === 'z' && direction > 0) hood.position.y = Math.max(1.02, hood.position.y - depth * 0.25);

  if (impactSpeed >= 40) {
    if (axis === 'z') {
      (direction > 0 ? frontBumper : rearBumper).visible = false;
      if (direction > 0) headlights[center < 0 ? 0 : 1].visible = false;
    } else {
      const targetWheel = wheels.reduce((closest, wheel) => {
        const distance = Math.abs(wheel.x - direction * 1.03) + Math.abs(wheel.z - center);
        return distance < closest.distance ? { wheel, distance } : closest;
      }, { wheel: wheels[0], distance: Infinity }).wheel;
      targetWheel.mesh.visible = false;
    }
  }
  if (impactSpeed > 80) {
    wheels.forEach((wheel) => { wheel.mesh.visible = false; });
    bumpers.forEach((bumper) => { bumper.visible = false; });
    headlights[center < 0 ? 0 : 1].visible = false;
  }
  ui.repairButton.disabled = false;
  ui.repairButton.classList.add('has-damage');
}

function showImpact(message) {
  ui.impactMessage.textContent = message;
  ui.impactMessage.classList.add('is-visible');
  window.clearTimeout(showImpact.timeout);
  showImpact.timeout = window.setTimeout(() => ui.impactMessage.classList.remove('is-visible'), 2200);
}

function finishWithCrash() {
  gameState = 'ended';
  elapsed = 0;
  speed = 0;
  lateralVelocity = 0;
  keys.clear();
  ui.speed.textContent = '000';
  ui.gear.textContent = 'N';
  ui.timer.textContent = formatTime(0);
  document.querySelector('#result-title').innerHTML = 'GAME<br /><em>OVER.</em>';
  document.querySelector('#result-copy').textContent = 'Impacto crítico. O carro não pode continuar.';
  document.querySelector('#result-time').textContent = formatTime(0);
  document.querySelector('#result-score').textContent = Math.floor(driftPoints).toLocaleString('pt-BR');
  document.querySelector('#resume-button span').textContent = 'TENTAR DE NOVO';
  setPanel('pause');
}

function checkTreeCollisions() {
  if (collisionCooldown > 0 || gameState !== 'playing') return;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const treeData of trees) {
    if (treeData.fallen) continue;
    const dx = treeData.x - car.position.x;
    const dz = treeData.z - car.position.z;
    const distance = Math.hypot(dx, dz);
    const collisionRadius = 2.8 + treeData.scale * 0.55;
    if (distance < collisionRadius && distance < nearestDistance) {
      nearest = treeData;
      nearestDistance = distance;
    }
  }
  if (!nearest) return;

  const impactSpeed = speed * 4;
  const localImpact = new THREE.Vector3(nearest.x - car.position.x, 0, nearest.z - car.position.z)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), -car.rotation.y);
  applyTreeDamage(nearest, impactSpeed);
  applyCarDamage(impactSpeed, localImpact);
  collisionCooldown = 1.1;
  speed = impactSpeed > fatalImpactSpeed ? 0 : speed * (impactSpeed < 10 ? 0.55 : 0.24);
  lateralVelocity *= -0.3;

  if (impactSpeed > fatalImpactSpeed) {
    showImpact('COLISÃO CRÍTICA · GAME OVER');
    finishWithCrash();
  } else if (impactSpeed >= 40) showImpact('IMPACTO FORTE · PEÇAS PERDIDAS');
  else if (impactSpeed >= 20) showImpact('IMPACTO · LATARIA AMASSADA');
  else if (impactSpeed >= 10) showImpact('IMPACTO LEVE · FOLHAS CAÍRAM');
  else showImpact('TOQUE LEVE · SEM DANOS');
}

function startGame() {
  initializeEngineSound();
  repairCar(true);
  elapsed = 0;
  distanceTravelled = 0;
  speed = 0;
  lateralOffset = 0;
  lateralVelocity = 0;
  driftPoints = 0;
  collisionCooldown = 0;
  turboCharge = 100;
  turboActive = false;
  ui.turboCharge.style.width = '100%';
  ui.boostButton.classList.remove('is-active', 'is-empty');
  bestLap = Infinity;
  lapStartedAt = 0;
  gameState = 'playing';
  ui.modeLabel.textContent = modeNames[selectedMode];
  ui.driftScore.textContent = '0';
  setPanel('game');
}

function finishGame() {
  if (gameState !== 'playing') return;
  gameState = 'ended';
  const reward = Math.max(10, Math.floor(elapsed / 3 + driftPoints / 40));
  saveData.credits += reward;
  if (selectedMode === 'sprint' && elapsed < 90 && (!saveData.bestSprint || elapsed < saveData.bestSprint)) saveData.bestSprint = elapsed;
  if (selectedMode === 'drift' && driftPoints > saveData.bestDrift) saveData.bestDrift = driftPoints;
  try { localStorage.setItem(storageKey, JSON.stringify(saveData)); } catch { /* Jogo local continua sem persistência. */ }
  ui.credits.textContent = saveData.credits.toLocaleString('pt-BR');
  refreshBest();
  showPause('FIM DE\nCORRIDA.', `+${reward} créditos adicionados à sua garagem.`);
}

document.querySelector('#start-button').addEventListener('click', startGame);
ui.repairButton.addEventListener('click', repairCar);
ui.assistButton.addEventListener('click', () => setAssistEnabled(!assistEnabled));
setAssistEnabled(assistEnabled);
const pressTurbo = (event) => { event.preventDefault(); keys.add('Turbo'); };
const releaseTurbo = (event) => { event.preventDefault(); keys.delete('Turbo'); };
ui.boostButton.addEventListener('pointerdown', pressTurbo);
ui.boostButton.addEventListener('pointerup', releaseTurbo);
ui.boostButton.addEventListener('pointercancel', releaseTurbo);
ui.boostButton.addEventListener('pointerleave', releaseTurbo);
document.querySelector('#resume-button').addEventListener('click', () => {
  if (gameState === 'ended') {
    startGame();
    return;
  }
  gameState = 'playing';
  setPanel('game');
});
document.querySelector('#pause-button').addEventListener('click', () => {
  if (gameState !== 'playing') return;
  gameState = 'paused';
  showPause('PAUSA\nNO BOX.', 'Respire. A pista continua aqui.');
});
document.querySelector('#menu-button').addEventListener('click', () => { gameState = 'menu'; refreshBest(); setPanel('welcome'); });
document.querySelector('#sound-toggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  soundMuted = button.classList.toggle('is-muted');
  if (!soundMuted) initializeEngineSound();
  button.setAttribute('aria-pressed', String(soundMuted));
  button.textContent = soundMuted ? '♫̸' : '♫';
});

function inputValue(...codes) { return codes.some((code) => keys.has(code)); }
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === 'Escape' && gameState === 'playing') {
    gameState = 'paused';
    showPause('PAUSA\nNO BOX.', 'Respire. A pista continua aqui.');
  } else if (event.code === 'Escape' && gameState === 'paused') {
    gameState = 'playing';
    setPanel('game');
  }
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
function updateJoystickPosition(clientX, clientY) {
  if (!mobileJoystick) return;
  const rect = mobileJoystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const maxDistance = rect.width * 0.32;
  const distance = Math.hypot(dx, dy);
  const clamped = distance > maxDistance ? maxDistance : distance;
  const angle = Math.atan2(dy, dx);
  const limitedX = clamped * Math.cos(angle);
  const limitedY = clamped * Math.sin(angle);
  const offsetX = limitedX;
  const offsetY = limitedY;
  joystickThumb.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  mobileSteer = THREE.MathUtils.clamp(offsetX / maxDistance, -1, 1);
  mobileGas = offsetY < -11 && Math.abs(offsetY) > Math.abs(offsetX) * 0.8;
  mobileBrake = offsetY > 11 && Math.abs(offsetY) > Math.abs(offsetX) * 0.8;
  mobileTurbo = offsetY < -18 && Math.abs(offsetY) > Math.abs(offsetX);
}

if (mobileJoystick && joystickThumb) {
  mobileJoystick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    mobileJoystick.setPointerCapture(event.pointerId);
    updateJoystickPosition(event.clientX, event.clientY);
  });
  mobileJoystick.addEventListener('pointermove', (event) => {
    if (event.pressure === 0 && !mobileJoystick.hasPointerCapture(event.pointerId)) return;
    updateJoystickPosition(event.clientX, event.clientY);
  });
  const resetJoystick = (event) => {
    if (event && 'pointerId' in event) {
      try { mobileJoystick.releasePointerCapture(event.pointerId); } catch { /* ignorar */ }
    }
    joystickThumb.style.transform = 'translate(0, 0)';
    mobileSteer = 0;
    mobileGas = false;
    mobileBrake = false;
    mobileTurbo = false;
  };
  mobileJoystick.addEventListener('pointerup', resetJoystick);
  mobileJoystick.addEventListener('pointercancel', resetJoystick);
  mobileJoystick.addEventListener('pointerleave', resetJoystick);
}

document.querySelectorAll('.touch-controls button').forEach((button) => {
  const press = (event) => { event.preventDefault(); keys.add(button.dataset.key); button.classList.add('is-pressed'); };
  const release = (event) => { event.preventDefault(); keys.delete(button.dataset.key); button.classList.remove('is-pressed'); };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
});

function resize() {
  const width = root.clientWidth;
  const height = root.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const cameraPosition = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const carPosition = new THREE.Vector3();
const smoothFactor = (dt, response) => 1 - Math.exp(-response * dt);

function updateDriving(dt) {
  if (gameState === 'playing') {
    elapsed += dt;
    collisionCooldown = Math.max(0, collisionCooldown - dt);
    const accelerating = inputValue('KeyW', 'ArrowUp') || mobileGas;
    const braking = inputValue('KeyS', 'ArrowDown') || mobileBrake;
    const handbrake = inputValue('Space');
    updateTurboCharge(dt, inputValue('ShiftLeft', 'ShiftRight', 'Turbo') || mobileTurbo);
    const steering = Number(inputValue('KeyD', 'ArrowRight')) - Number(inputValue('KeyA', 'ArrowLeft')) + mobileSteer;
    const progress = (0.15 + distanceTravelled / trackLength) % 1;
    const { tangent } = trackFrame(progress);
    const targetSpeed = assistEnabled ? getAssistTargetSpeed(progress, tangent) : 0;
    const autoThrottle = assistEnabled ? THREE.MathUtils.clamp((targetSpeed - speed) * 0.75, 0, 1) : 0;
    const throttle = turboActive
      ? (accelerating ? 1 : autoThrottle)
      : speed >= normalSpeedLimit ? 0 : (accelerating ? 1 : autoThrottle);
    const acceleration = 25 + (turboActive ? 35 : 0);
    speed += throttle * acceleration * dt;
    if (braking || (assistEnabled && speed > targetSpeed + 2.5)) {
      speed -= (braking ? 38 : 22) * dt;
    }
    speed = Math.max(0, Math.min(turboSpeedLimit, speed));
    speed *= Math.exp(-dt * (handbrake ? 0.58 : 0.11));

    lateralVelocity += steering * speed * (handbrake ? 0.42 : 0.25) * dt;
    lateralVelocity *= Math.exp(-(handbrake ? 0.95 : 1.9) * dt);
    lateralOffset = THREE.MathUtils.clamp(lateralOffset + lateralVelocity * dt, -9, 9);
    if (Math.abs(lateralOffset) > roadWidth * 0.43) speed *= Math.exp(-1.25 * dt);
    distanceTravelled += speed * dt;

    const slide = Math.abs(lateralVelocity) * speed;
    if (selectedMode === 'drift' && speed > 12 && Math.abs(lateralOffset) < roadWidth * 0.48) {
      driftPoints += Math.max(0, slide - 12) * dt * 2.2;
      ui.driftScore.textContent = Math.floor(driftPoints).toLocaleString('pt-BR');
    }
    const completedLaps = Math.floor(distanceTravelled / trackLength);
    if (completedLaps > 0 && distanceTravelled % trackLength < speed * dt) {
      bestLap = Math.min(bestLap, elapsed - lapStartedAt);
      lapStartedAt = elapsed;
    }

    const duration = modeDurations[selectedMode];
    const remaining = duration === Infinity ? 0 : Math.max(0, duration - elapsed);
    ui.timer.textContent = duration === Infinity ? formatTime(elapsed) : formatTime(remaining);
    ui.lap.textContent = selectedMode === 'sprint' ? `VOLTA ${Math.min(completedLaps + 1, 3)} / 3`
      : selectedMode === 'drift' ? `${Math.floor(driftPoints).toLocaleString('pt-BR')} PONTOS` : `${(distanceTravelled / 1000).toFixed(1)} KM`;
    ui.progress.style.width = selectedMode === 'sprint' ? `${Math.min(100, distanceTravelled / trackLength / 3 * 100)}%`
      : `${duration === Infinity ? distanceTravelled % trackLength / trackLength * 100 : Math.min(100, elapsed / duration * 100)}%`;
    ui.speed.textContent = Math.round(speed * 4).toString().padStart(3, '0');
    ui.gear.textContent = speed < 1 ? 'N' : Math.min(6, Math.floor(speed / 10) + 1);
    if (selectedMode === 'sprint' && completedLaps >= 3) finishGame();
    if ((selectedMode === 'drift' || selectedMode === 'sprint') && remaining <= 0) finishGame();
  }
  if (gameState !== 'playing') updateTurboCharge(dt, false);

  const progress = (0.15 + distanceTravelled / trackLength) % 1;
  const { point, tangent, normal } = trackFrame(progress);
  carPosition.set(point.x + normal.x * lateralOffset, 0, point.z + normal.z * lateralOffset);
  car.position.lerp(carPosition, smoothFactor(dt, 13));
  car.position.y = Math.sin(elapsed * 15) * Math.min(speed / 64, 1) * 0.025;
  car.rotation.y = Math.atan2(tangent.x, tangent.z) + THREE.MathUtils.clamp(lateralVelocity * 0.018, -0.48, 0.48);
  const driftStrength = THREE.MathUtils.clamp(Math.abs(lateralVelocity) / 5, 0, 1);
  body.rotation.z = -Math.sign(lateralVelocity) * driftStrength * 0.18;

  desiredCameraPosition.set(car.position.x - tangent.x * 11, car.position.y + 5.2 + speed * 0.018, car.position.z - tangent.z * 11);
  cameraPosition.lerp(desiredCameraPosition, smoothFactor(dt, 4.2));
  camera.position.copy(cameraPosition);
  cameraTarget.set(car.position.x + tangent.x * 7, car.position.y + 1.25, car.position.z + tangent.z * 7);
  camera.lookAt(cameraTarget);
  updateDriftSmoke(dt, driftStrength);
  checkTreeCollisions();
}

function updateDriftSmoke(dt, driftStrength) {
  smokeEmissionTimer -= dt;
  if (gameState === 'playing' && speed > 10 && driftStrength > 0.35 && smokeEmissionTimer <= 0) {
    smokeEmissionTimer = 0.075;
    for (const side of [-0.82, 0.82]) {
      const puff = smokePuffs.find((particle) => particle.life <= 0);
      if (!puff) break;
      puff.mesh.position.copy(car.localToWorld(new THREE.Vector3(side, 0.36, -1.65)));
      puff.velocity.set((Math.random() - 0.5) * 0.65, 0.5 + Math.random() * 0.45, (Math.random() - 0.5) * 0.65);
      puff.life = 0.72;
      puff.mesh.scale.setScalar(0.45 + Math.random() * 0.25);
      puff.mesh.visible = true;
    }
  }
  for (const puff of smokePuffs) {
    if (puff.life <= 0) continue;
    puff.life -= dt;
    puff.mesh.position.addScaledVector(puff.velocity, dt);
    puff.mesh.scale.multiplyScalar(1 + dt * 1.1);
    puff.mesh.material.opacity = Math.max(0, puff.life / 0.72) * 0.34;
    if (puff.life <= 0) puff.mesh.visible = false;
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateDriving(Math.min(clock.getDelta(), 0.04));
  updateEngineSound();
  renderer.render(scene, camera);
}

const initialFrame = trackFrame(0.15);
car.position.copy(initialFrame.point);
camera.position.set(car.position.x - initialFrame.tangent.x * 11, 5.5, car.position.z - initialFrame.tangent.z * 11);
camera.lookAt(car.position.x, 1, car.position.z);

animate();