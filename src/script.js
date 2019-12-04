const [
	enterSymbol,
	terminal,
	browse,
	color,
	stdout,

	canvas
] = document.querySelectorAll("#enterSymbol, #terminal, #browse, #color, #stdout, #canvas");

var context = canvas.getContext("2d");

// settings
var helpText = null;
var asciiText = "ascii";

const cellInitialSizeX = 32;
const cellInitialSizeY = 32;
const rowInitialWidth = 64;

var rowNumWidth = rowInitialWidth;

var cellSizeX = cellInitialSizeX;
var cellSizeY = cellInitialSizeY;
var cells = 0;

var commands = [];
var commandNumber = 0;
var commandExists = false;

// colors

const initialBackColor = "black";
const initialForeColor = "white";

var backColor = initialBackColor;
var foreColor = initialForeColor;

// font

const initialFontSize = 14;
var fontSize = initialFontSize;

//

var initialSpeed = 1;
var speed = initialSpeed;
var scrollY = 0;

var selectedCell = 0;

var data = null;
let dataView = null;

// initialization

(function init() {

	// adding event listeners
	document.body.addEventListener("keydown", keyDown);
	window.addEventListener("wheel", wheel);
	window.addEventListener("resize", e => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight - cellSizeY;
		dumpFile(data);
	});

	// canvas size
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight - cellSizeY;

	// getting settings from local storage
	if (localStorage) {

		let commandsStorage;
		let foreColorStorage, backColorStorage;

		commandsStorage = localStorage.getItem("commands");

		foreColorStorage = localStorage.getItem("fore-color");
		backColorStorage = localStorage.getItem("back-color");

		if (commandsStorage && foreColorStorage && backColorStorage) {

			try {
				commands = JSON.parse(commandsStorage);
			}
			catch {
				console.error("What did you put into localStorage commands item?");
			}

			changeColors({
				back: backColorStorage,
				fore: foreColorStorage
			});
		}
	}

	// fetching help text
	let xhr = new XMLHttpRequest();
	xhr.open("GET", "help.txt");
	xhr.responseType = "arraybuffer";
	xhr.onload = () => {
		helpText = xhr.response;
	};
	xhr.send();
	delete xhr;

	// refreshing canvas
	drawData(data);

})();

// event handlers

function keyDown(e) {

	if (e.target == terminal) {

		// enter
		if (e.keyCode == 13) {

			const cmd = e.target.value;

			switch (cmd) {
				case "help": {
					data = helpText;
					dataView = new DataView(data);
					dumpFile(helpText);

					commandExists = true;
					break;
				}

				case "open": {
					browse.addEventListener("change", e => {

						const fr = new FileReader();

						fr.onload = () => {
							data = fr.result;
							dataView = new DataView(data);
							dumpFile(fr.result);
						}

						fr.readAsArrayBuffer(browse.files[0]);
					});

					browse.click();

					commandExists = true;
					break;
				}

				case "back-color": {
					color.onchange = () => {
						changeColors({ back: color.value });
					}

					color.click();

					commandExists = true;
					break;
				}

				case "fore-color": {
					color.onchange = () => {
						changeColors({ fore: color.value });
					}
					color.click();

					commandExists = true;
					break;
				}

				case "reset-back-color": {
					changeColors({ back: initialBackColor });

					commandExists = true;
					break;
				}

				case "reset-fore-color": {
					changeColors({ fore: initialForeColor });

					commandExists = true;
					break;
				}

				case "reset-colors": {
					changeColors({
						back: initialBackColor,
						fore: initialForeColor
					});

					commandExists = true;
					break;
				}

				case "cls":
				case "clear": {
					data = null;
					scrollY = 0;
					drawData(data);

					commandExists = true;
					break;
				}

				case "reset": {
					scrollY = 0;
					selectCell(0);

					commandExists = true;
					break;
				}

				case "reset-scale": {
					initialScale();

					commandExists = true;
					break;
				}

				case "bottom": {
					scrollY = Math.floor(data.byteLength / 16);
					selectCell(data.byteLength - 1);

					commandExists = true;
					break;
				}
			}

			if (commandExists) {
				command(cmd);
				commandExists = false;
			}
		}

		// up
		if (e.keyCode == 38) {
			if (commandNumber > 0) {
				commandNumber--;
				terminal.value = commands[commandNumber];
			}
		}

		// down
		if (e.keyCode == 40) {
			if (commandNumber < commands.length - 1) {
				commandNumber++;
				terminal.value = commands[commandNumber];
			}
		}

		// esc
		if (e.keyCode == 27) {
			terminal.value = "";
			if (commands.length == 1) {
				commandNumber = commands.length;
			}
		}
	}

	if (e.target == document.body) {
		if (data) {

			if (e.shiftKey) {
				speed = 4;
			} else {
				speed = initialSpeed;
			}

			// up
			if (e.keyCode == 38) {
				let nextCell = selectedCell - 16 * speed;

				selectCell(nextCell >= 0 ? nextCell : selectedCell % 16);

				drawData(data);
			}

			// down
			if (e.keyCode == 40) {
				let nextCell = selectedCell + 16 * speed;

				selectCell(nextCell < data.byteLength ? nextCell : data.byteLength - (data.byteLength % 16 - selectedCell % 16));

				drawData(data);
			}

			// left
			if (e.keyCode == 37) {
				selectCell(selectedCell - speed);
				drawData(data);
			}

			// right
			if (e.keyCode == 39) {
				selectCell(selectedCell + speed);

				drawData(data);
			}
		}

		// +
		if (e.keyCode == 107) {
			scaleFont();

			drawData(data);
			return;
		}

		// -
		if (e.keyCode == 109) {
			if (cellSizeX > 16) {
				unscaleFont();
			}
			drawData(data);
			return;
		}

		// home
		if (e.keyCode == 36) {
			initialScale();
		}
	}
}

function wheel(e) {

	if (data) {
		if (e.wheelDeltaY > 0) {
			if (scrollY > 0) {
				scrollY--;
			}
		} else {
			if (scrollY < (data.byteLength - 1) / 16) {
				scrollY++;
			}
		}

		drawData(data);
	}
}

// ui functions

function selectCell(index) {
	selectedCell = Math.max(0, Math.min(index, data.byteLength - 1));
	//scrollY = Math.floor(selectedCell / 16);

	let cellsInARow = Math.floor((canvas.height - cellSizeY) / cellSizeY);
	scrollY = Math.floor(selectedCell / (16 * cellsInARow)) * cellsInARow;

	drawData(data);
}

function drawData(data) {
	// background
	context.fillStyle = backColor;
	context.fillRect(0, 0, canvas.width, canvas.height);

	let color = new w3color(backColor);
	color.darker(5);

	context.fillStyle = color.toRgbaString();

	// column header
	context.fillRect(rowNumWidth, 0, canvas.width - rowNumWidth, cellSizeY);

	// row side bar
	context.fillRect(0, cellSizeY, rowNumWidth, canvas.height);

	//

	context.fillStyle = foreColor;
	context.font = `${fontSize}px Arial`;

	// selected cell number

	let char = selectedCell.toString(16);

	context.textAlign = "right";
	context.textBaseline = "middle";

	context.fillText(char, rowNumWidth - 16, cellSizeY / 2);

	// column number
	for (let x = 0; x < 16; x++) {
		let char = x.toString(16);

		context.textAlign = "center";
		context.textBaseline = "middle";

		context.fillText(char, rowNumWidth + (x * cellSizeX) + cellSizeX / 2, cellSizeY / 2);
	}

	// row number
	for (let y = 0; y <= Math.floor((canvas.height - cellSizeY) / cellSizeY); y++) {

		let char = ((y + scrollY) * 16).toString(16);

		context.textAlign = "right";
		context.textBaseline = "middle";

		context.fillText(char, rowNumWidth - 16, cellSizeY + (y * cellSizeY) + cellSizeY / 2);
	}

	// ascii column

	context.textAlign = "center";
	context.textBaseline = "middle";

	for (let i = 0; i < asciiText.length; i++) {
		let char = asciiText[i];
		context.fillText(char, (rowNumWidth + cellSizeX * 17) + (i * cellSizeX) + (cellSizeX / 2), cellSizeY / 2);
	}

	// data

	if (data && dataView) {
		cells = (scrollY * 16);

		context.textAlign = "center";
		context.textBaseline = "middle";

		for (let y = 0; y <= Math.floor((canvas.height - cellSizeY) / cellSizeY); y++) {

			for (let x = 0; x < 16; x++) {

				if (cells < data.byteLength) {
					context.fillStyle = foreColor;

					let char = dataView.getUint8(cells).toString(16);
					let char2 = String.fromCharCode(dataView.getUint8(cells));

					// highlight cell
					if (selectedCell == cells) {
						context.fillStyle = foreColor;

						// hex
						context.fillRect(rowNumWidth + x * cellSizeX, cellSizeY + y * cellSizeY, cellSizeX, cellSizeY);

						// ascii
						context.fillRect((rowNumWidth + cellSizeX * 17) + x * cellSizeX, cellSizeY + y * cellSizeY, cellSizeX, cellSizeY);

						context.fillStyle = backColor;
					}

					// hex

					context.fillText(char, rowNumWidth + (x * cellSizeX) + cellSizeX / 2, cellSizeY + (y * cellSizeY) + cellSizeY / 2);

					// ascii

					context.fillText(char2, (rowNumWidth + cellSizeX * 17) + (x * cellSizeX) + cellSizeX / 2, cellSizeY + (y * cellSizeY) + cellSizeY / 2);

					cells++;
				}

			}
		}

		cells = 0;
	}
}

function dumpFile(data) {
	drawData(data);
}

// includes command into history

function command(commandStr) {
	if (!commands.includes(commandStr)) {
		commands.push(commandStr);
	}
	commandNumber = commands.length;
	terminal.value = "";

	localStorage.setItem("commands", JSON.stringify(commands));
}

function changeColors(colors) {
	let color = new w3color(backColor);
	color.darker(10);

	backColor = colors.back ? colors.back : backColor;
	foreColor = colors.fore ? colors.fore : foreColor;
	enterSymbol.style.color = foreColor;
	terminal.style.color = foreColor;

	document.body.style.backgroundColor = color.toRgbaString();
	const meta = document.querySelector('meta[name=theme-color');
	meta.setAttribute('content', color.toRgbaString());

	drawData(data);

	localStorage.setItem("back-color", backColor);
	localStorage.setItem("fore-color", foreColor);
}

function scaleFont() {
	cellSizeX++;
	cellSizeY++;
	rowNumWidth++;

	fontSize += 0.5;
}

function unscaleFont() {
	cellSizeX--;
	cellSizeY--;
	rowNumWidth--;

	fontSize -= 0.5;
}

function initialScale() {
	cellSizeX = cellInitialSizeX;
	cellSizeY = cellInitialSizeY;
	rowNumWidth = rowInitialWidth;
	fontSize = initialFontSize;
	drawData(data);
}

let deferredPrompt = null;

function installProgressiveWebApp() {
	if ('serviceWorker' in navigator) {

		window.addEventListener('load', e => {
			navigator.serviceWorker.register('/hexdump/sw.js')
			.then(registration => {
				console.log('ServiceWorker registered successfully');
			})
			.catch(err => {
				console.dir(err);
			});
		});

		window.addEventListener('beforeinstallprompt', e => {
			e.preventDefault();
			deferredPrompt = e;

			deferredPrompt.prompt()
			.catch(err => {
				console.dir(err);
			});

			deferredPrompt.userChoice
			.then(result => {
				if (result.outcome === "accepted") {
					alert("HexDump added to home screen");
				} else {
					alert("HexDump isn't added to home screen 😪");
				}

				deferredPrompt = null;
			});
		});
	}
}

installProgressiveWebApp();