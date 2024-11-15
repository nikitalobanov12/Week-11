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
		await fs.promises.mkdir(pathOut, { recursive: true });

		for await (const entry of zip) {
			const fileName = path.basename(entry.filename);
			const outputPath = path.join(pathOut, fileName);
			const readStream = await entry.openReadStream();
			const writeStream = fs.createWriteStream(outputPath);
			await pipeline(readStream, writeStream);
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
		const files = await fsp.readdir(dir, { withFileTypes: true });
		const pngFiles = files.map(file => path.join(dir, file.name));
		return pngFiles;
	} catch (err) {
		console.error(`error reading directory ${EOL} ${err}`);
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
	fs.createReadStream(pathIn)
		.pipe(
			new PNG({
				filterType: 4,
			})
		)
		.on('parsed', function () {
			for (let i = 0; i < this.data.length; i += 4) {
				// gray = (red + green + blue)/3
				const red = this.data[i];
				const green = this.data[i + 1];
				const blue = this.data[i + 2];
				const gray = Math.round((red + green + blue) / 3); 
				this.data[i] = gray; 
				this.data[i + 1] = gray; 
				this.data[i + 2] = gray; 
			}

			this.pack().pipe(fs.createWriteStream(pathOut));
		});
};

async function main() {
	await unzip('./myfile.zip', './unzipped');
	const directories = await readDir('./unzipped');
	// directories is an array of filepaths, need to extract the names of each file to call the grayScale function with.
	for (const filePath of directories) {
		const fileName = path.basename(filePath);

		const pathOut = path.join('./grayscaled', fileName);
		grayScale(filePath, pathOut);
		console.log(
			`grayscale conversion complete for ${fileName} at ${pathOut}`
		);
	}
}
main();
// module.exports = {
// 	unzip,
// 	readDir,
// 	grayScale,
// };
