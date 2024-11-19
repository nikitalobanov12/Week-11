const path = require('path');
const readline = require('readline/promises');
const { unzip, readDir, filter } = require('./IOhandler');
async function main() {
	await unzip('./myfile.zip', './unzipped');
	const directories = await readDir('./unzipped');
	// console.log(directories)
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	try {
		// directories is an array of filepaths, need to extract the names of each file to call the grayScale function with.
		for (const filePath of directories) {
			const userInput = await rl.question(
				'Which filter would you like to apply? \n1: grayscale \n2: sepia \n3: solarize \n4: invert \n5: hue shift \n'
			);

			const normalizedInput = userInput
				.toLowerCase()
				.trim()
				.replace(/\s+/g, '');
			//create an object to assign the users input to a function
			const filterObject = {
				1: 'grayscale',
				2: 'sepia',
				3: 'solarize',
				4: 'invert',
				5: 'hueshift',
				grayscale: 'grayscale',
				sepia: 'sepia',
				solarize: 'solarize',
				invert: 'invert',
				hueshift: 'hueshift',
			};
			const filterType = filterObject[normalizedInput];
			if (!filterType) throw new Error('invalid input');

			const fileName = path.parse(path.basename(filePath)).name;
			const fullFileName = `${fileName}-${filterType}.png`;
			const pathOut = path.join('./output', fullFileName);

			await filter(filePath, pathOut, filterType);
			console.log(
				`Filter applied: ${filterType} for file ${fullFileName} at ${pathOut}`
			);
		}
	} finally {
		rl.close();
	}
}
main();
