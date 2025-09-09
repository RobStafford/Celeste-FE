import Phaser from "phaser";
import SpaceScene from "@/scenes/SpaceScene";

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
