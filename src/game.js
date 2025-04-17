import "/style.css";
import Phaser from "phaser";
import { Cell } from "./cell.js";
import { Level } from "./level.js";

const w = 6;
const h = 6;
const game_size = { width: 512, height: 512 };
const border = 1;
const cell_size = {
	x: Math.floor(game_size.width / (w + border)),
	y: Math.floor(game_size.height / (h + border)),
};

const img_size = { x: 512, y: 512 };
const scale = (cell_size.x / img_size.x) * 0.9;

const width = w;
const height = h;
const hidden_cell = "cell00";
const revealed_cell = "cell01";
const bomb = "bomb";

export class Game extends Phaser.Scene {
	constructor() {
		super({ key: "Game" });
		this.current_level = null;
	}

	preload() {
		this.load.image("title", "assets/title.png");
		this.load.image("bg00", "assets/bg00.png");
		this.load.image("bg01", "assets/bg01.png");
		this.load.image("bg02", "assets/bg02.png");
		this.load.image("bg03", "assets/bg03.png");
		this.load.image("cell00", "assets/cell00.png");
		this.load.image("cell01", "assets/cell01.png");
		this.load.image("tri", "assets/tri.png");
		this.load.image("circle", "assets/circle.png");
		this.load.image("square", "assets/square.png");
		this.load.image("flag", "assets/flag.png");
		this.load.image("bomb", "assets/bomb.png");
		this.load.image("fakebomb", "assets/fakebomb.png");
		this.load.image("volume", "assets/volume.png");
		this.load.audio("theme", ["assets/theme.ogg"]);
		this.load.audio("hover", ["assets/hover.ogg"]);
		this.load.audio("clear", ["assets/clear.ogg"]);
		this.load.audio("hover_flag", ["assets/hover_flag.ogg"]);
		this.load.audio("mine", ["assets/mine.ogg"]);
		this.load.audio("boom", ["assets/boom.ogg"]);
		this.load.audio("fakebomb", ["assets/fakemine.ogg"]);
	}

	create() {
		this.input.mouse.disableContextMenu();
		let levels = [
			{
				name: "page 1   (6x6)",
				id: 0,
				width: 6,
				height: 6,
				pseudomines: 3,
				story_text: [
					"you enter the catacombs",
					"to reap what you had once sown",
					"",
					"you collect the bones, and sort them",
					"some can be used as is",
					"others need breaking",
				],
				image: "bg00",
			},
			{
				name: "page 2   (8x8)",
				id: 1,
				width: 8,
				height: 8,
				pseudomines: 4,
				story_text: [
					"your lips are cracked like the land",
					"around the forrest at the base of your tongue",
					"a town, writing on the well",
					"",
					"you hear a sound",
					"",
					"theres obviosly nothing there",
				],
				image: "bg01",
			},
			{
				name: "page 3 (10x10)",
				id: 2,
				width: 10,
				height: 10,
				pseudomines: 5,
				story_text: [
					"in the sunrise you see a figure",
					"it jumps off the sumit and falls upwards",
					"",
					"every hour feels like a minute",
					"you feel that the skys read your mind",
					"you hate the feeling",
				],
				image: "bg02",
			},
			{
				name: "page 4 (12x12)",
				id: 3,
				width: 12,
				height: 12,
				pseudomines: 6,
				story_text: [
					"you know theres something past the dunes",
					"but you wont push through",
					"",
					"nobody needs to do this",
					"",
					"you think about what youre wearing",
					"and bury your head in the sand",
				],
				image: "bg03",
			},
		];
		this.registry.set("levels", levels);
		const title = this.add
			.text(250, 168, "by arkanar-systems", {
				fontFamily: "Courier New",
				fontSize: 16,
				color: "#eeeeee",
				align: "center",
				fixedWidth: 220,
				fixedHeight: 40,
				//backgroundColor: "#2d2d2d",
			})
			.setPadding(4)
			.setOrigin(0);
		this.add.image(96, 0, "title").setOrigin(0);
		let i = 0;
		let buttons = [];
		levels.forEach((l) => {
			const button = this.add
				.text(256 - 64, 200 + i * 32, l.name, {
					fontFamily: "Courier New",
					fontSize: 12,
					color: "#ffffff",
					align: "center",
					fixedWidth: 128,
					fixedHeight: 32,
					backgroundColor: "#2d2d2d",
				})
				.setPadding(4)
				.setOrigin(0);

			i++;
			button.setInteractive({ useHandCursor: true });

			button.on("pointerover", () => {
				button.setBackgroundColor("#8d8d8d");
			});

			button.on("pointerout", () => {
				button.setBackgroundColor("#2d2d2d");
			});

			button.on("pointerup", () => {
				//it appears that when you make an object let this, using all consts
				//it uses the name as the name of the property of the object
				//as well as setting the value

				this.scene.start("Level", {
					width: l.width,
					height: l.height,
					bomb,
					hidden_cell,
					revealed_cell,
					border,
					game_size,
					story_text: l.story_text,
					bg_img: l.image,
					id: l.id,
					pseudomines: l.pseudomines,
				});
			});
		});
	}
}
