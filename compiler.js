const fs = require('fs');
const parser = require('./src/parser');


const args = process.argv;

if (args.length < 3) {
	console.log('path to file required');
} else {
	const text = fs.readFileSync(args[2]);
	const parsedText = parser.parse(text);
}
