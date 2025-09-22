class MockGraphics {
  calls: Record<string, any[][]> = {};
  private rec(name: string, args: any[]) {
    if (!this.calls[name]) this.calls[name] = [];
    this.calls[name].push(args);
  }
  setVisible(v: boolean) { this.rec('setVisible', [v]); return this; }
  fillStyle(c: number, a: number) { this.rec('fillStyle', [c, a]); return this; }
  beginPath() { this.rec('beginPath', []); return this; }
  closePath() { this.rec('closePath', []); return this; }
  fillPoints(points: any[], close: boolean) { this.rec('fillPoints', [points, close]); return this; }
  fillCircle(x: number, y: number, r: number) { this.rec('fillCircle', [x, y, r]); return this; }
  moveTo(x: number, y: number) { this.rec('moveTo', [x, y]); return this; }
  lineTo(x: number, y: number) { this.rec('lineTo', [x, y]); return this; }
  fillPath() { this.rec('fillPath', []); return this; }
  lineStyle(w: number, c: number, a: number) { this.rec('lineStyle', [w, c, a]); return this; }
  strokeCircle(x: number, y: number, r: number) { this.rec('strokeCircle', [x, y, r]); return this; }
  clear() { this.rec('clear', []); return this; }
  generateTexture(key: string, w: number, h: number) { this.rec('generateTexture', [key, w, h]); return this; }
  destroy() { this.rec('destroy', []); }
}
class MockSprite { constructor(public x: number, public y: number) {} }
class MockScaleManager { constructor(public width: number, public height: number) {} }
class MockScene {
  public add = { graphics: () => new MockGraphics() };
  constructor(public scale: MockScaleManager) {}
}
namespace MathNS {
  export class Vector2 { constructor(public x: number, public y: number) {} }
  export const Clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
}
namespace Curves {
  export class QuadraticBezier {
    constructor(_p0: any, _p1: any, _p2: any) {}
    getPoints(n: number) { const pts = []; for (let i = 0; i < n; i++) pts.push({ x: i, y: i }); return pts; }
  }
}
const Phaser = {
  GameObjects: { Graphics: MockGraphics, Sprite: MockSprite },
  Scale: { ScaleManager: MockScaleManager },
  Math: MathNS,
  Curves,
};

export default Phaser;
export { MockGraphics, MockSprite, MockScaleManager, MockScene };
