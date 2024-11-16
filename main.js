const path = require('path');

const { unzip, readDir, grayScale } = require('./IOhandler');
async function main() {
	await unzip('./myfile.zip', './unzipped');
	const directories = await readDir('./unzipped');
	console.log(directories)
	// directories is an array of filepaths, need to extract the names of each file to call the grayScale function with.
	for (const filePath of directories) {
		const fileName = path.basename(filePath);
		//for pathOut, you need to add the file name to the end so you can create the image with that file name
		const pathOut = path.join('./grayscaled', fileName);
		grayScale(filePath, pathOut);
		console.log(
			`grayscale conversion complete for ${fileName} at ${pathOut}`
		);
	}
}
main();