var stylus = require('stylus'),
	path = require('path'),
	nodes = stylus.nodes,
	str = '.ui-arrow { background: url("../../img/ic_arrow.png") no-repeat; }';

stylus(str)
	.set('filename', __dirname + '../css/common/ui-common.css')
	.set('target', __dirname + '../css/style.css')
	.define('url', function(url) {
		console.log(url.toString());
		var filename = path.basename(url.val);
		console.log(filename);
		return new nodes.Literal('url(\'' + path.join('../css', filename) + '\')');
	})
	.render(function(err, css) {
		console.log(css);
	});