module.exports = function(grunt) {

    grunt.initConfig({
        copy: {
                img: {
                        files: [
                                {
                                    expand: true,
                                    flatten: true,
                                    src: 'img/*',
                                    dest: 'dist/img/'
                                }
                        ]
                },
                fonts: {
                        files: [
                                {
                                    expand: true,
                                    flatten: true,
                                    src: ['fonts/*', 'node_modules/font-awesome/fonts/*'],
                                    dest: 'dist/fonts/'
                                },
                        ]
                },
                css: {
                        files: [
                                {
                                    expand: true,
                                    flatten: true,
                                    src: 'node_modules/spectrum-colorpicker/spectrum.css',
                                    dest: 'dist/css/'
                                }
                        ]
                },
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'js/*.js',
            ]
        },
        uglify: {
            dist: {
                files: {
                    'dist/js/app.min.js': [
                        'node_modules/jquery/dist/jquery.js',
                        'node_modules/popper.js/dist/umd/popper.js',
                        'node_modules/bootstrap/dist/js/bootstrap.js',
                        'node_modules/jquery-ui/ui/widget.js',
                        'node_modules/jquery-ui/ui/widgets/mouse.js',
                        'node_modules/jquery-ui/ui/data.js',
                        'node_modules/jquery-ui/ui/plugin.js',
                        'node_modules/jquery-ui/ui/safe-active-element.js',
                        'node_modules/jquery-ui/ui/safe-blur.js',
                        'node_modules/jquery-ui/ui/scroll-parent.js',
                        'node_modules/jquery-ui/ui/version.js',
                        'node_modules/jquery-ui/ui/widgets/draggable.js',
                        'node_modules/spectrum-colorpicker/spectrum.js',
                        'node_modules/jquery.panzoom/dist/jquery.panzoom.js',
                        'js/jquery.draggable-polygon.js',
                        'js/jquery.kpc-backend.js',
                        'js/custom.js'
                    ]
                },
                options: {
                    // sourceMap: 'js/app.min.js.map',
                    // sourceMappingURL: '/js/main.min.js.map'
                    // FIXME: For testing, remove after
                    compress: {
                        drop_debugger: false
                    }
                }
            }
        },
        sass: {
            dist: {
                options: {
                    style: 'compressed',
                    loadPath: [
                            'node_modules/bootstrap/scss',
                            'node_modules/font-awesome/scss',
                            'node_modules/spectrum-colorpicker',
                    ]
                },
                files: {
                    "dist/css/app.min.css": "scss/app.scss",
                }
            }
        },
        watch: {
            html: {
                files: ['templates/*.html', 'templates/*/*.html'],
                tasks: ['includereplace'],
            },
            sass: {
                files: ['scss/**/*.scss'],
                tasks: ['sass'],
                options: {
                    nospawn: true
                }
            },
            js: {
                files: [
                    '<%= jshint.all %>'
                ],
                tasks: ['jshint', 'uglify']
            },
        },
        clean: {
            dist: [
                'dist',
            ]
        },
        includereplace: {
            templates: {
                options: {
                },
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: 'templates/*.html',
                        dest: 'dist/'
                    }
                ]
            }
          }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-include-replace');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'clean',
        'copy',
        'sass',
        'uglify',
        'includereplace',
        'watch'
    ]);
};