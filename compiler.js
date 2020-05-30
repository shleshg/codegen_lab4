const fs = require('fs');
const parser = require('./src/parser');
const build = require('./src/build');

const usage = 'usage: node compiler.js <flag> <path> \n\nflag: -ssa (optional)\npath: path to file';

const args = process.argv;

if (args.length < 3) {
	console.log(usage);
} else {
	if (args[2] === '-ssa') {
		if (args.length < 4) {
			console.log(usage);
		} else {
			const text = fs.readFileSync(args[3]);
			const parsedText = parser.parse(text.toString());
			const cfg = build(parsedText);
			cfg.toSSA();
			console.log(cfg.toDot());
		}
	} else {
		const text = fs.readFileSync(args[2]);
		const parsedText = parser.parse(text.toString());
		const cfg = build(parsedText);
		console.log(cfg.toDot());
	}
}
