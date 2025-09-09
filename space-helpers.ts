import Phaser from "phaser";

export function makeStarDotTexture(scene: Phaser.Scene, key: string, radius: number) {
  const g = scene.add.graphics().setVisible(false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(radius, radius, radius);
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}

export function makeGlowDiscTexture(scene: Phaser.Scene, key: string, radius: number, color: number) {
  const size = radius * 2 + 2;
  const g = scene.add.graphics().setVisible(false);
  for (let i = radius; i > 0; i -= 2) {
    const alpha = (i / radius) * 0.9;
    g.fillStyle(color, Math.min(1, alpha));
    g.fillCircle(size / 2, size / 2, i);
  }
  g.generateTexture(key, size, size);
  g.destroy();
}

export function makeFlameTexture(scene: Phaser.Scene, key: string, size: number) {
  const g = scene.add.graphics().setVisible(false);

  const cx = size / 2;
  const cy = size / 2;
  const h = size * 0.45;
  const w = size * 0.35;

  const p0 = new Phaser.Math.Vector2(cx, cy - h);
  const p1 = new Phaser.Math.Vector2(cx + w, cy);
  const p2 = new Phaser.Math.Vector2(cx, cy + h);
  const p3 = new Phaser.Math.Vector2(cx - w, cy);

  const c1 = new Phaser.Curves.QuadraticBezier(p0, p1, p2);
  const c2 = new Phaser.Curves.QuadraticBezier(p2, p3, p0);

  const points = c1.getPoints(16).concat(c2.getPoints(16));

  g.fillStyle(0xff6a00, 1);
  g.beginPath();
  g.fillPoints(points, true);
  g.closePath();

  g.fillStyle(0xffd080, 0.9);
  g.fillCircle(cx, cy + 1, size * 0.18);

  g.generateTexture(key, size, size);
  g.destroy();
}

export function makeStarfieldTexture(
  scene: Phaser.Scene,
  key: string,
  count: number,
  alphaBase: number
): string {
  const { width, height } = scene.scale;
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));

  const g = scene.add.graphics().setVisible(false);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const a = alphaBase * (0.5 + Math.random() * 0.5);
    const s = 1 + Math.random() * 1.8;
    g.fillStyle(0xffffff, a);
    g.fillCircle(x, y, s);
  }
  g.generateTexture(key, w, h);
  g.destroy();
  return key;
}

export function makeRingTexture(
  scene: Phaser.Scene,
  key: string,
  innerRadius: number,
  outerRadius: number,
  color: number,
  alpha = 0.9
) {
  const thickness = Math.max(1, outerRadius - innerRadius);
  const r = innerRadius + thickness / 2;
  const size = outerRadius * 2 + 4;

  const g = scene.add.graphics().setVisible(false);
  g.lineStyle(thickness, color, alpha);
  g.strokeCircle(size / 2, size / 2, r);

  g.lineStyle(thickness * 0.6, color, alpha * 0.5);
  g.strokeCircle(size / 2, size / 2, r);
  g.lineStyle(thickness * 0.3, color, alpha * 0.25);
  g.strokeCircle(size / 2, size / 2, r);

  g.generateTexture(key, size, size);
  g.destroy();
}

export function makeShipTriangleTexture(scene: Phaser.Scene, key: string, size: number, color: number) {
  const g = scene.add.graphics().setVisible(false);
  const w = size, h = size * 0.6;

  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(w * 0.6, h * 0.5);
  g.lineTo(w * 0.0, h * 0.15);
  g.lineTo(w * 0.0, h * 0.85);
  g.closePath();
  g.fillPath();

  g.generateTexture(key, Math.ceil(w), Math.ceil(h));
  g.destroy();
}

// wake utils
export function pushWakeSample(
  buf: { x: number; y: number; t: number }[],
  x: number,
  y: number,
  now: number,
  WAKE_MIN_STEP = 90,
  WAKE_SAMPLE_MS = 240
) {
  const last = buf[buf.length - 1];
  if (!last) { buf.push({ x, y, t: now }); return; }

  const dx = x - last.x, dy = y - last.y;
  const dist2 = dx * dx + dy * dy;
  const movedEnough = dist2 >= WAKE_MIN_STEP * WAKE_MIN_STEP;
  const timeEnough = now - last.t >= WAKE_SAMPLE_MS;

  if (movedEnough || timeEnough) buf.push({ x, y, t: now });
}

export function drawWake(
  g: Phaser.GameObjects.Graphics,
  buf: { x: number; y: number; t: number }[],
  color: number,
  now: number,
  WAKE_MAX_AGE = 3000
) {
  while (buf.length && (now - buf[0].t) > WAKE_MAX_AGE) buf.shift();

  g.clear();
  for (let i = 0; i < buf.length; i++) {
    const age = now - buf[i].t;
    const a = 1 - age / WAKE_MAX_AGE;
    const r = 2 + a * 2;
    g.fillStyle(color, Phaser.Math.Clamp(a, 0, 1));
    g.fillCircle(buf[i].x, buf[i].y, r);
  }
}

// physics & targeting
export function getNearestPlanet(
  shipX: number,
  shipY: number,
  planets: Phaser.GameObjects.Sprite[]
): { planet: Phaser.GameObjects.Sprite; distSq: number } {
  let best = planets[0];
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const dx = shipX - p.x;
    const dy = shipY - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = p;
    }
  }
  return { planet: best, distSq: bestDistSq };
}

export function applyPointGravity(
  shipVel: Phaser.Math.Vector2,
  shipX: number,
  shipY: number,
  srcX: number,
  srcY: number,
  massLike: number,
  K: number,
  dts: number,
  GRAVITY_MIN_R: number,
  GRAVITY_MAX_A: number
) {
  const dx = srcX - shipX;
  const dy = srcY - shipY;
  const dist = Math.max(Math.hypot(dx, dy), GRAVITY_MIN_R);

  let accel = (K * massLike) / (dist * dist);
  accel = Math.min(accel, GRAVITY_MAX_A);

  const ux = dx / dist;
  const uy = dy / dist;

  shipVel.x += ux * accel * dts;
  shipVel.y += uy * accel * dts;
}

// ---------- Sun render ----------
export function drawSun(
  glowG: Phaser.GameObjects.Graphics,
  coreG: Phaser.GameObjects.Graphics,
  scale: Phaser.Scale.ScaleManager,
  scalePulse = 1
): { pos: Phaser.Math.Vector2; radius: number } {
  const { width, height } = scale;
  const cx = width / 2;
  const cy = height / 2;

  glowG.clear();
  coreG.clear();

  for (let i = 0; i < 4; i++) {
    const r = 160 * scalePulse + i * 16;
    const a = 0.08 - i * 0.015;
    glowG.fillStyle(0xff7a00, Math.max(0, a));
    glowG.fillCircle(cx, cy, r);
  }

  const boil = 0.1 * Math.random();
  const coreR = 110 * scalePulse + boil;

  coreG.fillStyle(0xffc400, 1);
  coreG.fillCircle(cx, cy, coreR);

  return { pos: new Phaser.Math.Vector2(cx, cy), radius: coreR };
}
