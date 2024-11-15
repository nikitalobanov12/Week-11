const path = require('path');

// const IOhandler = require('./IOhandler');
// const zipFilePath = path.join(__dirname, 'myfile.zip');
// const pathUnzipped = path.join(__dirname, 'unzipped');
// const pathProcessed = path.join(__dirname, 'grayscaled');

const { unzip, readDir, grayScale } = require('./IOhandler');
async function main() {
	await unzip('./myfile.zip', './unzipped');
	const directories = await readDir('./unzipped');
	// directories is an array of filepaths, need to extract the names of each file to call the grayScale function with.
	for (const filePath of directories) {
		const fileName = path.basename(filePath);
		//for pathOut need to add the file name to the end so you can create the image with that file name
		const pathOut = path.join('./grayscaled', fileName);
		grayScale(filePath, pathOut);
		console.log(
			`grayscale conversion complete for ${fileName} at ${pathOut}`
		);
	}
}
main();
