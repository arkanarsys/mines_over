import "/style.css";
import Phaser from "phaser";

import { Game } from "./src/game.js";
import { MainMenu } from "./src/mainMenu.js";
import { Level } from "./src/level.js";

const game_size = { width: 512, height: 512 };

const config = {
	type: Phaser.CANVAS,
	width: game_size.width,
	height: game_size.height,
	canvas: gameCanvas,
	scene: [Game, Level],
	backgroundColor: "#101010",
	scale: {
		// keep aspect ratio:
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	pixelArt: true,
};

const game = new Phaser.Game(config);
//stop sounds from accumulating when brwoser window is unfocused
//the BLUR event automatically calls game.sound.pauseAll
//so I have to remove that callback and instead mute the audio so I dont get sued
//for destroying peoples eardrums
game.events.off("blur");
game.events.on("blur", () => {
	game.sound.setMute(true);
});
game.events.on("focus", () => {
	game.sound.setMute(false);
});
