import Phaser from "phaser";

export class Cell {
	constructor(level, img, id, pos, cell_size, mine = 0) {
		this.level = level;
		this.img = img;
		this.img.setInteractive();
		this.id = id;
		this.pos = pos;
		this.cell_size = cell_size;
		this.hidden = true;
		this.mine = mine;
		this.indicators = [
			this.level.add.image(0, 0, "circle"),
			this.level.add.image(0, 0, "tri"),
			this.level.add.image(0, 0, "tri"),
			this.level.add.image(0, 0, "tri"),
			this.level.add.image(0, 0, "tri"),
		];
		this.hasAdj = false;
		this.flag = this.level.add
			.sprite(
				(this.level.border_size + this.pos.x) * this.cell_size.x +
					this.cell_size.x * 0.33,
				(this.level.border_size + this.pos.y) * this.cell_size.y +
					this.cell_size.y * 0.33,
				"flag",
			)
			.setInteractive();
		const flag = this.flag;
		this.flag_enabled = false;
		this.flag.setVisible(false);

		this.hover = this.level.add.graphics();
		this.hover.fillStyle(0x550000, 0.25);
		this.hover.fillRect(
			this.img.x - this.cell_size.x / 2,
			this.img.y - this.cell_size.y / 2,
			this.cell_size.x,
			this.cell_size.y,
		);
		this.hover.setVisible(false);

		this.pm_hover = this.level.add.graphics();

		this.img.on("pointerover", () => {
			if (this.level.flag_on) {
				this.flag.setVisible(true);
			} else if (this.level.pm_on && !this.hidden) {
				this.img.setTexture("fakebomb");
				if (this.mine != 2) this.img.alpha = 0.5;
			}
			this.hover.setVisible(true);
			this.level.sound.play("hover");
		});

		this.flag.on("pointerout", () => {
			this.flag.clearTint();
			if (!this.flag_enabled) {
				this.flag.setVisible(false);
			}
		});
		this.img.on("pointerout", () => {
			if (!this.flag_enabled) {
				this.flag.setVisible(false);
			}
			this.hover.setVisible(false);
			if (this.level.pm_on && !this.hidden && this.mine == 0) {
				this.img.setTexture(this.level.revealed_cell_key);
				if (this.mine != 2) this.img.alpha = 0.1;
			}
		});
		this.flag.setScale(this.level.cell_scale * 0.4);

		this.img.on("pointerdown", (p) => {
			if (this.level.flag_on || p.rightButtonDown()) {
				if (this.flag_enabled) {
					this.flag_enabled = false;
					this.level.flags_left++;
				} else {
					if (this.level.flags_left > 0) {
						this.flag_enabled = true;
						this.level.flags_left--;
					}
				}
				this.flag.setVisible(this.flag_enabled);
				this.level.sound.play("hover_flag");
				let ftext =
					" : " + this.level.flags_left + "\\" + this.level.mine_count;
				this.level.flag_toggle.text = ftext;
			} else {
				if (this.hidden) {
					this.setHidden(false);
					if (this.mine == 0) {
						this.level.sound.play("clear");
						if (this.level.pm_on && this.level.pseudomines > 0) {
							this.img.setTexture("fakebomb");
							if (this.mine != 2) this.img.alpha = 0.5;
						}
					} else {
						this.level.sound.play("mine");
					}
					this.level.check_game_status();
				} else {
					if (
						this.level.pm_on &&
						this.level.pseudomines > 0 &&
						this.mine != 2
					) {
						for (let n of this.getNeighbours()) {
							n.computeIndicators(!n.hidden);
						}
						this.level.sound.play("fakebomb");
						this.img.setTexture("fakebomb");
						this.img.alpha = 1.0;
						this.mine = 2;
						//this.setHidden(true);
						let recalc_cells = [].concat(
							this.getCellsInDir("left"),
							this.getCellsInDir("right"),
							this.getCellsInDir("up"),
							this.getCellsInDir("down"),
						);
						console.log(recalc_cells);
						recalc_cells.forEach((cell) => {
							cell.computeIndicators(!cell.hidden);
						});
						this.level.pseudomines--;
						this.level.pseudomine_counter.text =
							"  : " +
							this.level.pseudomines +
							"/" +
							this.level.max_pseudomines;
					}
				}
			}
		});
	}
	setHidden(isHidden) {
		this.hidden = isHidden;
		if (isHidden) {
			this.img.setTexture(this.level.hidden_cell_key);
			this.img.alpha = 0.88;
		} else {
			if (this.mine == 0) {
				this.img.setTexture(this.level.revealed_cell_key);
				this.img.alpha = 0.1;
				if (!this.hasAdj) {
					let nrecurse = this.getNeighbours();
					let visited = this.getNeighbours();
					visited.push(this);
					while (nrecurse.length > 0) {
						let c = nrecurse.pop();

						if (c.hidden) {
							c.setHidden(false);
						}
						if (!c.hasAdj) {
							c.getNeighbours().forEach((n) => {
								if (!visited.includes(n)) {
									nrecurse.push(n);
									visited.push(n);
								}
							});
						}
					}
				}
				this.computeIndicators();
			} else {
				this.img.setTexture(this.level.bomb_key);
				this.img.alpha = 1.0;
				this.level.tweens.add({
					targets: this.img,
					ease: "Cubic.easeIn",
					props: {
						rotation: { value: 25, duration: 4000 },
					},
				});
				//this.level.bg_tint.setToTop();
				this.level.lose();
			}
		}
	}
	computeIndicators(draw = true) {
		this.indicators.forEach((i) => {
			i.setVisible(false);
		});

		console.log(
			"cell : " + this.id + " thr == ",
			+this.level.point_hint_threshold,
			", hidden == " + this.hidden,
		);

		let foundAdj = false;
		this.getNeighbours().forEach((ncell) => {
			if (ncell.mine == 1 || ncell.mine == 2) {
				foundAdj = true;
			}
		});
		this.hasAdj = foundAdj;

		const iCircle = 0;

		const border = this.level.border_size;
		const cell_size = this.cell_size;

		if (draw && foundAdj) {
			let cimg = this.indicators[iCircle];
			cimg.setVisible(true);
			cimg.x = (this.pos.x + border) * cell_size.x;
			cimg.y = (border + this.pos.y) * cell_size.y;
			cimg.setScale(0.5, 0.5);

			if (this.level.rules.overunder) {
				this.compute_ind_overunder();
			} else if (this.level.rules.balance) {
				this.compute_ind_balance();
			}
		}
	}
	compute_ind_overunder() {
		const threshold = this.level.point_hint_threshold;
		const iRight = 1;
		const iDown = 2;
		const iLeft = 3;
		const iUp = 4;
		const border = this.level.border_size;
		const cell_size = this.cell_size;
		let lefts = 0;
		this.getCellsInDir("left").forEach((cell) => {
			if (cell.mine != 0) {
				lefts += 1;
			}
		});

		if (lefts >= threshold) {
			let img = this.indicators[iLeft];
			img.x = (this.pos.x + border) * cell_size.x - cell_size.x * 0.25;
			img.y = (border + this.pos.y) * cell_size.y;
			img.setVisible(true);
			img.rotation = -Math.PI / 2;
		} else if (lefts >= 0) {
			let img = this.indicators[iLeft];
			img.x = (this.pos.x + border) * cell_size.x - cell_size.x * 0.25;
			img.y = (border + this.pos.y) * cell_size.y;
			img.setVisible(true);
			img.rotation = Math.PI / 2;
		}

		let rights = 0;
		this.getCellsInDir("right").forEach((cell) => {
			if (cell.mine != 0) {
				rights += 1;
			}
		});

		if (rights >= threshold) {
			let img = this.indicators[iRight];
			img.x = (this.pos.x + border) * cell_size.x + cell_size.x * 0.25;
			img.y = (border + this.pos.y) * cell_size.y;
			img.setVisible(true);
			img.rotation = Math.PI / 2;
			console.log("greater");
		} else if (rights >= 0) {
			let img = this.indicators[iRight];
			img.x = (this.pos.x + border) * cell_size.x + cell_size.x * 0.25;
			img.y = (border + this.pos.y) * cell_size.y;
			img.setVisible(true);
			img.rotation = -Math.PI / 2;
			console.log("right lesser: " + rights + " < " + threshold);
		}

		let ups = 0;
		this.getCellsInDir("up").forEach((cell) => {
			if (cell.mine != 0) {
				ups += 1;
			}
		});
		if (ups >= threshold) {
			let img = this.indicators[iUp];
			img.x = (this.pos.x + border) * cell_size.x;
			img.y = (border + this.pos.y) * cell_size.y - cell_size.y * 0.25;
			img.setVisible(true);
			img.rotation = 0;
		} else if (ups >= 0) {
			let img = this.indicators[iUp];
			img.x = (this.pos.x + border) * cell_size.x;
			img.y = (border + this.pos.y) * cell_size.y - cell_size.y * 0.25;
			img.setVisible(true);
			img.rotation = Math.PI;
		}
		let downs = 0;
		this.getCellsInDir("down").forEach((cell) => {
			if (cell.mine != 0) {
				downs += 1;
			}
		});
		if (downs >= threshold) {
			let img = this.indicators[iDown];
			img.x = (this.pos.x + border) * cell_size.x;
			img.y = (border + this.pos.y) * cell_size.y + cell_size.y * 0.25;
			img.setVisible(true);
			img.rotation = Math.PI;
		} else if (downs >= 0) {
			let img = this.indicators[iDown];
			img.x = (this.pos.x + border) * cell_size.x;
			img.y = (border + this.pos.y) * cell_size.y + cell_size.y * 0.25;
			img.setVisible(true);
			img.rotation = 0;
		}
	}

	compute_ind_balance() {
		let downs = 0;
		this.getCellsInDir("down").forEach((cell) => {
			if (cell.mine != 0) {
				downs += 1;
			}
		});
		let ups = 0;
		this.getCellsInDir("up").forEach((cell) => {
			if (cell.mine != 0) {
				ups += 1;
			}
		});
		let lefts = 0;
		this.getCellsInDir("left").forEach((cell) => {
			if (cell.mine != 0) {
				lefts += 1;
			}
		});
		let rights = 0;
		this.getCellsInDir("right").forEach((cell) => {
			if (cell.mine != 0) {
				rights += 1;
			}
		});
		console.log({ ups, downs, lefts, rights });
		const iCircle = 0;
		const iRight = 1;
		const iDown = 2;
		const iLeft = 3;
		const iUp = 4;

		const cell_size = this.cell_size;
		const border = this.level.border_size;

		console.log({ cell_size, border });

		if (lefts > rights) {
			let img = this.indicators[iLeft];
			img.x = (this.pos.x + border) * cell_size.x - cell_size.x * 0.25;
			img.y = (border + this.pos.y) * cell_size.y;
			img.setVisible(true);
			img.rotation = Math.PI / 2;
			this.indicators[iRight].setVisible(false);
			console.log("left ", img.x, img.y);
		} else if (rights > lefts) {
			let img = this.indicators[iRight];
			img.x = (this.pos.x + border) * cell_size.x + cell_size.x * 0.25;
			img.y = (border + this.pos.y) * cell_size.y;
			img.setVisible(true);
			img.rotation = -Math.PI / 2;
			this.indicators[iLeft].setVisible(false);
			console.log("right", img.x, img.y);
		} else {
			this.indicators[iLeft].setVisible(false);
			this.indicators[iRight].setVisible(false);
			console.log("rl balance");
		}
		if (ups > downs) {
			let img = this.indicators[iUp];
			img.x = (this.pos.x + border) * cell_size.x;
			img.y = (border + this.pos.y) * cell_size.y - cell_size.y * 0.25;
			img.setVisible(true);
			img.rotation = Math.PI;
			this.indicators[iDown].setVisible(false);
			console.log("up");
		} else if (downs > ups) {
			let img = this.indicators[iDown];
			img.x = (this.pos.x + border) * cell_size.x;
			img.y = (border + this.pos.y) * cell_size.y + cell_size.y * 0.25;
			img.setVisible(true);
			img.rotation = 0;
			this.indicators[iUp].setVisible(false);
			console.log("down");
		} else {
			this.indicators[iUp].setVisible(false);
			this.indicators[iDown].setVisible(false);
			console.log("ud balance");
		}
	}
	getNeighbours() {
		let ns = [];
		if (this.pos.x > 0) {
			ns.push(this.level.cells[this.pos.x - 1][this.pos.y]);
		}
		if (this.pos.x < this.level.width - 1) {
			ns.push(this.level.cells[this.pos.x + 1][this.pos.y]);
		}
		if (this.pos.y > 0) {
			ns.push(this.level.cells[this.pos.x][this.pos.y - 1]);
		}
		if (this.pos.y < this.level.height - 1) {
			ns.push(this.level.cells[this.pos.x][this.pos.y + 1]);
		}
		return ns;
	}
	getCellsInDir(dir = "left") {
		let ns = [];
		switch (dir) {
			case "left":
				for (let i = this.pos.x - 1; i >= 0; i--) {
					ns.push(this.level.cells[i][this.pos.y]);
				}
				break;
			case "right":
				for (let i = this.pos.x + 1; i < this.level.width; i++) {
					ns.push(this.level.cells[i][this.pos.y]);
				}
				break;
			case "up":
				for (let j = this.pos.y - 1; j >= 0; j--) {
					ns.push(this.level.cells[this.pos.x][j]);
				}
				break;
			case "down":
				for (let j = this.pos.y + 1; j < this.level.height; j++) {
					ns.push(this.level.cells[this.pos.x][j]);
				}
				break;
		}
		return ns;
	}
}
