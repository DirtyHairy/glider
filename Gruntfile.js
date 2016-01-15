/* jshint  node:true */

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');

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
                    transform: [
                        ['babelify', {
                            presets: ['es2015'],
                            plugins: ['transform-runtime']
                        }],
                        'brfs'
                    ]
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
        },
        uglify: {
            main: {
                files: {
                    'glider.min.js': 'glider.js'
                },
                options: {
                    mangle: true,
                    compress: true
                }
            }
        }
    });

    grunt.registerTask('default', ['browserify', 'uglify']);
    grunt.registerTask('devel', ['browserify', 'connect', 'watch']);

};
