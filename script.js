// getting elements
const terminal = document.querySelector("#terminal");
const browse = document.querySelector("#browse");
const color = document.querySelector("#color");

const stdout = document.querySelector("#stdout");

var canvas = document.querySelector("#canvas");
var context = canvas.getContext("2d");

// settings
var helpText = null;

const cellInitialSizeX = 32;
const cellInitialSizeY = 32;
const rowInitialWidth = 64;

var rowNumWidth = rowInitialWidth;

var cellSizeX = cellInitialSizeX;
var cellSizeY = cellInitialSizeY;
var cells = 0;

var commands = [];
var commandNumber = 0;

var foreColor = "white";
var backColor = "black";

const initialFontSize = 14;
var fontSize = initialFontSize;

var initialSpeed = 1;
var speed = initialSpeed;
var scrollY = 0;

var selectedCell = 0;

var data = null;

// initialization

(function init() {

	// adding event listeners
	document.body.addEventListener("keydown", keyDown);
	window.addEventListener("wheel", wheel);

	// canvas size
	canvas.width = screen.width;
	canvas.height = screen.height - 48;

	// getting settings from local storage
	if (localStorage) {

		let commandsStorage;
		let foreColorStorage, backColorStorage; 

		commandsStorage = localStorage.getItem("commands");

		foreColorStorage = localStorage.getItem("fore-color");
		backColorStorage = localStorage.getItem("back-color");

		if (commandsStorage && foreColorStorage && backColorStorage) {

			commands = JSON.parse(commandsStorage);

			foreColor = foreColorStorage;
			backColor = backColorStorage;

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

			if (cmd == "help") {

				data = helpText;
				dumpFile(helpText);

				command(cmd);
			}

			if (cmd == "open") {

				browse.addEventListener("change", e => {

					const fr = new FileReader();

					fr.onload = () => {
						data = fr.result;
						dumpFile(fr.result);
					}

					fr.readAsArrayBuffer(browse.files[0]);
				});

				browse.click();

				command(cmd);
			}

			if (cmd == "back-color") {
				color.onchange = function () {
					backColor = color.value;
					drawData(data);

					localStorage.setItem("back-color", backColor);
				}

				color.click();

				command(cmd);
			}

			if (cmd == "fore-color") {
				color.onchange = function () {
					foreColor = color.value;
					drawData(data);

					localStorage.setItem("fore-color", foreColor);
				}
				color.click();

				command(cmd);
			}

			if (cmd == "reset-back-color") {
				backColor = "black";

				localStorage.setItem("back-color", backColor);

				drawData(data);

				command(cmd);
			}

			if (cmd == "reset-fore-color") {
				foreColor = "white";

				localStorage.setItem("fore-color", foreColor);

				drawData(data);

				command(cmd);
			}

			if (cmd == "reset-colors") {
				backColor = "black";
				foreColor = "white";

				localStorage.setItem("back-color", backColor);
				localStorage.setItem("fore-color", foreColor);

				drawData(data);

				command(cmd);
			}

			if (cmd == "cls" || (cmd == "clear")) {
				data = null;
				scrollY = 0;
				drawData(data);
				command(cmd);
			}

			if (cmd == "reset") {
				scrollY = 0;
				drawData(data);
				command(cmd);
			}

			if (cmd == "reset-scale") {
				cellSizeX = cellInitialSizeX;
				cellSizeY = cellInitialSizeY;
				fontSize = initialFontSize;
				drawData(data);
				command(cmd);
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

				if (selectedCell >= 16 * speed) {
					selectCell(selectedCell - 16 * speed);
				}

				drawData(data);
			}

			// down
			if (e.keyCode == 40) {

				selectCell(selectedCell + 16 * speed);

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
			cellSizeX = cellInitialSizeX;
			cellSizeY = cellInitialSizeY;
			rowNumWidth = rowInitialWidth;
			fontSize = initialFontSize;
			drawData(data, scrollY);
		}
	}
}

function wheel(e) {
	e.preventDefault();
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

		drawData(data, scrollY);
	}
}

// ui functions

function selectCell(index) {
	if (index < data.byteLength) {
		selectedCell = Math.max(0, index);
	}
}

function drawData(data) {
	// background
	context.fillStyle = backColor;
	context.fillRect(0, 0, canvas.width, canvas.height);

	let color = new w3color(backColor);
	color.darker(5);

	context.fillStyle = color.toRgbaString();

	color.darker(5);
	document.body.style.backgroundColor = color.toRgbaString();

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
	for (let x = 0; x < 16; x ++) {
		let char = x.toString(16);
		
		context.textAlign = "center";
		context.textBaseline = "middle";

		context.fillText(char, rowNumWidth + (x * cellSizeX) + cellSizeX / 2, cellSizeY / 2);
	}

	// row number
	for (let y = 0; y < (canvas.height - cellSizeY) / cellSizeY; y ++) {

		let char = ((y + scrollY) * 16).toString(16);

		context.textAlign = "right";
		context.textBaseline = "middle";
		
		context.fillText(char, rowNumWidth - 16, cellSizeY + (y * cellSizeY) + cellSizeY / 2);
	}

	if (data) {
		const dataView = new DataView(data);

		cells = (scrollY * 16);

		context.textAlign = "center";
		context.textBaseline = "middle";

		for (let y = 0; y < (canvas.height - cellSizeY) / cellSizeY; y++) {
			
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

					context.fillText(char2, (rowNumWidth +  cellSizeX * 17) + (x * cellSizeX) + cellSizeX / 2, cellSizeY + (y * cellSizeY) + cellSizeY / 2);

					cells++;
				}

			}
		}

		cells = 0;
	}
}

function dumpFile(data) {
	drawData(data, scrollY);
}

function command(commandStr) {
	if (!commands.includes(commandStr)) {
		commands.push(commandStr);
	}
	commandNumber = commands.length;
	terminal.value = "";

	localStorage.setItem("commands", JSON.stringify(commands));
}

function scaleFont() {
	cellSizeX ++;
	cellSizeY ++;
	rowNumWidth ++;

	fontSize += 0.5;
}

function unscaleFont() {
	cellSizeX --;
	cellSizeY --;
	rowNumWidth --;

	fontSize -= 0.5;
}