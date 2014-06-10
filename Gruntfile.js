'use strict';

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({

        pkg: grunt.file.readJSON("bower.json"),

        paths : {
            bower : "bower_components"
        },

        bower_dir : "bower_components",
        build_dir : "build",
        dist_dir  : "dist",
        test_dir  : "test",

        files : {
            core : [
                "src/__module__.js",
                "src/**/*.js"
            ],
            test : {
                unit : "test/unit/**/*.js"
            }
        },

        libs: {
            js: [
                "<%= paths.bower %>/underscore/underscore.js",
                "<%= paths.bower %>/jquery/dist/jquery.js",
                "<%= paths.bower %>/jquery-ui/ui/jquery.ui.core.js",
                "<%= paths.bower %>/jquery-ui/ui/jquery.ui.widget.js",
                "<%= paths.bower %>/jquery-ui/ui/jquery.ui.mouse.js",
                "<%= paths.bower %>/jquery-ui/ui/jquery.ui.position.js",
                "<%= paths.bower %>/jquery-ui/ui/jquery.ui.draggable.js",
                "<%= paths.bower %>/jquery-mousewheel/jquery.mousewheel.js",
                "<%= paths.bower %>/angular/angular.js"
            ]

        },

        styles: {
            tael: {
                concat_file: "<%= paths.build %>/tael/tael-app.css",
                min_file: "<%= paths.build %>/tael/tael-app.min.css",
                paths: [
                    "<%= paths.app %>/common/styles/base/reset.less",
                    "<%= paths.app %>/common/styles/**/*.less",
                    "<%= paths.app %>/common/styles/**/*.css"
                ]
            }
        },

        assets: {
            public: {
                images: {
                    path: "<%= paths.app %>/public/images"
                }
            }
        },

        // here comes the modules configuration

        concat: {

            options: {
                stripBanners: true,
                separator: '\n'
            },

            app: {
                options: {
                    banner: "'use strict';\n"
                },
                files: {
                    '<%= build_dir %>/infiniTable.js': ["<%= files.core %>"]
                }
            },

            libs : {
                files: {
                    '<%= build_dir %>/libs.js': ["<%= libs.js %>"]
                }
            }

        },

        ngmin: {
            app: {
                files: {
                    "<%= scripts.common.annot_file %>": "<%= scripts.common.concat_file %>",
                    "<%= scripts.tael.annot_file %>": "<%= scripts.tael.concat_file %>",
                    "<%= scripts.intra.annot_file %>": "<%= scripts.intra.concat_file %>"
                }
            }
        },

        less: {
            app: {
                files: {
                    "<%= styles.public.concat_file %>": ["<%= styles.public.paths %>"],
                    "<%= styles.tael.concat_file %>": ["<%= styles.tael.paths %>"],
                    "<%= styles.intra.concat_file %>": ["<%= styles.intra.paths %>"]
                }
            }
        },

        uglify: {
            app: {
                files: {
                    '<%= scripts.public.min_file %>': '<%= scripts.public.pkg_file %>',
                    '<%= scripts.tael.min_file %>': '<%= scripts.tael.pkg_file %>',
                    '<%= scripts.intra.min_file %>': '<%= scripts.intra.pkg_file %>'
                }
            },
            libs: {
                files: {
                    '<%= libs.js.min_file %>': '<%= libs.js.concat_file %>',
                    '<%= libs.js_public.min_file %>': '<%= libs.js_public.concat_file %>'
                }
            }
        },

        cssmin: {
            tael: {
                files: {
                    '<%= styles.tael.min_file %>': ['<%= styles.tael.concat_file %>']
                }
            }
        },

        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: ['<%= dist_dir %>/*']
                    }
                ]
            }
        },

        copy: {
            images: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= assets.public.images.path %>',
                        dest: '<%= paths.build %>/public/images',
                        src: [ '**/*.*']
                    }
                ]

            },
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= paths.build %>',
                        dest: '<%= paths.dist %>',
                        src: [
                            'public/images/**/*.*',
                            'images/**/*.*',
                            'fonts/**/*.*',
                            '**/*.min.js',
                            '**/*.min.css'
                        ]
                    }
                ]
            }
        },


        watch: {
            options: {
                interrupt: true
            },

            templates: {
                files: ['<%= paths.app %>/**/*.html'],
                tasks: ['process-html']
            },

            scripts: {
                files: ['<%= paths.app %>/**/*.js', '!<%= paths.app %>/_/**/*.js'],
                tasks: ['process-js']
            },

            styles: {
                files: ['<%= paths.app %>/**/*.css', '<%= paths.app %>/**/*.less'],
                tasks: ['process-css']
            }

        },

        karma: {
            unit: {
                basePath: '',
                frameworks: ['jasmine'],
                options: {
                    files: [
                        '<%= build_dir %>/libs.js',
                        "<%= bower_dir %>/angular-mocks/angular-mocks.js",
                        "<%= test_dir %>/matchers/**/*.js",
                        "<%= build_dir %>/infiniTable.js",
                        '<%= files.test.unit %>'
                    ],
                    exclude: []
                },
                port: 8081,
                logLevel: "INFO",
                autoWatch: false,
                browsers: ['PhantomJS'],
                singleRun: true
            }
        }

    });

    /*
    grunt.registerTask('process-js', [
        'concat:app'
    ]);

    grunt.registerTask('process-css', [
        'less:app'
    ]);

    grunt.registerTask('process-assets', [
        'copy:images'
    ]);

    grunt.registerTask("process-html", [
        'template:dev',
        'copy:templates'
    ]);

    grunt.registerTask("process-fonts", [
        'copy:fonts'
    ]);

    grunt.registerTask('process-libs', [
        'concat:libs'
    ]);

    grunt.registerTask("process-all", [
        "process-html",
        "process-fonts",
        "process-libs",
        "process-js",
        "process-css",
        "process-assets",
        "copy:libs-img"
    ]);

    grunt.registerTask('run-test', [
        "ngtemplates",
        'connect:test',
        'karma'
    ]);

    grunt.registerTask("build-dev", [
        'process-all'
    ]);

    grunt.registerTask("build-dist", [
        "ngtemplates",
        "ngmin", //"ngAnnotate",
        "concat:pkg",
        'uglify',
        'cssmin',
        "template:dist",
        "copy:dist",
        "compress:dist"
    ]);
    */

    // top level tasks

    /*
    grunt.registerTask('test', [
        'clean:build',
        'build-dev',
        'run-test'
    ]);
    */

    grunt.registerTask("package", [
        'clean',
        'concat:app',
        'concat:libs',
        "karma:unit"
        //'run-test',
        //'build-dist'
    ]);

    grunt.registerTask('default', ["package"]);

};
