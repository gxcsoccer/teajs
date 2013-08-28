module.exports = function(grunt) {
    var style = require('grunt-cmd-transport').style;
    style.init(grunt);

    // 项目配置信息.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['./src/*.js', './src/**/*.js'],
            options: {
                curly: true,
                eqeqeq: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true
                }
            }
        },
        clean: ["dist"],
        transport: {
            options: {
                'paths': ['./', './src', './src/customize', './src/customize/widget'],
                'alias': {
                    'juicer': 'lib/juicer'
                },
                debug: false
            },
            all: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'dist/'
                }]
            }
        },
        concat: {
            all: {
                options: {
                    // Task-specific options go here.
                    'paths': ['./', './src', './src/customize', './src/customize/widget', './dist', './lib'],
                    'include': 'all',
                    'noncmd': false,
                    'css2js': style.css2js
                },
                files: {
                    'build/<%= pkg.name %>.js': ['./dist/customize/app.js']
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                sourceMap: 'build/<%= pkg.name %>.map'
            },
            build: {
                src: 'build/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        }
    });

    // 加载"uglify"插件..
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-cmd-concat');

    // 注册默认任务.
    grunt.registerTask('default', ['clean', 'transport', 'concat', 'uglify']);
};