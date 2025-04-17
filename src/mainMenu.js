import Phaser from "phaser";
import { Game } from "./game";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenu" });
    this.current_level = null;
  }
  create() {
    const button = this.add
      .text(2, 2, "start", {
        fontFamily: "Arial",
        fontSize: "8",
        color: "#ffffff",
        align: "left",
        fixedWidth: 32,
        backgroundColor: "#2d2d2d",
      })
      .setPadding(4)
      .setOrigin(0);

    button.setInteractive({ useHandCursor: true });

    button.on("pointerover", () => {
      button.setBackgroundColor("#8d8d8d");
    });

    button.on("pointerout", () => {
      button.setBackgroundColor("#2d2d2d");
    });

    button.on("pointerup", () => {
      this.scene.start("Game");
    });
  }
}
