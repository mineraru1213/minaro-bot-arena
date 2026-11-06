
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// ==============================
// MINARO: BOT ARENA
// ==============================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071321);
scene.fog = new THREE.Fog(0x071321, 15, 65);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  150
);

camera.position.set(0, 1.7, 10);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("game").prepend(renderer.domElement);

// ==============================
// LIGHTING
// ==============================

scene.add(new THREE.HemisphereLight(0x9edcff, 0x172333, 2));

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(8, 15, 8);
light.castShadow = true;
scene.add(light);

// ==============================
// ARENA
// ==============================

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({
    color: 0x172b3e,
    roughness: 0.8
  })
);

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Grid
const grid = new THREE.GridHelper(60, 60, 0x16a9d2, 0x25475b);
grid.position.y = 0.015;
scene.add(grid);

// Walls
function createWall(x, y, z, w, h, d) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: 0x24445b,
      metalness: 0.6,
      roughness: 0.4
    })
  );

  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

createWall(0, 3, -30, 60, 6, 1);
createWall(0, 3, 30, 60, 6, 1);
createWall(-30, 3, 0, 1, 6, 60);
createWall(30, 3, 0, 1, 6, 60);

// Cover blocks
const obstacles = [];

function createCover(x, z, w = 3, h = 2, d = 2) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: 0x31546a,
      metalness: 0.5,
      roughness: 0.45
    })
  );

  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  obstacles.push({
    x,
    z,
    w,
    d
  });

  // Neon strip
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.9, 0.06, d * 0.9),
    new THREE.MeshBasicMaterial({ color: 0x00cfff })
  );

  strip.position.set(x, h + 0.04, z);
  scene.add(strip);
}

createCover(-9, -8);
createCover(9, -8);
createCover(-9, 8);
createCover(9, 8);
createCover(0, -15, 5, 3, 2);
createCover(0, 15, 5, 3, 2);
createCover(-17, 0, 2, 2.5, 5);
createCover(17, 0, 2, 2.5, 5);

// Neon pillars
for (let x = -24; x <= 24; x += 8) {
  for (let z = -24; z <= 24; z += 8) {
    if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 5, 0.15),
      new THREE.MeshBasicMaterial({ color: 0x00aaff })
    );

    pillar.position.set(x, 2.5, z);
    scene.add(pillar);
  }
}

// ==============================
// PLAYER
// ==============================

const player = {
  x: 0,
  z: 10,
  y: 1.7,
  yaw: 0,
  pitch: 0,
  velocityY: 0,
  grounded: true,
  speed: 8
};

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.code] = true;
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

// Mouse controls
let locked = false;

renderer.domElement.addEventListener("click", () => {
  if (started && !isMobile) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener("mousemove", e => {
  if (!locked) return;

  player.yaw -= e.movementX * 0.002;
  player.pitch -= e.movementY * 0.002;

  player.pitch = THREE.MathUtils.clamp(
    player.pitch,
    -1.4,
    1.4
  );
});

// ==============================
// TOUCH CONTROLS
// ==============================

const isMobile =
  window.matchMedia("(pointer: coarse)").matches;

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const lookArea = document.getElementById("look-area");

let moveX = 0;
let moveY = 0;
let joyPointer = null;
let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;

joystick.addEventListener("pointerdown", e => {
  joyPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (e.pointerId === joyPointer) updateJoystick(e);
});

function updateJoystick(e) {
  const rect = joystick.getBoundingClientRect();

  const dx = e.clientX - (rect.left + rect.width / 2);
  const dy = e.clientY - (rect.top + rect.height / 2);

  const max = rect.width * 0.35;
  const distance = Math.hypot(dx, dy);
  const scale = Math.min(1, max / Math.max(distance, 1));

  moveX = (dx * scale) / max;
  moveY = (dy * scale) / max;

  stick.style.transform =
    `translate(calc(-50% + ${dx * scale}px), calc(-50% + ${dy * scale}px))`;
}

function resetJoystick(e) {
  if (e.pointerId !== joyPointer) return;

  joyPointer = null;
  moveX = 0;
  moveY = 0;
  stick.style.transform = "translate(-50%, -50%)";
}

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

lookArea.addEventListener("pointerdown", e => {
  if (lookPointer !== null) return;

  lookPointer = e.pointerId;
  lookArea.setPointerCapture(e.pointerId);
  lastLookX = e.clientX;
  lastLookY = e.clientY;
});

lookArea.addEventListener("pointermove", e => {
  if (e.pointerId !== lookPointer) return;

  const dx = e.clientX - lastLookX;
  const dy = e.clientY - lastLookY;

  player.yaw -= dx * 0.006;
  player.pitch -= dy * 0.006;

  player.pitch = THREE.MathUtils.clamp(
    player.pitch,
    -1.4,
    1.4
  );

  lastLookX = e.clientX;
  lastLookY = e.clientY;
});

function endLook(e) {
  if (e.pointerId === lookPointer) lookPointer = null;
}

lookArea.addEventListener("pointerup", endLook);
lookArea.addEventListener("pointercancel", endLook);

// ==============================
// JUMP
// ==============================

function jump() {
  if (player.grounded) {
    player.velocityY = 7;
    player.grounded = false;
  }
}

document.getElementById("jump").addEventListener("pointerdown", jump);

window.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

// ==============================
// COLLISION
// ==============================

function canMove(x, z) {
  const radius = 0.45;

  if (
    x < -28 + radius ||
    x > 28 - radius ||
    z < -28 + radius ||
    z > 28 - radius
  ) return false;

  for (const o of obstacles) {
    const dx = Math.abs(x - o.x);
    const dz = Math.abs(z - o.z);

    if (
      dx < o.w / 2 + radius &&
      dz < o.d / 2 + radius
    ) return false;
  }

  return true;
}

// ==============================
// GAME START
// ==============================

let started = false;

const startScreen = document.getElementById("start-screen");
const loading = document.getElementById("loading");

document.getElementById("start-button").addEventListener("click", () => {
  started = true;
  startScreen.style.display = "none";
  loading.style.display = "none";

  if (!isMobile) {
    renderer.domElement.requestPointerLock();
  }
});

// ==============================
// HUD
// ==============================

function updateHUD() {
  document.getElementById("health").textContent = "100";
  document.getElementById("kills").textContent = "0";
  document.getElementById("ammo-count").textContent = "30";
}

// ==============================
// MOVEMENT
// ==============================

const clock = new THREE.Clock();

function updatePlayer(dt) {
  if (!started) return;

  let forward =
    (keys["KeyW"] ? 1 : 0) -
    (keys["KeyS"] ? 1 : 0) -
    moveY;

  let sideways =
    (keys["KeyD"] ? 1 : 0) -
    (keys["KeyA"] ? 1 : 0) +
    moveX;

  const length = Math.hypot(forward, sideways);

  if (length > 1) {
    forward /= length;
    sideways /= length;
  }

  const speed = player.speed * dt;

  const dx =
    -Math.sin(player.yaw) * forward +
    Math.cos(player.yaw) * sideways;

  const dz =
    -Math.cos(player.yaw) * forward -
    Math.sin(player.yaw) * sideways;

  if (canMove(player.x + dx * speed, player.z)) {
    player.x += dx * speed;
  }

  if (canMove(player.x, player.z + dz * speed)) {
    player.z += dz * speed;
  }

  if (!player.grounded) {
    player.velocityY -= 18 * dt;
    player.y += player.velocityY * dt;

    if (player.y <= 1.7) {
      player.y = 1.7;
      player.velocityY = 0;
      player.grounded = true;
    }
  }

  camera.position.set(player.x, player.y, player.z);
  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

// ==============================
// ANIMATION
// ==============================

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);

  updatePlayer(dt);
  updateHUD();

  renderer.render(scene, camera);
}

animate();

// ==============================
// RESIZE
// ==============================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
});
