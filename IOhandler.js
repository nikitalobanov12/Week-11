const yauzl = require('yauzl-promise');
const fs = require('node:fs/promises');
const PNG = require('pngjs').PNG;
const path = require('path');
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
		await fs.promises.mkdir(pathOut, { recursive: true });	

		for await (const entry of zip) {
			const fileName = path.basename(entry.filename);
			const outputPath = path.join(pathOut, fileName);
			const readStream = await entry.openReadStream();
			const writeStream = fs.createWriteStream(outputPath);
			await pipeline(readStream, writeStream);
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
const readDir = dir => {};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const grayScale = (pathIn, pathOut) => {};

unzip("./myfile.zip", './unzipped');



module.exports = {
	unzip,
	readDir,
	grayScale,
};
