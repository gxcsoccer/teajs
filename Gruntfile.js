module.exports = function(grunt) {
    
    // 项目配置信息.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        }
    });

    // 加载"uglify"插件..
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // 注册默认任务.
    grunt.registerTask('default', ['uglify']);
};