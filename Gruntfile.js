/* jshint  node:true */

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        browserify: {
            main: {
                files: {
                    'glider.js': './src/index.js'
                },
                options: {
                    browserifyOptions: {
                        debug: true,
                        standalone: 'glider'
                    },
                    transform: ['brfs']
                }
            }
        },
        watch: {
            main: {
                files: ['src/**/*.js', 'src/shaders/*'],
                tasks: ['browserify'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.registerTask('default', ['browserify']);
};
