const yauzl = require('yauzl-promise');
const fs = require('node:fs');
const PNG = require('pngjs').PNG;
const path = require('node:path');
const { pipeline } = require('stream/promises');

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
const unzip = async (pathIn, pathOut) => {
	const zip = await yauzl.open(pathIn);
	try {
		await fs.promises.mkdir(pathOut, { recursive: true }); //create the folder if it doesn't already exist

		//loop through each file in the zip folder
		for await (const entry of zip) {
			const fileName = path.basename(entry.filename); //get the input file name so you know what to name the output file
			const outputPath = path.join(pathOut, fileName); //combine the file name with the output folder
			const readStream = await entry.openReadStream(); //read each file
			const writeStream = fs.createWriteStream(outputPath); //create a write stream for the output
			await pipeline(readStream, writeStream); //get the data from the read file and create a new file in the unzipped folder
			console.log(
				`Extraction operation complete for ${entry.filename} at path ${outputPath}`
			);
		}
	} finally {
		await zip.close();
	}
};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = async dir => {
	try {
		//reads each file in the folder, then joins the filename string with the directory string to get the full path to the file
		return (await fs.promises.readdir(dir, { withFileTypes: true }))
			.filter(file => file.name.slice(-4) === '.png')
			.map(file => path.join(dir, file.name));
	} catch (err) {
		console.log('error in readDir');
		throw err;
	}
};

const grayScaleFilter = (data, idx) => {
	//gray = (red + green + blue)/3
	const red = data[idx];
	const green = data[idx + 1];
	const blue = data[idx + 2];
	const gray = Math.round((red + green + blue) / 3);
	data[idx] = gray;
	data[idx + 1] = gray;
	data[idx + 2] = gray;
	return null; //don't have to return anything since it's just modifying the file
};

const sepiaFilter = (data, idx) => {
	const red = data[idx];
	const green = data[idx + 1];
	const blue = data[idx + 2];

	//got this formula from stack overflow https://stackoverflow.com/questions/1061093/how-is-a-sepia-tone-created
	data[idx] = Math.min(red * 0.393 + green * 0.769 + blue * 0.189); // red
	data[idx + 1] = Math.min(red * 0.349 + green * 0.686 + blue * 0.168); // green
	data[idx + 2] = Math.min(red * 0.272 + green * 0.534 + blue * 0.131); // blue

	return null;
};

const solarizeFilter = (data, idx) => {
	const threshold = 128;
	const invert = value => (value > threshold ? 255 - value : value); // if the value is greater than the threshhold (128 in this case), invert it

	data[idx] = invert(data[idx]); // red
	data[idx + 1] = invert(data[idx + 1]); // green
	data[idx + 2] = invert(data[idx + 2]); // blue

	return null;
};

const invertFilter = (data, idx) => {
	const invert = value => 255 - value;
	data[idx] = invert(data[idx]); // red
	data[idx + 1] = invert(data[idx + 1]); // green
	data[idx + 2] = invert(data[idx + 2]); // blue

	return null;
};

const hueShift = (data, idx) => {
	const red = data[idx];
	const green = data[idx + 1];
	const blue = data[idx + 2];

	data[idx] = green;
	data[idx + 1] = blue;
	data[idx + 2] = green;

	return null;
};

/* 
helper function that handles looping through each pixel in the png image, it then calls on a function to apply a filter to it 
*/
const filterLogic = (data, width, height, filterType) => {
	let applyFilter;
	console.log(filterType);
	switch (filterType) {
		case 'grayscale':
			applyFilter = grayScaleFilter;
			break;
		case 'sepia':
			applyFilter = sepiaFilter;
			break;
		case 'solarize':
			applyFilter = solarizeFilter;
			break;
		case 'invert':
			applyFilter = invertFilter;
			break;
		case 'hueshift':
			applyFilter = hueShift;
			break;
		default:
			throw new Error('Unsupported filter type');
	}
	//loop through each pixel like how the docs do it
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (width * y + x) << 2;
			applyFilter(data, idx);
		}
	}
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const filter = (pathIn, pathOut, filterType) => {
	//everything in this function is from pngjs docs, just changed filter logic
	fs.createReadStream(pathIn)
		.pipe(
			new PNG({
				filterType: 4,
			})
		)
		.on('parsed', function () {
			filterLogic(this.data, this.width, this.height, filterType);
			this.pack().pipe(fs.createWriteStream(pathOut));
		});
};

module.exports = {
	unzip,
	readDir,
	filter,
};
