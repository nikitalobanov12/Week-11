const yauzl = require('yauzl-promise');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const PNG = require('pngjs').PNG;
const path = require('node:path');
const { pipeline } = require('stream/promises');
const { EOL } = require('node:os');

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
		//fsp = fs/promises
		//reads each file in the folder, then joins the filename string with the directory string to get the full path to the file
		return (await fsp.readdir(dir)).map(file => path.join(dir, file));
	} catch (err) {
		console.log('error in readDir');
		throw err;
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
const grayScale = (pathIn, pathOut) => {
	//everything in this function is from pngjs docs, just changed filter logic
	fs.createReadStream(pathIn)
		.pipe(
			new PNG({
				filterType: 4,
			})
		)
		.on('parsed', function () {
			for (let y = 0; y < this.height; y++) {
				for (let x = 0; x < this.width; x++) {
					const idx = (this.width * y + x) << 2; 
					// gray = (red + green + blue)/3
					const red = this.data[idx];
					const green = this.data[idx + 1];
					const blue = this.data[idx + 2];
					const gray = Math.round((red + green + blue) / 3);
					this.data[idx] = gray;
					this.data[idx + 1] = gray;
					this.data[idx + 2] = gray;
				}
			}
			this.pack().pipe(fs.createWriteStream(pathOut));
		});
};

module.exports = {
	unzip,
	readDir,
	grayScale,
};
