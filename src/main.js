import * as THREE from 'three';
import './style.css';

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
const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6);
const crownGeometry = new THREE.ConeGeometry(1.7, 4.8, 7);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#795b3d', roughness: 1 });
const leafMaterials = ['#49785d', '#5a8863', '#688e62'].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
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
      tree.add(trunk, crown);
      tree.position.set(x, 0, z);
      tree.scale.setScalar(0.72 + (index % 4) * 0.13);
      scenery.add(tree);
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
const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.68, 4.05), bodyMaterial);
body.position.y = 0.92;
car.add(body);
const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.26, 1.18), bodyMaterial);
hood.position.set(0, 1.28, 1.12);
car.add(hood);
const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.75), new THREE.MeshStandardMaterial({ color: '#b8e3e5', metalness: 0.25, roughness: 0.2 }));
cabin.position.set(0, 1.48, -0.45);
car.add(cabin);
const tireMaterial = new THREE.MeshStandardMaterial({ color: '#242827', roughness: 0.85 });
for (const x of [-1.03, 1.03]) {
  for (const z of [-1.25, 1.24]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 12), tireMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.55, z);
    car.add(wheel);
  }
}
const lampMaterial = new THREE.MeshStandardMaterial({ color: '#fff2bd', emissive: '#e5c37b', emissiveIntensity: 0.65 });
for (const x of [-0.66, 0.66]) {
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.12), lampMaterial);
  lamp.position.set(x, 1.02, 2.04);
  car.add(lamp);
}
scene.add(car);

const ui = {
  credits: document.querySelector('#credits'), speed: document.querySelector('#speed'), gear: document.querySelector('#gear'),
  lap: document.querySelector('#lap'), timer: document.querySelector('#timer'), progress: document.querySelector('#progress'),
  modeLabel: document.querySelector('#mode-label'), driftScore: document.querySelector('#drift-score'),
  personalBest: document.querySelector('#personal-best'), welcome: document.querySelector('#welcome-panel'),
  pausePanel: document.querySelector('#pause-panel'), hud: document.querySelector('#game-hud'), feedback: document.querySelector('#drive-feedback'),
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
const keys = new Set();
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

function startGame() {
  initializeEngineSound();
  elapsed = 0;
  distanceTravelled = 0;
  speed = 0;
  lateralOffset = 0;
  lateralVelocity = 0;
  driftPoints = 0;
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
    const accelerating = inputValue('KeyW', 'ArrowUp');
    const braking = inputValue('KeyS', 'ArrowDown');
    const handbrake = inputValue('Space');
    const steering = Number(inputValue('KeyD', 'ArrowRight')) - Number(inputValue('KeyA', 'ArrowLeft'));
    if (accelerating) speed += 25 * dt;
    if (braking) speed -= 38 * dt;
    speed = Math.max(0, Math.min(64, speed));
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

  const progress = (0.15 + distanceTravelled / trackLength) % 1;
  const { point, tangent, normal } = trackFrame(progress);
  carPosition.set(point.x + normal.x * lateralOffset, 0, point.z + normal.z * lateralOffset);
  car.position.lerp(carPosition, smoothFactor(dt, 13));
  car.position.y = Math.sin(elapsed * 15) * Math.min(speed / 64, 1) * 0.025;
  car.rotation.y = Math.atan2(tangent.x, tangent.z) + THREE.MathUtils.clamp(lateralVelocity * 0.018, -0.48, 0.48);

  desiredCameraPosition.set(car.position.x - tangent.x * 11, car.position.y + 5.2 + speed * 0.018, car.position.z - tangent.z * 11);
  cameraPosition.lerp(desiredCameraPosition, smoothFactor(dt, 4.2));
  camera.position.copy(cameraPosition);
  cameraTarget.set(car.position.x + tangent.x * 7, car.position.y + 1.25, car.position.z + tangent.z * 7);
  camera.lookAt(cameraTarget);
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