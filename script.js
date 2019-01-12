const terminal = document.querySelector("#terminal");
const browse = document.querySelector("#browse");
const color = document.querySelector("#color");

const stdout = document.querySelector("#stdout");

var canvas = document.querySelector("#canvas");
var context = canvas.getContext("2d");

var rowNumWidth = 64;

const cellInitialSizeX = 32;
const cellInitialSizeY = 32;

var cellSizeX = cellInitialSizeX;
var cellSizeY = cellInitialSizeY;
var cells = 0;

const commands = [];
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

//

createCanvas();

document.body.addEventListener("keydown", function(e) {

	if (e.target == terminal) {
		// enter
		if (e.keyCode == 13) {
			if (e.target.value == "open") {
				browse.addEventListener("change", function(e) {
				const fr = new FileReader();
				fr.onload = function() {
					data = fr.result;
					dumpFile(fr.result);
				}
				fr.readAsArrayBuffer(browse.files[0]);
			});
			browse.click();

			command(e.target.value);
		}

		if (e.target.value == "back-color") {
			color.onchange = function() {
				backColor = color.value;
				drawData(data);
			}
			color.click();

			command(e.target.value);
		}

		if (e.target.value == "fore-color") {
			color.onchange = function() {
				foreColor = color.value;
				drawData(data);
			}
			color.click();

			command(e.target.value);
		}

		if (e.target.value == "cls" || (e.target.value == "clear")) {
			data = null;
			scrollY = 0;
			drawData(data);
			command(e.target.value);
		}

		if (e.target.value == "reset") {
			scrollY = 0;
			drawData(data);
			command(e.target.value);
		}

		if (e.target.value == "reset-scale") {
			cellSizeX = cellInitialSizeX;
			cellSizeY = cellInitialSizeY;
			fontSize = initialFontSize;
			drawData(data);
			command(e.target.value);
		}
	}

	// up
	if (e.keyCode == 38) {
		if (commandNumber > 0) {
			commandNumber--;
			terminal.value = commands[commandNumber];
			console.log(commands, commandNumber);
			
		}
	}

	// down
	if (e.keyCode == 40) {
		if (commandNumber < commands.length-1) {
			commandNumber++;
			terminal.value = commands[commandNumber];
			console.log(commands, commandNumber);
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
				speed = 5;
			} else {
				speed = initialSpeed;
			}

			// up
			if (e.keyCode == 38) {

				// if (scrollY > 0) {
					
				// 	scrollY -= speed;
				// 	scrollY = Math.max(0, scrollY);
				// }

				if (selectedCell >= 16 * speed) {
					selectedCell -= 16 * speed;
				}

				drawData(data);
			}

			// down
			if (e.keyCode == 40) {
				// if (scrollY < (data.byteLength - 1) / 16) {
				// 	scrollY += speed;
				// }

				selectedCell += 16 * speed;

				drawData(data);
			}

			// left
			if (e.keyCode == 37) {
				selectedCell = Math.max(0, selectedCell - speed);

				drawData(data);
			}

			// right
			if (e.keyCode == 39) {
				selectedCell += speed;

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
			fontSize = initialFontSize;
			drawData(data, scrollY);
		}
	}
});

window.addEventListener("wheel", function(e) {
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
});



function createCanvas() {
	canvas.width = screen.width;
	canvas.height = screen.height - 48;

	drawData(data);
}

function drawData(data) {
	// background
	context.fillStyle = backColor;//`rgba(0, 0, 0, 0.1)`;
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#292929";

	// column header
	context.fillRect(rowNumWidth, 0, canvas.width, cellSizeY);

	// row side bar
	context.fillRect(0, cellSizeY, rowNumWidth, canvas.height);

	//

	context.fillStyle = foreColor;
	context.font = `${fontSize}px Arial`;

	// selected cell number

	let char = selectedCell.toString(16);
	let sizeX = context.measureText(char).width;
	let sizeY = context.measureText(char[0]).width;

	context.fillText(char, rowNumWidth - sizeX - 16, cellSizeY/2 + sizeY/2);

	// column number
	for (let x = 0; x < 16; x++) {
		let char = x.toString(16);
		let sizeX = context.measureText(char).width;
		let sizeY = context.measureText(char[0]).width;
		
		context.fillText(char, rowNumWidth + (x * cellSizeX) + (cellSizeX/2 - sizeX/2), cellSizeY/2 + sizeY/2);
	}

	// row number
	for (let y = 0; y < (canvas.height - cellSizeY) / cellSizeY; y++) {

		let char = ((y + scrollY) * 16).toString(16);

		let sizeX = context.measureText(char).width;
		let sizeY = context.measureText(char[0]).width;
		
		context.fillText(char, rowNumWidth - sizeX - 16, cellSizeY + (y * cellSizeY) + (cellSizeY/2 + sizeY/2));
	}

	if (data) {
		const dataView = new DataView(data);

		cells = (scrollY * 16);

		for (let y = 0; y < (canvas.height - cellSizeY) / cellSizeY; y++) {
			
			for (let x = 0; x < 16; x++) {

				if (cells < data.byteLength) {
					context.fillStyle = foreColor;

					let char = dataView.getUint8(cells).toString(16);
					let char2 = String.fromCharCode(dataView.getUint8(cells));
					
					let sizeX = context.measureText(char).width;
					let sizeY = context.measureText(char[0]).width;

					let size = context.measureText(char2).width;
					
					// highlight cell
					if (selectedCell == cells) {
						context.fillStyle = foreColor;

						// hex
						context.fillRect(rowNumWidth + x * cellSizeX, cellSizeY + y * cellSizeY, cellSizeX, cellSizeY);

						// ascii
						context.fillRect((rowNumWidth + cellSizeX * 17) + x * cellSizeX, cellSizeY + y * cellSizeY, cellSizeX, cellSizeY);

						context.fillStyle = backColor;
					}

					context.fillText(char, (rowNumWidth) + (x * cellSizeX) + (cellSizeX/2 - sizeX/2), cellSizeY + (y * cellSizeY) + (cellSizeY/2 + sizeY/2));

					// text
					context.fillText(char2, (rowNumWidth +  cellSizeX * 17) + (x * cellSizeX) + (cellSizeX/2 - size/2), cellSizeY + (y * cellSizeY) + (cellSizeY/2 + size/2));

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
}

function scaleFont() {
	cellSizeX ++;
	cellSizeY ++;

	fontSize += 0.5;
}

function unscaleFont() {
	cellSizeX --;
	cellSizeY --;

	fontSize -= 0.5;
}