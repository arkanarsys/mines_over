import Phaser from "phaser";
import { Cell } from "./cell";

const cell_img_size = { x: 64, y: 64 };
const vbc = "#140709";

export class Level extends Phaser.Scene {
	constructor() {
		super({ key: "Level" });
	}
	init(data) {
		this.cells = [];
		this.threshold_button = null;
		this.point_hint_threshold = 1;
		this.width = data.width;
		this.height = data.height;
		this.game_size = data.game_size;
		this.border_size = data.border;
		this.bg_img = data.bg_img;
		this.id = data.id;
		this.rules = {
			overunder: false,
			balance: true,
		};

		this.cell_size = {
			x: Math.floor(this.game_size.width / (this.width + this.border_size)),
			y: Math.floor(this.game_size.height / (this.height + this.border_size)),
		};

		this.cell_scale = (this.cell_size.x / cell_img_size.x) * 0.9;

		this.bomb_key = data.bomb;
		this.hidden_cell_key = data.hidden_cell;
		this.revealed_cell_key = data.revealed_cell;

		this.story_text = data.story_text;

		this.bg = null;
		this.bg_tint = null;
		this.pseudomine_counter = null;
		this.flag_toggle = null;

		this.volume = 50;
		if (this.registry.has("volume")) {
			this.volume = this.registry.get("volume");
		}
		this.max_pseudomines = data.pseudomines;
		this.pseudomines = this.max_pseudomines;
	}
	reset() {
		for (let i = 0; i < this.cells.length; i++) {
			for (let j = 0; j < this.cells[i].length; j++) {
				this.cells[i][j].img.destroy();
				this.cells[i][j].indicators.forEach((ind) => {
					ind.destroy();
				});
				this.cells[i][j].flag.destroy();
				this.cells[i][j].hover.destroy();
			}
		}
		this.cells = [];
		if (this.threshold_button) {
			this.threshold_button.destroy();
		}

		//this.bg.destroy();
		this.bg_tint.destroy();
	}
	create() {
		this.bg = this.add.image(256, 256, this.bg_img);
		this.bg.setScale(1.07, 1.07);
		const graphics = this.add.graphics();

		graphics.fillStyle(0x550000, 1.0);
		graphics.fillRect(0, 0, 512, 512);
		graphics.alpha = 0.25;
		this.bg_tint = graphics;

		if (this.rules.overunder) {
			const button = this.add
				.text(2, 2, "> " + this.point_hint_threshold + " >", {
					fontFamily: "Courier New",
					fontSize: 12,
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

			button.on(
				"pointerup",
				(() => {
					if (this.point_hint_threshold < 4) {
						this.point_hint_threshold++;
					} else {
						this.point_hint_threshold = 1;
					}
					button.text = ">" + this.point_hint_threshold + ">";
					for (let i = 0; i < this.cells.length; i++) {
						for (let j = 0; j < this.cells[i].length; j++) {
							this.cells[i][j].computeIndicators(!this.cells[i][j].hidden);
						}
					}
				}).bind(this),
			);

			this.threshold_button = button;
		}

		const restart_button = this.add
			.text(512 - 64, 2, "restart", {
				fontFamily: "Courier New",
				fontSize: 12,
				color: "#ffffff",
				align: "left",
				fixedWidth: 64,
				backgroundColor: vbc,
			})
			.setPadding(4)
			.setOrigin(0);
		restart_button.alpha = 0.75;

		restart_button.setInteractive({ useHandCursor: true });

		restart_button.on("pointerover", () => {
			restart_button.setBackgroundColor("#8d8d8d");
		});

		restart_button.on("pointerout", () => {
			restart_button.setBackgroundColor(vbc);
		});

		restart_button.on("pointerup", () => {
			//it appears that when you make an object let this, using all consts
			//it uses the name as the name of the property of the object
			//as well as setting the value
			this.restart();
		});

		let vol_pos = { x: 192, y: 2 };
		let spacing = 0;
		const volume_up_button = this.add
			.text(vol_pos.x + 96, vol_pos.y, "+", {
				fontFamily: "Courier New",
				fontSize: 14,
				color: "#ffffff",
				align: "left",
				fixedWidth: 32,
				fixedHeight: 22,
				backgroundColor: vbc,
			})
			.setPadding(4)
			.setOrigin(0);
		volume_up_button.alpha = 0.75;

		volume_up_button.setInteractive({ useHandCursor: true });

		volume_up_button.on("pointerover", () => {
			volume_up_button.setBackgroundColor("#8d8d8d");
		});

		volume_up_button.on("pointerout", () => {
			volume_up_button.setBackgroundColor(vbc);
		});

		const volume_down_button = this.add
			.text(vol_pos.x + 64, vol_pos.y, "-", {
				fontFamily: "Courier New",
				fontSize: 14,
				color: "#ffffff",
				align: "left",
				fixedWidth: 32,
				fixedHeight: 22,
				backgroundColor: vbc,
			})
			.setPadding(4)
			.setOrigin(0);
		volume_down_button.alpha = 0.75;

		volume_down_button.setInteractive({ useHandCursor: true });

		volume_down_button.on("pointerover", () => {
			volume_down_button.setBackgroundColor("#8d8d8d");
		});

		volume_down_button.on("pointerout", () => {
			volume_down_button.setBackgroundColor(vbc);
		});

		this.volume_text = this.add
			.text(vol_pos.x, vol_pos.y, "  :" + this.volume + "%", {
				fontFamily: "Courier New",
				fontSize: 12,
				color: "#ffffff",
				align: "left",
				fixedWidth: 64,
				backgroundColor: "#2d0000",
			})
			.setPadding(4)
			.setOrigin(0);
		this.volume_text.alpha = 0.75;

		volume_up_button.on("pointerup", () => {
			this.update_volume(this.volume + 5);
		});
		volume_down_button.on("pointerup", () => {
			this.update_volume(this.volume - 5);
		});

		this.update_volume(this.volume);
		this.add.image(vol_pos.x + 12, vol_pos.y + 11, "volume").setScale(0.5, 0.5);

		let mine_count = 0;

		let id = 0;
		for (let i = 0; i < this.width; i++) {
			this.cells.push([]);
			for (let j = 0; j < this.height; j++) {
				console.log(i, j, this.cell_size, this.cell_scale);
				let img = this.add.image(
					(this.border_size + i) * this.cell_size.x,
					(this.border_size + j) * this.cell_size.y,
					this.hidden_cell_key,
				);
				img.setScale(this.cell_scale);
				img.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

				let mine = 0;
				let isStart =
					i == Math.round(this.width / 2) - 1 &&
					j == Math.round(this.height / 2) - 1;
				if (!isStart) {
					if (Math.random() < 0.2) {
						mine = 1;
						mine_count++;
					}
				}
				let cell = new Cell(
					this,
					img,
					id,
					{ x: i, y: j },
					this.cell_size,
					mine,
				);
				this.cells[i].push(cell);
				id += 1;
			}
		}

		const on_color = "#afaf00";
		this.pm_on = true;

		const pmcounter = this.add
			.text(2, 2, "  : " + this.pseudomines + "/" + this.max_pseudomines, {
				fontFamily: "Courier New",
				fontSize: 12,
				color: "#ffffff",
				align: "left",
				fixedWidth: 60,
				backgroundColor: on_color,
			})
			.setPadding(4)
			.setOrigin(0);

		pmcounter.alpha = 0.75;
		this.pseudomine_counter = pmcounter;
		this.add.image(12, 13, "fakebomb").setScale(0.5, 0.5);
		pmcounter.setInteractive({ useHandCursor: true });
		this.flags_left = mine_count;
		this.mine_count = mine_count;
		let ftext = " : " + this.flags_left + "\\" + mine_count;
		const fToggle_pos = { x: 70, y: 2 };
		const flag_toggle = this.add
			.text(fToggle_pos.x, fToggle_pos.y, ftext, {
				fontFamily: "Courier New",
				fontSize: 12,
				color: "#ffffff",
				align: "left",
				fixedWidth: 68,
				backgroundColor: vbc,
			})
			.setPadding(4)
			.setOrigin(0);
		flag_toggle.alpha = 0.75;
		this.flag_toggle = flag_toggle;
		this.flag_on = false;

		this.add
			.image(fToggle_pos.x + 6, fToggle_pos.y + 9, "flag")
			.setScale(0.25, 0.25);
		flag_toggle.setInteractive({ useHandCursor: true });

		this.flag_toggle = flag_toggle;
		pmcounter.on("pointerover", () => {
			pmcounter.setBackgroundColor("#8d8d8d");
		});

		pmcounter.on("pointerout", () => {
			if (this.pm_on) pmcounter.setBackgroundColor(on_color);
			else pmcounter.setBackgroundColor(vbc);
		});

		pmcounter.on("pointerup", () => {
			this.pm_on = !this.pm_on;
			if (this.pm_on) {
				pmcounter.setBackgroundColor(on_color);
				this.flag_on = false;
				flag_toggle.setBackgroundColor(vbc);
			} else pmcounter.setBackgroundColor(vbc);
		});

		flag_toggle.on("pointerover", () => {
			if (!this.flag_on) flag_toggle.setBackgroundColor("#8d8d8d");
		});

		flag_toggle.on("pointerout", () => {
			if (!this.flag_on) flag_toggle.setBackgroundColor(vbc);
		});

		flag_toggle.on("pointerup", () => {
			this.flag_on = !this.flag_on;
			//let t = "on";
			let c = vbc;
			if (this.flag_on) {
				//t = "off";
				c = on_color;
				this.pm_on = false;
				pmcounter.setBackgroundColor(vbc);
			}
			//flag_toggle.text = "  : " + t;
			flag_toggle.setBackgroundColor(c);
		});

		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				let isStart =
					i != Math.round(this.width / 2) - 1 ||
					j != Math.round(this.height / 2) - 1;
				let cell = this.cells[i][j];
				cell.computeIndicators(false);
			}
		}

		let page_offset = 200;
		const next_page_button = this.add
			.text(page_offset + 96, 488, ">", {
				fontFamily: "Courier New",
				fontSize: 14,
				color: "#ffffff",
				align: "left",
				fixedWidth: 32,
				fixedHeight: 22,
				backgroundColor: vbc,
			})
			.setPadding(4)
			.setOrigin(0.5, 0);
		next_page_button.alpha = 0.75;

		next_page_button.setInteractive({ useHandCursor: true });

		next_page_button.on("pointerover", () => {
			next_page_button.setBackgroundColor("#8d8d8d");
		});

		next_page_button.on("pointerout", () => {
			next_page_button.setBackgroundColor(vbc);
		});

		const prev_page_button = this.add
			.text(page_offset, 488, "<", {
				fontFamily: "Courier New",
				fontSize: 14,
				color: "#ffffff",
				align: "left",
				fixedWidth: 32,
				fixedHeight: 22,
				backgroundColor: vbc,
			})
			.setPadding(4)
			.setOrigin(0.5, 0);
		prev_page_button.alpha = 0.75;

		prev_page_button.setInteractive({ useHandCursor: true });

		prev_page_button.on("pointerover", () => {
			prev_page_button.setBackgroundColor("#8d8d8d");
		});

		prev_page_button.on("pointerout", () => {
			prev_page_button.setBackgroundColor(vbc);
		});

		this.page_text = this.add
			.text(page_offset + 48, 488, "page " + (this.id + 1), {
				fontFamily: "Courier New",
				fontSize: 12,
				color: "#ffffff",
				align: "left",
				fixedWidth: 64,
				backgroundColor: "#2d0000",
			})
			.setPadding(4)
			.setOrigin(0.5, 0);
		this.page_text.alpha = 0.75;

		next_page_button.on("pointerup", () => {
			this.goto_level(this.id + 1);
			//this.update_volume(this.volume + 5);
		});
		prev_page_button.on("pointerup", () => {
			this.goto_level(this.id - 1);
			//this.update_volume(this.volume - 5);
		});

		/*this.cells[Math.round(this.width / 2) - 1][
			Math.round(this.height / 2) - 1
		].setHidden(false);*/

		this.losing = false;
		this.minesound_counter = 0.0;
	}

	update_volume(new_volume) {
		this.volume = new_volume;

		if (this.volume > 100) {
			this.volume = 100;
		} else if (this.volume < 0) {
			this.volume = 0;
		}
		this.registry.set("volume", this.volume);
		let v = this.volume / 100;
		this.sound.setVolume(v * v);
		this.volume_text.setText("  : " + this.volume + "%");
	}
	update(time, delta) {
		if (this.losing) {
			this.minesound_counter += delta;
			if (this.minesound_counter > 1000.0) {
				this.sound.play("mine");
				this.minesound_counter = 0.0;
			}
		}
	}
	on_cell_clicked(pointer) {
		console.log("pointer pos: ", pointer.x, pointer.y);
		const hovered_cell = {
			x: Math.round(pointer.x / this.cell_size.x) - this.border_size,
			y: Math.round(pointer.y / this.cell_size.y) - this.border_size,
		};
		console.log("cell pos: ", hovered_cell.x, hovered_cell.y);
		if (
			hovered_cell.x >= 0 &&
			hovered_cell.x < this.width &&
			hovered_cell.y >= 0 &&
			hovered_cell.y < this.height
		) {
			let c = this.cells[hovered_cell.x][hovered_cell.y];
			if (c.hidden) {
				c.setHidden(false);
				this.check_game_status();
			} else {
				c.setHidden(true);
			}
		}
	}
	check_game_status() {
		let only_bombs_left = true;
		for (let i = 0; i < this.cells.length; i++) {
			for (let j = 0; j < this.cells[i].length; j++) {
				if (this.cells[i][j].mine == 0 && this.cells[i][j].hidden) {
					only_bombs_left = false;
				}
			}
		}
		if (only_bombs_left) {
			this.win();
		}
	}
	win() {
		let t = this.add.text(256, 200, this.story_text, {
			align: "center",
			fontSize: 14,
			fontFamily: "Courier New",
			fontStyle: "bold",
			color: "#aa0000",
			fixedWidth: 512,
			//fixedHeight: 512,
			backgroundColor: vbc,
		});
		t.alpha = 0.85;
		t.setOrigin(0.5, 0.15);
		this.reset();
		console.log("win:", this.id);
		this.sound.play("theme", { loop: false });
		const next_button = this.add
			.text(256 - 32, 320, "next", {
				fontFamily: "Courier New",
				fontSize: 16,
				color: "#ffffff",
				align: "left",
				fixedWidth: 48,
				fixedHeight: 22,
				backgroundColor: "#2d8d0d",
			})
			.setPadding(4);

		next_button.setInteractive({ useHandCursor: true });

		next_button.on("pointerover", () => {
			next_button.setBackgroundColor("#8d8d8d");
		});

		next_button.on("pointerout", () => {
			next_button.setBackgroundColor("#2d8d0d");
		});

		next_button.on("pointerup", this.goto_next_level.bind(this));

		this.tweens.add({
			targets: this.bg,
			ease: "Quadratic.InOut",
			props: {
				scaleX: { value: 5.0, duration: 100000 },
				scaleY: { value: 5.0, duration: 100000 },
			},
		});
	}
	lose() {
		const graphics = this.add.graphics();

		graphics.fillStyle(0xffffff, 1.0);
		graphics.fillRect(0, 0, 512, 512);
		graphics.alpha = 0.0;
		for (let i = 0; i < this.cells.length; i++) {
			for (let j = 0; j < this.cells[i].length; j++) {
				this.cells[i][j].img.disableInteractive();
			}
		}
		this.losing = true;
		this.tweens.add({
			targets: graphics,
			ease: "Power1",
			props: {
				alpha: {
					value: { from: 0, to: 1.0 },
					duration: 1000,
				},
			},
			delay: 3000,
			onStart: () => {
				this.sound.play("boom");
				this.losing = false;
			},
			onComplete: () => {
				this.reset();
				const title = this.add
					.text(256 - 120, 180, "Game Over", {
						fontFamily: "Courier New",
						fontSize: 36,
						color: "#ff0000",
						align: "center",
						fixedWidth: 240,
						fixedHeight: 40,
						//backgroundColor: "#2d2d2d",
					})
					.setPadding(4)
					.setOrigin(0);

				const button = this.add
					.text(256 - 40, 260, "restart", {
						fontFamily: "Courier New",
						fontSize: 16,
						color: "#ff0000",
						align: "left",
						fixedWidth: 80,
						fixedHeight: 22,
						backgroundColor: vbc,
					})
					.setPadding(4)
					.setOrigin(0);

				button.setInteractive({ useHandCursor: true });

				button.on("pointerover", () => {
					button.setBackgroundColor("#8d8d8d");
				});

				button.on("pointerout", () => {
					button.setBackgroundColor(vbc);
				});

				button.on("pointerup", () => {
					this.restart();
				});

				this.losing = false;
			},
		});
	}
	restart() {
		this.scene.start("Level", {
			width: this.width,
			height: this.height,
			bomb: this.bomb_key,
			hidden_cell: this.hidden_cell_key,
			revealed_cell: this.revealed_cell_key,
			border: this.border_size,
			game_size: this.game_size,
			story_text: this.story_text,
			bg_img: this.bg_img,
			id: this.id,
			pseudomines: this.max_pseudomines,
		});
	}
	goto_next_level() {
		this.goto_level(this.id + 1);
	}
	goto_level(id) {
		let levels = this.registry.get("levels");
		console.log(levels, levels.length);
		if (id >= levels.length || id < 0) {
			this.scene.start("Game");
		} else {
			let next_level = this.registry.get("levels")[id];
			this.scene.start("Level", {
				width: next_level.width,
				height: next_level.height,
				bomb: this.bomb_key,
				hidden_cell: this.hidden_cell_key,
				border: this.border_size,
				game_size: this.game_size,
				story_text: next_level.story_text,
				bg_img: next_level.image,
				id: next_level.id,
				pseudomines: next_level.pseudomines,
				revealed_cell: this.revealed_cell_key,
			});
		}
	}
}
