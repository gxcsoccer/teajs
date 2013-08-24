seajs.config({
	'base': './',
	'alias': {
		'juicer': 'lib/juicer'
	},
	'paths': {
		'core': 'src/core',
		'commonui': 'src/commonui',
		'tools': 'src/tools',
		'customize': 'src/customize',
		'widget': 'src/customize/widget'
	},
	'charset': 'utf-8'
});

seajs.use('customize/app');