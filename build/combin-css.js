var readline = require('readline'),
	stylus = require('stylus'),
	path = require('path'),
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

rl.question("input the css path: ", function(answer) {
	process(answer);

	rl.close();
});

function process(filePath) {
	var str = fs.readFileSync(filePath, 'utf-8');

	stylus(str)
		.set('filename', filePath)
		.define('url', stylus.url())
		.render(function(err, css) {
			if (err) {
				throw err;
			}

			fs.writeFileSync(css, filePath);
		});
}