jest.mock('phaser');

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

    const orig = scene.add.graphics;
    (scene.add as any).graphics = () => g;

    makeStarDotTexture(scene as any, 'star', 6);
    expect(spy).toHaveBeenCalledWith('star', 12, 12);

    (scene.add as any).graphics = orig;
  });

  test('makeGlowDiscTexture uses correct generated size', () => {
    const scene = newScene();
    const g = scene.add.graphics() as MockGraphics;
    const spy = jest.spyOn(g, 'generateTexture');
    (scene.add as any).graphics = () => g;

    makeGlowDiscTexture(scene as any, 'glow', 10, 0xff00ff);
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
    expect(fillPointsSpy).toHaveBeenCalled(); 
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
    expect(strokeSpy).toHaveBeenCalledTimes(3);
    expect(genSpy).toHaveBeenCalledWith('ring', 32, 32);
  });

  test('makeShipTriangleTexture generates ceil size', () => {
    const scene = newScene();
    const g = scene.add.graphics() as MockGraphics;
    const genSpy = jest.spyOn(g, 'generateTexture');
    (scene.add as any).graphics = () => g;

    makeShipTriangleTexture(scene as any, 'ship', 25, 0xffffff);
    expect(genSpy).toHaveBeenCalledWith('ship', Math.ceil(25), Math.ceil(25 * 0.6));
  });

  test('pushWakeSample pushes first, then based on distance or time', () => {
    const buf: { x: number; y: number; t: number }[] = [];
    pushWakeSample(buf, 0, 0, 1000, 10, 1000); 
    expect(buf.length).toBe(1);

    pushWakeSample(buf, 5, 5, 1500, 10, 1000);
    expect(buf.length).toBe(1);

    pushWakeSample(buf, 20, 0, 1600, 10, 1000);
    expect(buf.length).toBe(2);

    pushWakeSample(buf, 21, 0, 2601, 10, 1000);
    expect(buf.length).toBe(3);
  });

  test('drawWake clears then draws visible wake circles and prunes old', () => {
    const g = new MockGraphics();
    const now = 5000;
    const buf = [
      { x: 0, y: 0, t: 1000 },
      { x: 1, y: 1, t: 2500 },
      { x: 2, y: 2, t: 4000 },
    ];
    drawWake(g as any, buf, 0xffffff, now, 3000);

    expect(buf.length).toBe(2);
    expect(g.calls['clear']?.length ?? 0).toBe(1);
    expect(g.calls['fillCircle']?.length ?? 0).toBe(2);
  });

  test('getNearestPlanet returns nearest sprite and squared distance', () => {
    const planets = [
      new MockSprite(10, 10),
      new MockSprite(4, 4),
      new MockSprite(20, 20),
    ];

    const { planet, distSq } = getNearestPlanet(5, 5, planets as any);
    expect(planet.x).toBe(4);
    expect(planet.y).toBe(4);
    expect(distSq).toBe(2);
  });

  test('applyPointGravity updates velocity with clamp and min radius', () => {
    const vel = { x: 0, y: 0 } as any; 
    applyPointGravity(
      vel,
      0, 0,  
      1, 0, 
      100,     
      10,    
      1,      
      0.5,    
      0.2   
    );
    expect(vel.x).toBeCloseTo(0.2, 5);
    expect(vel.y).toBeCloseTo(0, 5);
  });

  test('drawSun clears, draws glow layers and core, returns pos/radius', () => {
    const glow = new MockGraphics();
    const core = new MockGraphics();
    const scale = new MockScaleManager(1000, 800) as any;

    const res = drawSun(glow as any, core as any, scale, 1.0);

    expect(glow.calls['clear']?.length ?? 0).toBe(1);
    expect(core.calls['clear']?.length ?? 0).toBe(1);

    const glowCircles = glow.calls['fillCircle'] ?? [];
    expect(glowCircles.length).toBe(4);

    const coreCircles = core.calls['fillCircle'] ?? [];
    expect(coreCircles.length).toBe(1);


    expect(res.pos.x).toBe(500);
    expect(res.pos.y).toBe(400);

    expect(res.radius).toBeCloseTo(110.05, 2);
  });
});
