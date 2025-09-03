import Phaser from "phaser";

class SpaceScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Image;
  private shipVel = new Phaser.Math.Vector2(0, 0);
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  // Render layers
  private worldLayer!: Phaser.GameObjects.Layer;
  private uiLayer!: Phaser.GameObjects.Layer;

  // Ship wake via graphics (Phaser particles no bueno)
  private shipWakeG!: Phaser.GameObjects.Graphics;
  private shipWakePath: { x: number; y: number; t: number }[] = [];

  // Docking/landing/victory state
  private docked = true;
  private dockPlanet!: Phaser.GameObjects.Sprite;
  private dockTheta = 0;
  private tailOffset = 12;
  private lastDockPlanetPos = new Phaser.Math.Vector2();

  // Victory: land on a random planet different from start
  private targetPlanet!: Phaser.GameObjects.Sprite;
  private targetPlanetIndex = -1;
  private targetLabel!: Phaser.GameObjects.Text;

  // Collision / landing tunables
  private readonly SHIP_COLLISION_RADIUS = 10;
  private readonly LANDING_SPEED_MAX = 80;

  // Gravity constants
  private readonly GRAVITY_PLANET_K = 700;
  private readonly GRAVITY_SUN_K = 500;
  private readonly GRAVITY_MIN_R = 28;
  private readonly GRAVITY_MAX_A = 90;

  // FX
  private exploding = false;
  private destroyed = false;

  private starsFar!: Phaser.GameObjects.TileSprite;
  private starsNear!: Phaser.GameObjects.TileSprite;

  private sunCore!: Phaser.GameObjects.Graphics;
  private sunGlow!: Phaser.GameObjects.Graphics;

  // HUD
  private hud!: Phaser.GameObjects.Container;
  private hudBg!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private copyText!: Phaser.GameObjects.Text;
  private fuel = 100;
  private fuelText!: Phaser.GameObjects.Text;

  // Planets
  private planet0!: Phaser.GameObjects.Sprite;
  private orbitAngleP0 = Math.floor(Math.random() * 360);
  private orbitSpeedP0 = 0.5;
  private orbitRadiusP0 = 90;

  private planet1!: Phaser.GameObjects.Sprite;
  private orbitAngleP1 = Math.floor(Math.random() * 360);
  private orbitSpeedP1 = 0.35;
  private orbitRadiusP1 = 160;

  private planet2!: Phaser.GameObjects.Sprite;
  private orbitAngleP2 = Math.floor(Math.random() * 360);
  private orbitSpeedP2 = 0.3;
  private orbitRadiusP2 = 230;

  private planet3!: Phaser.GameObjects.Sprite;
  private orbitAngleP3 = Math.floor(Math.random() * 360);
  private orbitSpeedP3 = 0.23;
  private orbitRadiusP3 = 300;

  private planet4!: Phaser.GameObjects.Sprite;
  private orbitAngleP4 = Math.floor(Math.random() * 360);
  private orbitSpeedP4 = 0.1;
  private orbitRadiusP4 = 370;

  private planet5!: Phaser.GameObjects.Sprite;
  private orbitAngleP5 = Math.floor(Math.random() * 360);
  private orbitSpeedP5 = 0.1;
  private orbitRadiusP5 = 440;

  private wakeG0!: Phaser.GameObjects.Graphics;
  private wakeG1!: Phaser.GameObjects.Graphics;
  private wakeG2!: Phaser.GameObjects.Graphics;
  private wakeG3!: Phaser.GameObjects.Graphics;
  private wakeG4!: Phaser.GameObjects.Graphics;
  private wakeG5!: Phaser.GameObjects.Graphics;

  private wakePath0: { x: number; y: number; t: number }[] = [];
  private wakePath1: { x: number; y: number; t: number }[] = [];
  private wakePath2: { x: number; y: number; t: number }[] = [];
  private wakePath3: { x: number; y: number; t: number }[] = [];
  private wakePath4: { x: number; y: number; t: number }[] = [];
  private wakePath5: { x: number; y: number; t: number }[] = [];

  private planetRing0!: Phaser.GameObjects.Image;

  private sunRadius = 110;
  private sunPos = new Phaser.Math.Vector2();

  // Arrays for collision/relative velocity
  private planets!: Phaser.GameObjects.Sprite[];
  private planetLastPos!: Phaser.Math.Vector2[];

  // Camera interaction state
  private isDragging = false;
  private dragStart = new Phaser.Math.Vector2();
  private camStart = new Phaser.Math.Vector2();

  // Zoom / world sizing
  private STARFIELD_SCALE = 2.2;
  private minZoom = 0.5;
  private maxZoom = 4;

  // Wake tunables
  private readonly WAKE_MAX_AGE = 3000;
  private readonly WAKE_MIN_STEP = 90;
  private readonly WAKE_SAMPLE_MS = 240;

  // Start modal state + objects
  private modalOpen = false;
  private startModal?: Phaser.GameObjects.Container;
  private startBackdrop?: Phaser.GameObjects.Rectangle;
  private okButton?: Phaser.GameObjects.Rectangle;
  private okLabel?: Phaser.GameObjects.Text;

  // Start modal elements
  private startTitle!: Phaser.GameObjects.Text;
  private startWelcome!: Phaser.GameObjects.Text;
  private startWelcome2!: Phaser.GameObjects.Text;
  private startTargetText!: Phaser.GameObjects.Text;
  private startControlsHeader!: Phaser.GameObjects.Text;
  private startControlsList!: Phaser.GameObjects.Text;
  private scoresHeader!: Phaser.GameObjects.Text;
  private scoresText!: Phaser.GameObjects.Text;

  // Restart modal
  private restartModal?: Phaser.GameObjects.Container;
  private restartBackdrop?: Phaser.GameObjects.Rectangle;
  private yesButton?: Phaser.GameObjects.Rectangle;
  private noButton?: Phaser.GameObjects.Rectangle;
  private yesLabel?: Phaser.GameObjects.Text;
  private noLabel?: Phaser.GameObjects.Text;

  //About modal
  private aboutModal?: Phaser.GameObjects.Container;
  private aboutBackdrop?: Phaser.GameObjects.Rectangle;
  private aboutOkButton?: Phaser.GameObjects.Rectangle;
  private aboutOkLabel?: Phaser.GameObjects.Text;
  private aboutButton?: Phaser.GameObjects.Rectangle; 
  private aboutButtonLabel?: Phaser.GameObjects.Text;

  // Scores cache
  private topScores: Array<{ player: string; score: number }> = [];

  constructor() { super("space"); }

  preload() {
    // Procedural textures
    this.makeGlowDiscTexture("sunDisc", 160, 0xffb000);
    this.makeGlowDiscTexture("planetDisc0", 15, 0x6e6e6e);
    this.makeGlowDiscTexture("planetDisc1", 25, 0x98ffee);
    this.makeGlowDiscTexture("planetDisc2", 30, 0x2a9df4);
    this.makeGlowDiscTexture("planetDisc3", 25, 0x7a1c1c);
    this.makeGlowDiscTexture("planetDisc4", 35, 0xc97e4b);
    this.makeGlowDiscTexture("planetDisc5", 32, 0xC9A46B);
    this.makeRingTexture("planetRing0", 34, 50, 0xE8D7B3, 0.85);
    this.makeFlameTexture("flame", 25);
    this.makeStarDotTexture("starDot", 0.5);
    this.makeShipTriangleTexture("shipTri", 24, 0x47B16F);
  }

  create() {
    // Fresh per-run state
    this.fuel = 100;
    this.destroyed = false;
    this.exploding = false;
    this.docked = true;
    this.modalOpen = false;

    const { width, height } = this.scale;

    // Layers
    this.worldLayer = this.add.layer();
    this.uiLayer = this.add.layer();

    // Starfield
    const worldW = Math.ceil(width * this.STARFIELD_SCALE);
    const worldH = Math.ceil(height * this.STARFIELD_SCALE);

    this.starsFar = this.add.tileSprite(width / 2, height / 2, worldW, worldH, this.makeStarfieldTexture("starsFar", 900, 0.5));
    this.starsNear = this.add.tileSprite(width / 2, height / 2, worldW, worldH, this.makeStarfieldTexture("starsNear", 260, 1.0)).setAlpha(0.9);
    this.starsFar.setDepth(-10);
    this.starsNear.setDepth(-9);

    // Sun
    this.sunGlow = this.add.graphics();
    this.sunCore = this.add.graphics();
    this.drawSun();

    // Planets
    this.planet0 = this.add.sprite(0, 0, "planetDisc0").setOrigin(0.15).setAlpha(0.98).setScale(0.35).setDepth(2);
    this.planet1 = this.add.sprite(0, 0, "planetDisc1").setOrigin(0.3).setAlpha(0.98).setScale(0.4).setDepth(2);
    this.planet2 = this.add.sprite(0, 0, "planetDisc2").setOrigin(0.5).setAlpha(0.98).setScale(0.4).setDepth(2);
    this.planet3 = this.add.sprite(0, 0, "planetDisc3").setOrigin(0.5).setAlpha(0.98).setScale(0.4).setDepth(2);
    this.planet4 = this.add.sprite(0, 0, "planetDisc4").setOrigin(0.5).setAlpha(0.98).setScale(0.6).setDepth(2);

    // Wakes
    this.wakeG0 = this.add.graphics().setDepth(1);
    this.wakeG1 = this.add.graphics().setDepth(1);
    this.wakeG2 = this.add.graphics().setDepth(1);
    this.wakeG3 = this.add.graphics().setDepth(1);
    this.wakeG4 = this.add.graphics().setDepth(1);
    this.wakeG5 = this.add.graphics().setDepth(1);

    const ringed = this.add.sprite(0, 0, "planetDisc5").setOrigin(0.5).setAlpha(0.98).setScale(0.5).setDepth(2);
    const ring = this.add.image(0, 0, "planetRing0").setOrigin(0.5).setDepth(1.9);
    ring.setScale(1, 0.55);
    ring.rotation = Phaser.Math.DegToRad(30);

    this.planet5 = ringed;
    this.planetRing0 = ring;

    // Arrays
    this.planets = [this.planet0, this.planet1, this.planet2, this.planet3, this.planet4, this.planet5];
    this.planetLastPos = this.planets.map(p => new Phaser.Math.Vector2(p.x, p.y));

    // Ship wake
    this.shipWakeG = this.add.graphics().setDepth(2.5);

    // World layer contents
    this.worldLayer.add([
      this.starsFar, this.starsNear,
      this.sunGlow, this.sunCore,
      this.planet0, this.planet1, this.planet2, this.planet3, this.planet4, this.planet5,
      this.planetRing0,
      this.wakeG0, this.wakeG1, this.wakeG2, this.wakeG3, this.wakeG4, this.wakeG5,
      this.shipWakeG
    ]);

    // HUD
    const w = this.scale.width;
    const pad = 8;

    this.hudBg = this.add.rectangle(0, 0, w, 64, 0x000000, 0.55).setOrigin(0, 0).setDepth(1000);
    this.titleText = this.add.text(w / 2, 8, "Celeste", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(0.5, 0).setDepth(1001);

    this.copyText = this.add.text(w / 2, 38, "© 2025 Robert Stafford. All rights reserved.", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      color: "#cccccc"
    }).setOrigin(0.5, 0).setDepth(1001);

    this.fuelText = this.add.text(w - pad, 12, `Fuel: ${Math.floor(this.fuel)}`, {
      fontFamily: "Consolas, monospace",
      fontSize: "20px",
      color: "#ffffff"
    }).setOrigin(1, 0).setDepth(1001);

    this.hud = this.add.container(0, 0, [this.hudBg, this.titleText, this.copyText, this.fuelText]).setDepth(1000);
    this.uiLayer.add(this.hud);

    // About button
    this.aboutButton = this.add
      .rectangle(pad + 58, 34, 96, 30, 0x363b45, 1)
      .setStrokeStyle(2, 0xffffff, 0.6)
      .setDepth(1002)
      .setInteractive({ useHandCursor: true });
    this.aboutButtonLabel = this.add.text(this.aboutButton.x, this.aboutButton.y, "About", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "16px",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(1003);

    this.aboutButton.on("pointerover", () => this.aboutButton!.setFillStyle(0x434955, 1));
    this.aboutButton.on("pointerout",  () => this.aboutButton!.setFillStyle(0x363b45, 1));
    this.aboutButton.on("pointerup",   () => { if (!this.modalOpen) this.showAboutModal(); });
    this.hud.add([this.aboutButton, this.aboutButtonLabel]);

    // Second camera for HUD
    const uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    uiCam.setScroll(0, 0).setZoom(1);

    // Cameras draw which layers
    const worldCam = this.cameras.main;
    worldCam.ignore(this.uiLayer);
    uiCam.ignore(this.worldLayer);

    // Camera config
    worldCam.setZoom(1);
    worldCam.centerOn(width / 2, height / 2);

    const worldLeft = (width - worldW) / 2;
    const worldTop = (height - worldH) / 2;
    worldCam.setBounds(worldLeft, worldTop, worldW, worldH);

    this.minZoom = Math.max(width / worldW, height / worldH);
    worldCam.setZoom(Phaser.Math.Clamp(worldCam.zoom, this.minZoom, this.maxZoom));

    this.input.on("wheel", (_ptr: any, _go: any, _dx: number, dy: number) => {
      const zoomDelta = -dy * 0.001;
      const target = Phaser.Math.Clamp(worldCam.zoom + zoomDelta, this.minZoom, this.maxZoom);
      this.tweens.add({ targets: worldCam, zoom: target, duration: 120, ease: "Quad.easeOut" });
    });

    // Pointer panning
    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.modalOpen) return;
      this.isDragging = true;
      this.dragStart.set(p.x, p.y);
      this.camStart.set(worldCam.scrollX, worldCam.scrollY);
    });
    this.input.on("pointerup", () => { this.isDragging = false; });
    this.input.on("pointerupoutside", () => { this.isDragging = false; });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.modalOpen) return;
      const dx = (p.x - this.dragStart.x) / worldCam.zoom;
      const dy = (p.y - this.dragStart.y) / worldCam.zoom;
      worldCam.scrollX = this.camStart.x - dx;
      worldCam.scrollY = this.camStart.y - dy;
    });

    // Keyboard
    this.keyW = this.input.keyboard!.addKey("W");
    this.keyA = this.input.keyboard!.addKey("A");
    this.keyD = this.input.keyboard!.addKey("D");

    // Initial planet positions
    this.placePlanets(0);
    this.planets.forEach((p, i) => this.planetLastPos[i].set(p.x, p.y));

    // Start landed on a random planet
    this.dockPlanet = Phaser.Utils.Array.GetRandom(this.planets);
    this.dockTheta = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const pr = this.dockPlanet.displayWidth * 0.5;
    const sx = this.dockPlanet.x + Math.cos(this.dockTheta) * (pr + this.tailOffset);
    const sy = this.dockPlanet.y + Math.sin(this.dockTheta) * (pr + this.tailOffset);
    this.ship = this.add.image(sx, sy, "shipTri").setOrigin(0.5).setDepth(5);
    this.ship.rotation = this.dockTheta;
    this.lastDockPlanetPos.set(this.dockPlanet.x, this.dockPlanet.y);
    this.worldLayer.add(this.ship);

    // Pick a victory planet different from start
    const candidates = this.planets.filter(p => p !== this.dockPlanet);
    this.targetPlanet = Phaser.Utils.Array.GetRandom(candidates);
    this.targetPlanetIndex = this.planets.indexOf(this.targetPlanet);

    // Floating target label
    this.targetLabel = this.add.text(this.targetPlanet.x, this.targetPlanet.y, "TARGET", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "16px",
      color: "#ff4d4d",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(6);
    this.worldLayer.add(this.targetLabel);

    // Start modal (fetch scores)
    this.showStartModal();

    // Resize handler
    const resizeHandler = (gameSize: Phaser.Structs.Size) => {
      const w2 = gameSize.width;
      const h2 = gameSize.height;

      const secondCam = this.cameras.cameras[1];
      if (secondCam) secondCam.setSize(w2, h2);

      this.hudBg.width = w2;
      this.titleText.setX(w2 / 2);
      this.copyText.setX(w2 / 2);
      this.fuelText.setX(w2 - 8);

      this.aboutButton?.setPosition(8 + 58, 34);
      this.aboutButtonLabel?.setPosition(8 + 58, 34);

      this.layoutModals();
    };
    this.scale.on("resize", resizeHandler);
    this.events.once("shutdown", () => this.scale.off("resize", resizeHandler));
    
  }

  update(time: number, delta: number) {
    const dts = delta / 1000;
    const { width } = this.scale;

    // Parallax
    this.starsFar.tilePositionX += 1 * dts;
    this.starsNear.tilePositionX += 3 * dts;

    // Sun pulse
    const pulse = 0.5 + 0.02 * Math.sin(time * 0.0005);
    this.drawSun(pulse);

    // Planets + remember last positions
    this.planets.forEach((p, i) => this.planetLastPos[i].set(p.x, p.y));
    this.placePlanets(dts);

    // Wakes
    const now = this.time.now;
    this.sampleAndDrawPlanetWakes(now);

    // Ringed planet needs a bit of extra logic
    const cx = width / 2, cy = this.scale.height / 2;
    const sx = cx + Math.cos(this.orbitAngleP5) * this.orbitRadiusP5;
    const sy = cy + Math.sin(this.orbitAngleP5) * this.orbitRadiusP5;
    this.planet5.setPosition(sx, sy);
    this.planetRing0.setPosition(sx, sy);
    this.planetRing0.rotation += 0.03 * dts;

    // Keep target label above planet
    if (this.targetPlanet && this.targetLabel) {
      this.targetLabel.setPosition(this.targetPlanet.x, this.targetPlanet.y - this.targetPlanet.displayHeight / 2 - 10);
    }

    // Controls / collisions
    if (!this.destroyed && !this.exploding && !this.modalOpen) {
      this.updateShipMotion(dts, now);
      this.checkCollisions(dts);
    }

    // Ship wake
    this.drawWake(this.shipWakeG, this.shipWakePath, 0xffffff, now);
  }

  // Ship control & motion
  private updateShipMotion(dts: number, now: number) {
    const rotSpeed = 2.8;
    const thrust = 220;
    const drag = 0.995;

    if (!this.docked) {
      if (this.keyA.isDown) this.ship.rotation -= rotSpeed * dts;
      if (this.keyD.isDown) this.ship.rotation += rotSpeed * dts;

      if (this.keyW.isDown && this.fuel > 0) {
        this.shipVel.x += Math.cos(this.ship.rotation) * thrust * dts;
        this.shipVel.y += Math.sin(this.ship.rotation) * thrust * dts;

        // spend fuel at 10 units / second when thrusting
        this.fuel = Math.max(0, this.fuel - dts * 10);

        // wake dot at tail
        const wx = this.ship.x - Math.cos(this.ship.rotation) * this.tailOffset;
        const wy = this.ship.y - Math.sin(this.ship.rotation) * this.tailOffset;
        this.pushWakeSample(this.shipWakePath, wx, wy, now);
      }

      // Gravity: nearest planet + sun
      const nearest = this.getNearestPlanet();
      const pr = nearest.planet.displayWidth * 0.5;
      const planetMassLike = pr * pr;
      this.applyPointGravity(nearest.planet.x, nearest.planet.y, planetMassLike, this.GRAVITY_PLANET_K, dts);

      const sunMassLike = this.sunRadius * this.sunRadius;
      this.applyPointGravity(this.sunPos.x, this.sunPos.y, sunMassLike, this.GRAVITY_SUN_K, dts);

      // integrate
      this.ship.x += this.shipVel.x * dts;
      this.ship.y += this.shipVel.y * dts;
      this.shipVel.scale(drag);

      const r = this.cameras.main.getBounds();
      if (this.ship.x < r.left) this.ship.x = r.right;
      if (this.ship.x > r.right) this.ship.x = r.left;
      if (this.ship.y < r.top) this.ship.y = r.bottom;
      if (this.ship.y > r.bottom) this.ship.y = r.top;

    } else {
      // Landed: ride with the planet
      const pr = this.dockPlanet.displayWidth * 0.5;
      const sx = this.dockPlanet.x + Math.cos(this.dockTheta) * (pr + this.tailOffset);
      const sy = this.dockPlanet.y + Math.sin(this.dockTheta) * (pr + this.tailOffset);
      this.ship.setPosition(sx, sy);
      this.ship.rotation = this.dockTheta;
      this.shipVel.set(0, 0);

      // take off on first W press: inherit planet velocity
      if (Phaser.Input.Keyboard.JustDown(this.keyW) && this.fuel > 0 && !this.modalOpen) {
        const vx = (this.dockPlanet.x - this.lastDockPlanetPos.x) / dts;
        const vy = (this.dockPlanet.y - this.lastDockPlanetPos.y) / dts;
        this.shipVel.set(vx, vy);
        this.docked = false;
      }
      this.lastDockPlanetPos.set(this.dockPlanet.x, this.dockPlanet.y);
    }

    this.fuelText.setText(`Fuel: ${Math.floor(this.fuel)}`);
  }

  // Collisions/Landings/Explosions
  private checkCollisions(dts: number) {
    if (this.destroyed) return;

    const dx = this.ship.x - this.sunPos.x;
    const dy = this.ship.y - this.sunPos.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < this.sunRadius * this.sunRadius) {
      this.triggerExplosion();
    }

    if (this.docked) return;

    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];

      const dxp = this.ship.x - p.x;
      const dyp = this.ship.y - p.y;
      const dist = Math.hypot(dxp, dyp);

      const pr = p.displayWidth * 0.5;
      const contactDist = pr + this.SHIP_COLLISION_RADIUS;

      if (dist <= contactDist) {
        // relative speed
        const pvx = (p.x - this.planetLastPos[i].x) / dts;
        const pvy = (p.y - this.planetLastPos[i].y) / dts;
        const rvx = this.shipVel.x - pvx;
        const rvy = this.shipVel.y - pvy;
        const speedRel = Math.hypot(rvx, rvy);

        if (speedRel <= this.LANDING_SPEED_MAX) {
          const theta = Math.atan2(this.ship.y - p.y, this.ship.x - p.x);
          this.landOnPlanet(p, theta);

          // Victory condition
          if (p === this.targetPlanet) {
            this.showVictoryFlash();
            this.handleVictorySubmit();
          }
        } else {
          this.triggerExplosion();
        }
        return;
      }
    }
  }

  private landOnPlanet(planet: Phaser.GameObjects.Sprite, theta: number) {
    this.docked = true;
    this.dockPlanet = planet;
    this.dockTheta = theta;
    this.shipVel.set(0, 0);

    const pr = planet.displayWidth * 0.5;
    const sx = planet.x + Math.cos(theta) * (pr + this.tailOffset);
    const sy = planet.y + Math.sin(theta) * (pr + this.tailOffset);
    this.ship.setPosition(sx, sy).setRotation(theta).setVisible(true);

    this.shipWakePath.length = 0;
    this.lastDockPlanetPos.set(planet.x, planet.y);
  }

  private triggerExplosion() {
    if (this.exploding || this.destroyed) return;
    this.exploding = true;
    this.destroyed = true;

    const x = this.ship.x, y = this.ship.y;
    const DEPTH = 10;

    const burstSprites = (
      key: string,
      n: number,
      speedMin: number,
      speedMax: number,
      lifeMin: number,
      lifeMax: number,
      startScaleMin: number,
      startScaleMax: number,
      tint?: number
    ) => {
      for (let i = 0; i < n; i++) {
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const s = Phaser.Math.FloatBetween(speedMin, speedMax);
        const life = Phaser.Math.Between(lifeMin, lifeMax);
        const dx = Math.cos(a) * s;
        const dy = Math.sin(a) * s;
        const startScale = Phaser.Math.FloatBetween(startScaleMin, startScaleMax);

        const spr = this.add.image(x, y, key)
          .setDepth(DEPTH)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(startScale)
          .setAlpha(1);

        if (tint !== undefined) spr.setTint(tint);

        this.tweens.add({ targets: spr, x: x + dx, y: y + dy, duration: life, ease: "Quad.easeOut" });
        this.tweens.add({ targets: spr, alpha: 0, scale: 0, duration: life, ease: "Quad.easeIn", onComplete: () => spr.destroy() });
      }
    };

    // Bursts
    burstSprites("flame", 26, 60, 140, 1400, 2200, 0.7, 1.3);
    burstSprites("starDot", 48, 90, 180, 1600, 2600, 0.6, 1.0, 0xffe0a0);

    // Shockwave ring
    const ring = this.add.circle(x, y, 2, 0xffcc66, 0.3).setDepth(DEPTH);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      radius: 220,
      alpha: 0,
      duration: 1600,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy()
    });

    // Hide ship and clear wake
    this.ship.setVisible(false);
    this.shipVel.set(0, 0);
    this.shipWakePath.length = 0;

    // Clear exploding flag later
    this.time.delayedCall(2600, () => { this.exploding = false; });

    // Restart ask
    this.time.delayedCall(3000, () => {
      if (!this.scene.isActive()) return;
      if (!this.modalOpen) this.showRestartModal();
    });
  }

  private showVictoryFlash() {
    const { width, height } = this.scale;
    const flash = this.add.rectangle(0, 0, width, height, 0xffffff, 1).setOrigin(0).setDepth(2000);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy()
    });
  }

  // Start Modal (Top 10 scores)
  private showStartModal() {
    this.modalOpen = true;

    const { width, height } = this.scale;
    this.startBackdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: false })
      .setDepth(1500);
    this.uiLayer.add(this.startBackdrop);

    const panel = this.add.rectangle(0, 0, 600, 520, 0x111318, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setOrigin(0.5)
      .setDepth(1501);

    // Title, welcome, target, controls
    this.startTitle = this.add.text(0, 0, "Celeste", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1502);

    this.startWelcome = this.add.text(0, 0,
      "Welcome, pilot. Please deliver these important supplies to the target planet.\nLook for the tiny green triangle on one of the planets — that's you.",
      {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        color: "#dddddd",
        wordWrap: { width: 540 }
      }).setOrigin(0.5, 0).setDepth(1502);

    this.startWelcome2 = this.add.text(0, 0,
      "1. don't land too hard, 2. don't get too close to the sun, and 3. don't run out of fuel.",
      {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        color: "#dddddd",
        wordWrap: { width: 540 }
      }).setOrigin(0.5, 0).setDepth(1502);

    this.startTargetText = this.add.text(0, 0,
      `Victory: Land on Planet ${this.targetPlanetIndex + 1}.`,
      {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "18px",
        color: "#b1fca3",
        wordWrap: { width: 540 }
      }).setOrigin(0.5, 0).setDepth(1502);

    this.startControlsHeader = this.add.text(0, 0, "Controls", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: "#ffffff"
    }).setOrigin(0.5, 0).setDepth(1502);

    this.startControlsList = this.add.text(0, 0,
      [
        "W – Thrust",
        "A / D – Rotate ship",
        "Mouse drag – Pan camera",
        "Mouse wheel – Zoom",
        "intercept -gently- (low relative speed) to land"
      ].join("\n"),
      {
        fontFamily: "Consolas, monospace",
        fontSize: "16px",
        color: "#cfe7ff",
        lineSpacing: 4
      }).setOrigin(0.5, 0).setDepth(1502);

    // Top 10 section
    this.scoresHeader = this.add.text(0, 0, "Top 10", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: "#ffe29a"
    }).setOrigin(0.5, 0).setDepth(1502);

    this.scoresText = this.add.text(0, 0, "(loading…)", {
      fontFamily: "Consolas, monospace",
      fontSize: "16px",
      color: "#e7e7e7",
      lineSpacing: 3
    }).setOrigin(0.5, 0).setDepth(1502);

    // OK button
    this.okButton = this.add.rectangle(0, 0, 140, 44, 0x1f8cff, 1)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setDepth(1502)
      .setInteractive({ useHandCursor: true });
    this.okLabel = this.add.text(0, 0, "OK", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(1503);

    this.okButton.on("pointerover", () => this.okButton!.setFillStyle(0x2a95ff, 1));
    this.okButton.on("pointerout", () => this.okButton!.setFillStyle(0x1f8cff, 1));
    this.okButton.on("pointerup", () => this.closeStartModal());
    this.input.keyboard?.once("keydown-ENTER", () => this.closeStartModal());
    this.input.keyboard?.once("keydown-SPACE", () => this.closeStartModal());
    this.input.keyboard?.once("keydown-ESC", () => this.closeStartModal());

    // Container & layout
    this.startModal = this.add.container(0, 0, [
      panel,
      this.startTitle,
      this.startWelcome,
      this.startWelcome2,
      this.startTargetText,
      this.startControlsHeader,
      this.startControlsList,
      this.scoresHeader,
      this.scoresText,
      this.okButton,
      this.okLabel
    ]).setDepth(1501);
    this.uiLayer.add(this.startModal);

    this.layoutStartModal();

    // Fetch scores now (async)
    this.fetchTopScores().catch(() => {
      this.scoresText.setText("(failed to load)");
    });
  }

  private layoutStartModal() {
    if (!this.startModal || !this.startBackdrop) return;

    const { width, height } = this.scale;
    this.startBackdrop.setSize(width, height);

    const panel = this.startModal.list[0] as Phaser.GameObjects.Rectangle;
    const panelW = Math.min(700, Math.max(380, width - 80));
    const panelH = Math.min(560, Math.max(380, height - 120));
    panel.setSize(panelW, panelH);

    this.startModal.setPosition(width / 2, height / 2);

    const pad = 18;
    let y = -panelH / 2 + pad;

    this.startTitle.setPosition(0, y); y += 40;

    this.startWelcome.setWordWrapWidth(panelW - 2 * pad);
    this.startWelcome.setPosition(0, y); y += this.startWelcome.height + 8;

    this.startWelcome2.setWordWrapWidth(panelW - 2 * pad);
    this.startWelcome2.setPosition(0, y); y += this.startWelcome2.height + 12;

    this.startTargetText.setWordWrapWidth(panelW - 2 * pad);
    this.startTargetText.setPosition(0, y); y += this.startTargetText.height + 16;

    this.startControlsHeader.setPosition(0, y); y += 26;

    this.startControlsList.setPosition(0, y); y += this.startControlsList.height + 14;

    this.scoresHeader.setPosition(0, y); y += 22;

    this.scoresText.setWordWrapWidth(panelW - 2 * pad);
    this.scoresText.setPosition(0, y);

    // Button near bottom
    const btnY = panelH / 2 - 34;
    this.okButton!.setPosition(0, btnY);
    this.okLabel!.setPosition(0, btnY);
  }

  private closeStartModal() {
    this.modalOpen = false;
    this.startModal?.destroy();
    this.startBackdrop?.destroy();
    this.okButton = undefined;
    this.okLabel = undefined;
    this.startModal = undefined;
    this.startBackdrop = undefined;
  }

  // Restart Modal
  private showRestartModal() {
    this.modalOpen = true;

    const { width, height } = this.scale;

    this.restartBackdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: false })
      .setDepth(1550);
    this.uiLayer.add(this.restartBackdrop);

    const panel = this.add.rectangle(0, 0, 520, 220, 0x1a1d24, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setOrigin(0.5)
      .setDepth(1551);

    const msg = this.add.text(0, 0, "Do you want to restart?", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      wordWrap: { width: 460 }
    }).setOrigin(0.5, 0.5).setDepth(1552);

    this.yesButton = this.add.rectangle(0, 0, 140, 44, 0x1f8cff, 1)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setDepth(1552)
      .setInteractive({ useHandCursor: true });
    this.yesLabel = this.add.text(0, 0, "Yes", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(1553);

    this.noButton = this.add.rectangle(0, 0, 140, 44, 0x363b45, 1)
      .setStrokeStyle(2, 0xffffff, 0.4)
      .setDepth(1552)
      .setInteractive({ useHandCursor: true });
    this.noLabel = this.add.text(0, 0, "No", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(1553);

    this.yesButton.on("pointerover", () => this.yesButton!.setFillStyle(0x2a95ff, 1));
    this.yesButton.on("pointerout", () => this.yesButton!.setFillStyle(0x1f8cff, 1));
    this.yesButton.on("pointerup", () => this.restartExperience());

    this.noButton.on("pointerover", () => this.noButton!.setFillStyle(0x434955, 1));
    this.noButton.on("pointerout", () => this.noButton!.setFillStyle(0x363b45, 1));
    this.noButton.on("pointerup", () => this.closeRestartModal());

    this.input.keyboard?.once("keydown-Y", () => this.restartExperience());
    this.input.keyboard?.once("keydown-N", () => this.closeRestartModal());
    this.input.keyboard?.once("keydown-ESC", () => this.closeRestartModal());

    this.restartModal = this.add.container(0, 0, [
      panel, msg, this.yesButton, this.yesLabel, this.noButton, this.noLabel
    ]).setDepth(1551);
    this.uiLayer.add(this.restartModal);

    this.layoutRestartModal();
  }

  private layoutRestartModal() {
    if (!this.restartModal || !this.restartBackdrop) return;

    const { width, height } = this.scale;
    this.restartBackdrop.setSize(width, height);

    const panel = this.restartModal.list[0] as Phaser.GameObjects.Rectangle;
    const msg = this.restartModal.list[1] as Phaser.GameObjects.Text;

    const panelW = Math.min(560, Math.max(320, width - 80));
    const panelH = Math.min(260, Math.max(180, height - 200));
    panel.setSize(panelW, panelH);

    this.restartModal.setPosition(width / 2, height / 2);

    msg.setWordWrapWidth(panelW - 40);
    msg.setPosition(0, -20);

    const btnY = panelH / 2 - 46;
    this.yesButton!.setPosition(-80, btnY);
    this.yesLabel!.setPosition(-80, btnY);

    this.noButton!.setPosition(80, btnY);
    this.noLabel!.setPosition(80, btnY);
  }

  private closeRestartModal() {
    this.modalOpen = false;
    this.restartModal?.destroy();
    this.restartBackdrop?.destroy();
    this.yesButton = this.noButton = undefined;
    this.yesLabel = this.noLabel = undefined;
    this.restartModal = undefined;
    this.restartBackdrop = undefined;
  }

  private restartExperience() {
    this.closeRestartModal();
    if (typeof window !== "undefined" && window.location && typeof window.location.reload === "function") {
      window.location.reload();
      return;
    }
    const key = this.scene.key;
    this.scene.stop();
    this.scene.remove(key);
    this.scene.add(key, SpaceScene, true);
  }

  // Score helpers
  private async fetchTopScores() {
    // expects GET /api/scores
    const resp = await fetch("/api/scores", { headers: { "Accept": "application/json" } });
    if (!resp.ok) throw new Error(`scores http ${resp.status}`);
    const data: Array<{ player: string; score: number }> = await resp.json();
    this.topScores = Array.isArray(data) ? data.slice(0, 10) : [];
    this.updateScoresText();
  }

  private updateScoresText() {
    if (!this.scoresText) return;
    if (!this.topScores.length) {
      this.scoresText.setText("(no scores yet)");
      return;
    }
    const lines = this.topScores.map((r, i) => {
      const rank = String(i + 1).padStart(2, " ");
      const tag = (r.player || "").toUpperCase().slice(0, 3).padEnd(3, " ");
      const pts = String(r.score ?? 0);
      return `${rank}. ${tag}  ${pts}`;
    });
    this.scoresText.setText(lines.join("\n"));
  }

  private async postScore(player: string, score: number) {
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, score })
    });
  }

private async handleVictorySubmit() {
  // Pause inputs while prompting
  this.modalOpen = true;

  // Capture initials
  const raw = (window.prompt("Enter your initials (3 letters):", "") || "").toUpperCase();
  const initials = raw.replace(/[^A-Z]/g, "").slice(0, 3);

  // Simple score formula
  const score = Math.max(0, Math.floor(this.fuel * 100));

  if (initials) {
    try {
      await this.postScore(initials, score);
      this.toast("Score submitted!");
      this.fetchTopScores().catch(() => {});
    } catch {
      this.toast("Submit failed.");
    }

    // close input gating, then open the restart modal
    this.modalOpen = false;
    // tiny delay so the toast can render
    this.time.delayedCall(300, () => {
      if (!this.restartModal) this.showRestartModal();
    });
    return;
  }

  // No initials entered
  this.toast("No initials entered.");
  this.modalOpen = false;
}


  private toast(msg: string) {
    const t = this.add.text(this.scale.width / 2, this.scale.height - 80, msg, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3000);
    this.tweens.add({ targets: t, alpha: 0, duration: 1200, delay: 800, onComplete: () => t.destroy() });
  }

  // More Helpers
  private placePlanets(dts: number) {
    const cx = this.scale.width / 2, cy = this.scale.height / 2;

    this.orbitAngleP0 += this.orbitSpeedP0 * dts;
    this.planet0.x = cx + Math.cos(this.orbitAngleP0) * this.orbitRadiusP0;
    this.planet0.y = cy + Math.sin(this.orbitAngleP0) * this.orbitRadiusP0;

    this.orbitAngleP1 += this.orbitSpeedP1 * dts;
    this.planet1.x = cx + Math.cos(this.orbitAngleP1) * this.orbitRadiusP1;
    this.planet1.y = cy + Math.sin(this.orbitAngleP1) * this.orbitRadiusP1;

    this.orbitAngleP2 += this.orbitSpeedP2 * dts;
    this.planet2.x = cx + Math.cos(this.orbitAngleP2) * this.orbitRadiusP2;
    this.planet2.y = cy + Math.sin(this.orbitAngleP2) * this.orbitRadiusP2;

    this.orbitAngleP3 += this.orbitSpeedP3 * dts;
    this.planet3.x = cx + Math.cos(this.orbitAngleP3) * this.orbitRadiusP3;
    this.planet3.y = cy + Math.sin(this.orbitAngleP3) * this.orbitRadiusP3;

    this.orbitAngleP4 += this.orbitSpeedP4 * dts;
    this.planet4.x = cx + Math.cos(this.orbitAngleP4) * this.orbitRadiusP4;
    this.planet4.y = cy + Math.sin(this.orbitAngleP4) * this.orbitRadiusP4;

    this.orbitAngleP5 += this.orbitSpeedP5 * dts;

    const spin = 0.2 * dts;
    this.planet0.rotation += spin;
    this.planet1.rotation += 0.02 * dts;
    this.planet2.rotation += spin;
    this.planet3.rotation += spin;
    this.planet4.rotation += spin;
    this.planet5.rotation += spin;
  }

  private sampleAndDrawPlanetWakes(now: number) {
    this.pushWakeSample(this.wakePath0, this.planet0.x, this.planet0.y, now);
    this.pushWakeSample(this.wakePath1, this.planet1.x, this.planet1.y, now);
    this.pushWakeSample(this.wakePath2, this.planet2.x, this.planet2.y, now);
    this.pushWakeSample(this.wakePath3, this.planet3.x, this.planet3.y, now);
    this.pushWakeSample(this.wakePath4, this.planet4.x, this.planet4.y, now);
    this.pushWakeSample(this.wakePath5, this.planet5.x, this.planet5.y, now);

    this.drawWake(this.wakeG0, this.wakePath0, 0x4a4a4a, now);
    this.drawWake(this.wakeG1, this.wakePath1, 0x98ffee, now);
    this.drawWake(this.wakeG2, this.wakePath2, 0x2a9df4, now);
    this.drawWake(this.wakeG3, this.wakePath3, 0x7a1c1c, now);
    this.drawWake(this.wakeG4, this.wakePath4, 0xc97e4b, now);
    this.drawWake(this.wakeG5, this.wakePath5, 0xC9A46B, now);
  }

  private drawSun(scalePulse = 1) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.sunGlow.clear();
    this.sunCore.clear();

    for (let i = 0; i < 4; i++) {
      const r = 160 * scalePulse + i * 16;
      const a = 0.08 - i * 0.015;
      this.sunGlow.fillStyle(0xff7a00, Math.max(0, a));
      this.sunGlow.fillCircle(cx, cy, r);
    }

    const boil = 0.1 * Math.random();
    const coreR = 110 * scalePulse + boil;

    this.sunCore.fillStyle(0xffc400, 1);
    this.sunCore.fillCircle(cx, cy, coreR);

    this.sunPos.set(cx, cy);
    this.sunRadius = coreR;
  }

  private layoutModals() {
    this.layoutStartModal();
    this.layoutRestartModal();
    this.layoutAboutModal(); 
  }

  private makeStarDotTexture(key: string, radius: number) {
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }

  private makeGlowDiscTexture(key: string, radius: number, color: number) {
    const size = radius * 2 + 2;
    const g = this.add.graphics().setVisible(false);
    for (let i = radius; i > 0; i -= 2) {
      const alpha = (i / radius) * 0.9;
      g.fillStyle(color, Math.min(1, alpha));
      g.fillCircle(size / 2, size / 2, i);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeFlameTexture(key: string, size: number) {
    const g = this.add.graphics().setVisible(false);

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

  private makeStarfieldTexture(key: string, count: number, alphaBase: number): string {
    const { width, height } = this.scale;
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));

    const g = this.add.graphics().setVisible(false);
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

  private pushWakeSample(
    buf: { x: number; y: number; t: number }[],
    x: number,
    y: number,
    now: number
  ) {
    const last = buf[buf.length - 1];
    if (!last) { buf.push({ x, y, t: now }); return; }

    const dx = x - last.x, dy = y - last.y;
    const dist2 = dx * dx + dy * dy;
    const movedEnough = dist2 >= this.WAKE_MIN_STEP * this.WAKE_MIN_STEP;
    const timeEnough = now - last.t >= this.WAKE_SAMPLE_MS;

    if (movedEnough || timeEnough) buf.push({ x, y, t: now });
  }

  private drawWake(
    g: Phaser.GameObjects.Graphics,
    buf: { x: number; y: number; t: number }[],
    color: number,
    now: number
  ) {
    const maxAge = this.WAKE_MAX_AGE;
    while (buf.length && (now - buf[0].t) > maxAge) buf.shift();

    g.clear();
    for (let i = 0; i < buf.length; i++) {
      const age = now - buf[i].t;
      const a = 1 - age / maxAge;
      const r = 2 + a * 2;
      g.fillStyle(color, Phaser.Math.Clamp(a, 0, 1));
      g.fillCircle(buf[i].x, buf[i].y, r);
    }
  }

  private makeRingTexture(
    key: string,
    innerRadius: number,
    outerRadius: number,
    color: number,
    alpha = 0.9
  ) {
    const thickness = Math.max(1, outerRadius - innerRadius);
    const r = innerRadius + thickness / 2;
    const size = outerRadius * 2 + 4;

    const g = this.add.graphics().setVisible(false);
    g.lineStyle(thickness, color, alpha);
    g.strokeCircle(size / 2, size / 2, r);

    g.lineStyle(thickness * 0.6, color, alpha * 0.5);
    g.strokeCircle(size / 2, size / 2, r);
    g.lineStyle(thickness * 0.3, color, alpha * 0.25);
    g.strokeCircle(size / 2, size / 2, r);

    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeShipTriangleTexture(key: string, size: number, color: number) {
    const g = this.add.graphics().setVisible(false);
    const w = size, h = size * 0.6;

    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(w * 0.6, h * 0.5);     // tip
    g.lineTo(w * 0.0, h * 0.15);    // tail-top
    g.lineTo(w * 0.0, h * 0.85);    // tail-bottom
    g.closePath();
    g.fillPath();

    g.generateTexture(key, Math.ceil(w), Math.ceil(h));
    g.destroy();
  }

  private getNearestPlanet(): { planet: Phaser.GameObjects.Sprite, distSq: number } {
    let best = this.planets[0];
    let bestDistSq = Number.POSITIVE_INFINITY;

    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      const dx = this.ship.x - p.x;
      const dy = this.ship.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = p;
      }
    }
    return { planet: best, distSq: bestDistSq };
  }

  private applyPointGravity(
    srcX: number,
    srcY: number,
    massLike: number,
    K: number,
    dts: number
  ) {
    if (this.docked || this.exploding || !this.ship) return;

    const dx = srcX - this.ship.x;
    const dy = srcY - this.ship.y;
    const dist = Math.max(Math.hypot(dx, dy), this.GRAVITY_MIN_R);

    let accel = (K * massLike) / (dist * dist);
    accel = Math.min(accel, this.GRAVITY_MAX_A);

    const ux = dx / dist;
    const uy = dy / dist;

    this.shipVel.x += ux * accel * dts;
    this.shipVel.y += uy * accel * dts;
  }

  private showAboutModal() {
    this.modalOpen = true;

    const { width, height } = this.scale;

    this.aboutBackdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: false })
      .setDepth(1600);
    this.uiLayer.add(this.aboutBackdrop);

    const panel = this.add.rectangle(0, 0, 560, 320, 0x1a1d24, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setOrigin(0.5)
      .setDepth(1601);

    const title = this.add.text(0, 0, "About", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "26px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1602);

    const body = this.add.text(0, 0,
      "Celeste was built over 4 days. Protoyped in Express & SQLite. Implemented with TypeScript, Phaser3, Vite, Node.js, and DynamoDB. Hosted via CloudFront on Amazon Web Services.\n\n",
      {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        color: "#dddddd",
        wordWrap: { width: 520 }
      }).setOrigin(0.5, 0).setDepth(1602);

    // Two placeholder links
    const linkStyle = {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "16px",
      color: "#77b7ff",
      underline: true as unknown as boolean 
    };

    const link1 = this.add.text(0, 0, "Placeholder Link 1", linkStyle)
      .setOrigin(0.5, 0)
      .setDepth(1602)
      .setInteractive({ useHandCursor: true });
    link1.on("pointerup", () => { if (typeof window !== "undefined") window.open("https://example.com/one", "_blank"); });

    const link2 = this.add.text(0, 0, "Placeholder Link 2", linkStyle)
      .setOrigin(0.5, 0)
      .setDepth(1602)
      .setInteractive({ useHandCursor: true });
    link2.on("pointerup", () => { if (typeof window !== "undefined") window.open("https://example.com/two", "_blank"); });

    this.aboutOkButton = this.add.rectangle(0, 0, 140, 44, 0x1f8cff, 1)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setDepth(1602)
      .setInteractive({ useHandCursor: true });
    this.aboutOkLabel = this.add.text(0, 0, "OK", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(1603);

    this.aboutOkButton.on("pointerover", () => this.aboutOkButton!.setFillStyle(0x2a95ff, 1));
    this.aboutOkButton.on("pointerout",  () => this.aboutOkButton!.setFillStyle(0x1f8cff, 1));
    this.aboutOkButton.on("pointerup",   () => this.closeAboutModal());

    this.input.keyboard?.once("keydown-ENTER", () => this.closeAboutModal());
    this.input.keyboard?.once("keydown-SPACE", () => this.closeAboutModal());
    this.input.keyboard?.once("keydown-ESC",   () => this.closeAboutModal());

    this.aboutModal = this.add.container(0, 0, [
      panel, title, body, link1, link2, this.aboutOkButton, this.aboutOkLabel
    ]).setDepth(1601);
    this.uiLayer.add(this.aboutModal);

    this.layoutAboutModal();
  }

  private layoutAboutModal() {
    if (!this.aboutModal || !this.aboutBackdrop) return;

    const { width, height } = this.scale;
    this.aboutBackdrop.setSize(width, height);

    const panel = this.aboutModal.list[0] as Phaser.GameObjects.Rectangle;
    const title = this.aboutModal.list[1] as Phaser.GameObjects.Text;
    const body  = this.aboutModal.list[2] as Phaser.GameObjects.Text;
    const link1 = this.aboutModal.list[3] as Phaser.GameObjects.Text;
    const link2 = this.aboutModal.list[4] as Phaser.GameObjects.Text;

    const panelW = Math.min(600, Math.max(360, width - 80));
    const panelH = Math.min(360, Math.max(240, height - 160));
    panel.setSize(panelW, panelH);

    this.aboutModal.setPosition(width / 2, height / 2);

    const pad = 18;
    let y = -panelH / 2 + pad;

    title.setPosition(0, y); y += 40;

    body.setWordWrapWidth(panelW - 2 * pad);
    body.setPosition(0, y); y += body.height + 10;

    link1.setPosition(0, y); y += link1.height + 6;
    link2.setPosition(0, y); y += link2.height + 6;

    const btnY = panelH / 2 - 40;
    this.aboutOkButton!.setPosition(0, btnY);
    this.aboutOkLabel!.setPosition(0, btnY);
  }

  private closeAboutModal() {
    this.modalOpen = false;
    this.aboutModal?.destroy();
    this.aboutBackdrop?.destroy();
    this.aboutOkButton = undefined;
    this.aboutOkLabel = undefined;
    this.aboutModal = undefined;
    this.aboutBackdrop = undefined;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#000000",
  parent: "app",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: { pixelArt: false, antialias: true },
  scene: [SpaceScene]
};

new Phaser.Game(config);
