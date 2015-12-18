/* jshint  node:true */

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

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
                files: ['src/**/*.js', 'src/renderer/webgl/shader/*'],
                tasks: ['browserify'],
                options: {
                    spawn: false
                }
            }
        },
        connect: {
            main: {
                options: {
                    port: 2718
                }
            }
        }
    });

    grunt.registerTask('default', ['browserify']);
    grunt.registerTask('devel', ['browserify', 'connect', 'watch']);

};
