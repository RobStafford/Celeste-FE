// Ensure the real Phaser never loads at runtime
jest.mock('phaser'); // will use test/__mocks__/phaser.ts automatically

import Phaser, {
  MockGraphics,
  MockScene,
  MockScaleManager,
  MockSprite,
} from './__mocks__/phaser';

import {
  makeStarDotTexture,
  makeGlowDiscTexture,
  makeFlameTexture,
  makeStarfieldTexture,
  makeRingTexture,
  makeShipTriangleTexture,
  pushWakeSample,
  drawWake,
  getNearestPlanet,
  applyPointGravity,
  drawSun,
} from '../src/utils/space-helpers'; 

describe('space-helpers', () => {
  // Freeze randomness for deterministic tests
  const realRandom = Math.random;
  beforeAll(() => {
    (Math as any).random = () => 0.5;
  });
  afterAll(() => {
    (Math as any).random = realRandom;
  });

  const newScene = (w = 800, h = 600) => new MockScene(new MockScaleManager(w, h));

  test('makeStarDotTexture generates a texture with correct size', () => {
    const scene = newScene();
    const g = scene.add.graphics() as MockGraphics;
    const spy = jest.spyOn(g, 'generateTexture');

    // swap add.graphics to return our spied instance
    const orig = scene.add.graphics;
    (scene.add as any).graphics = () => g;

    makeStarDotTexture(scene as any, 'star', 6);
    expect(spy).toHaveBeenCalledWith('star', 12, 12);

    (scene.add as any).graphics = orig; // cleanup
  });

  test('makeGlowDiscTexture uses correct generated size', () => {
    const scene = newScene();
    const g = scene.add.graphics() as MockGraphics;
    const spy = jest.spyOn(g, 'generateTexture');
    (scene.add as any).graphics = () => g;

    makeGlowDiscTexture(scene as any, 'glow', 10, 0xff00ff);
    // size = radius*2 + 2 = 22
    expect(spy).toHaveBeenCalledWith('glow', 22, 22);
  });

  test('makeFlameTexture generates expected size and issues fillPoints', () => {
    const scene = newScene();
    const g = scene.add.graphics() as MockGraphics;
    const genSpy = jest.spyOn(g, 'generateTexture');
    const fillPointsSpy = jest.spyOn(g, 'fillPoints');
    (scene.add as any).graphics = () => g;

    makeFlameTexture(scene as any, 'flame', 64);
    expect(genSpy).toHaveBeenCalledWith('flame', 64, 64);
    expect(fillPointsSpy).toHaveBeenCalled(); // we don’t assert exact points, just that it drew
  });

  test('makeStarfieldTexture draws `count` circles and returns the key', () => {
    const scene = newScene(320, 240);
    const g = scene.add.graphics() as MockGraphics;
    const fillCircleSpy = jest.spyOn(g, 'fillCircle');
    const genSpy = jest.spyOn(g, 'generateTexture');
    (scene.add as any).graphics = () => g;

    const key = makeStarfieldTexture(scene as any, 'field', 25, 0.6);
    expect(key).toBe('field');
    expect(fillCircleSpy).toHaveBeenCalledTimes(25);
    expect(genSpy).toHaveBeenCalledWith('field', 320, 240);
  });

  test('makeRingTexture draws multiple stroke rings and generates expected size', () => {
    const scene = newScene();
    const g = scene.add.graphics() as MockGraphics;
    const strokeSpy = jest.spyOn(g, 'strokeCircle');
    const genSpy = jest.spyOn(g, 'generateTexture');
    (scene.add as any).graphics = () => g;

    makeRingTexture(scene as any, 'ring', 8, 14, 0x00ffff, 0.8);
    // Expect 3 strokes
    expect(strokeSpy).toHaveBeenCalledTimes(3);
    // size = outerRadius*2 + 4 = 32
    expect(genSpy).toHaveBeenCalledWith('ring', 32, 32);
  });

  test('makeShipTriangleTexture generates ceil size', () => {
    const scene = newScene();
    const g = scene.add.graphics() as MockGraphics;
    const genSpy = jest.spyOn(g, 'generateTexture');
    (scene.add as any).graphics = () => g;

    makeShipTriangleTexture(scene as any, 'ship', 25, 0xffffff);
    // width = size, height = size*0.6 => ceil(15)
    expect(genSpy).toHaveBeenCalledWith('ship', Math.ceil(25), Math.ceil(25 * 0.6));
  });

  test('pushWakeSample pushes first, then based on distance or time', () => {
    const buf: { x: number; y: number; t: number }[] = [];
    pushWakeSample(buf, 0, 0, 1000, 10, 1000); // first always pushes
    expect(buf.length).toBe(1);

    // Not far enough, not enough time
    pushWakeSample(buf, 5, 5, 1500, 10, 1000);
    expect(buf.length).toBe(1);

    // Far enough (>= WAKE_MIN_STEP)
    pushWakeSample(buf, 20, 0, 1600, 10, 1000);
    expect(buf.length).toBe(2);

    // Time enough
    pushWakeSample(buf, 21, 0, 2601, 10, 1000);
    expect(buf.length).toBe(3);
  });

  test('drawWake clears then draws visible wake circles and prunes old', () => {
    const g = new MockGraphics();
    const now = 5000;
    const buf = [
      { x: 0, y: 0, t: 1000 },  // too old (age 4000 > 3000 default)
      { x: 1, y: 1, t: 2500 },  // age 2500 in range
      { x: 2, y: 2, t: 4000 },  // age 1000 in range
    ];
    drawWake(g as any, buf, 0xffffff, now, 3000);

    // Oldest pruned:
    expect(buf.length).toBe(2);
    // Cleared once:
    expect(g.calls['clear']?.length ?? 0).toBe(1);
    // Two circles drawn:
    expect(g.calls['fillCircle']?.length ?? 0).toBe(2);
  });

  test('getNearestPlanet returns nearest sprite and squared distance', () => {
    const planets = [
      new MockSprite(10, 10),
      new MockSprite(4, 4),
      new MockSprite(20, 20),
    ];

    const { planet, distSq } = getNearestPlanet(5, 5, planets as any);
    // nearest is (4,4): dx=1, dy=1 -> d2=2
    expect(planet.x).toBe(4);
    expect(planet.y).toBe(4);
    expect(distSq).toBe(2);
  });

  test('applyPointGravity updates velocity with clamp and min radius', () => {
    const vel = { x: 0, y: 0 } as any; // Vector2-like
    // Put ship very close; GRAVITY_MIN_R ensures distance floor
    applyPointGravity(
      vel,
      0, 0,     // ship at origin
      1, 0,     // source at (1,0)
      100,      // massLike
      10,       // K
      1,        // dts
      0.5,      // GRAVITY_MIN_R
      0.2       // GRAVITY_MAX_A (cap)
    );
    // Accel capped to 0.2 along +x
    expect(vel.x).toBeCloseTo(0.2, 5);
    expect(vel.y).toBeCloseTo(0, 5);
  });

  test('drawSun clears, draws glow layers and core, returns pos/radius', () => {
    const glow = new MockGraphics();
    const core = new MockGraphics();
    const scale = new MockScaleManager(1000, 800) as any;

    const res = drawSun(glow as any, core as any, scale, 1.0);

    // graphics cleared
    expect(glow.calls['clear']?.length ?? 0).toBe(1);
    expect(core.calls['clear']?.length ?? 0).toBe(1);

    // 4 glow fillCircle calls
    const glowCircles = glow.calls['fillCircle'] ?? [];
    expect(glowCircles.length).toBe(4);

    // core circle once
    const coreCircles = core.calls['fillCircle'] ?? [];
    expect(coreCircles.length).toBe(1);

    // position should be canvas center
    expect(res.pos.x).toBe(500);
    expect(res.pos.y).toBe(400);
    // radius: 110 * scalePulse + boil; boil is 0.1 * random = 0.05
    expect(res.radius).toBeCloseTo(110.05, 2);
  });
});
