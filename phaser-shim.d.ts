// src/types/phaser-shim.d.ts
// Minimal ambient typings for the pieces your helpers use.
// This is TYPES ONLY; it does not import real Phaser or DOM.

declare namespace Phaser {
  namespace Math {
    class Vector2 {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }
    function Clamp(v: number, min: number, max: number): number;
  }

  namespace Curves {
    class QuadraticBezier {
      constructor(p0: any, p1: any, p2: any);
      getPoints(n: number): Array<{ x: number; y: number }>;
    }
  }

  namespace Scale {
    class ScaleManager {
      constructor(width: number, height: number);
      width: number;
      height: number;
    }
  }

  namespace GameObjects {
    class Graphics {
      setVisible(v: boolean): this;
      fillStyle(color: number, alpha: number): this;
      beginPath(): this;
      closePath(): this;
      fillPoints(points: any[], close: boolean): this;
      fillCircle(x: number, y: number, r: number): this;
      moveTo(x: number, y: number): this;
      lineTo(x: number, y: number): this;
      fillPath(): this;
      lineStyle(width: number, color: number, alpha: number): this;
      strokeCircle(x: number, y: number, r: number): this;
      clear(): this;
      generateTexture(key: string, w: number, h: number): this;
      destroy(): void;
    }

    class Sprite {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }
  }

  class Scene {
    add: { graphics(): Phaser.GameObjects.Graphics };
    scale: Phaser.Scale.ScaleManager;
  }
}

// Make `import 'phaser'` provide the same namespace.
// Works with "esModuleInterop": true.
declare module 'phaser' {
  export = Phaser;
}
