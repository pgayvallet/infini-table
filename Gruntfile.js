'use strict';

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({

        pkg: grunt.file.readJSON("bower.json"),

        bower_dir : "bower_components",
        build_dir : "build",
        dist_dir  : "dist",

        files : {
            core : [
            ],
            test : []

        },

        libs: {
            js: {
                concat_file: "<%= paths.build %>/libs.js",
                min_file: "<%= paths.build %>/libs.min.js",
                paths: [
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


            test: {
                concat_file: "<%= paths.build %>/libs-test.js",
                paths: [
                    "<%= paths.bower %>/angular-mocks/angular-mocks.js",
                    "<%= paths.test %>/matchers/**/*.js"
                ]
            }

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

            libs: {
                files: {
                    "<%= libs.js.concat_file %>": ["<%= libs.js.paths %>"]
                }
            },

            app: {
                options: {
                    banner: "'use strict';\n",
                    process: function (src, filepath) {
                        // removing individual 'use strict' declarations.
                        var processed = src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                        // adding __FILEPATH__ var to each files.
                        var folderPath = filepath.substring("app".length, filepath.lastIndexOf("/"));
                        processed =
                            "// " + filepath + "\n" +
                                "(function() {\n" +
                                "var __FOLDER_PATH__ = '" + folderPath + "';\n" +
                                processed + "\n" +
                                "})();";
                        return processed;
                    }
                },
                files: {
                    '<%= scripts.public.concat_file %>': ["<%= scripts.public.paths %>"],
                    '<%= scripts.common.concat_file %>': ["<%= scripts.common.paths %>"],
                    '<%= scripts.intra.concat_file %>': ["<%= scripts.intra.paths %>"],
                    '<%= scripts.tael.concat_file %>': ["<%= scripts.tael.paths %>"]
                }
            },

            pkg: {
                files: {
                    '<%= scripts.public.pkg_file %>': [
                        '<%= scripts.public.concat_file %>'
                    ],
                    '<%= scripts.intra.pkg_file %>': [
                        '<%= scripts.common.annot_file %>',
                        '<%= scripts.intra.annot_file %>',
                        '<%= scripts.compiled_tpl.common %>',
                        '<%= scripts.compiled_tpl.intra %>'
                    ],
                    '<%= scripts.tael.pkg_file %>': [
                        '<%= scripts.common.annot_file %>',
                        '<%= scripts.tael.annot_file %>',
                        '<%= scripts.compiled_tpl.common %>',
                        '<%= scripts.compiled_tpl.tael %>'
                    ]
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
                        src: ['<%= paths.dist %>/*']
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
                        "<%= libs.js.concat_file %>",
                        "<%= libs.test.concat_file %>",
                        "<%= scripts.common.concat_file %>",
                        '<%= scripts.compiled_tpl.common %>',
                        "<%= scripts.tael.concat_file %>",
                        '<%= scripts.compiled_tpl.tael %>',
                        "<%= scripts.intra.concat_file %>",
                        '<%= scripts.compiled_tpl.intra %>',
                        '<%= paths.test %>/spec/**/*.js'
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

    // top level tasks

    grunt.registerTask('test', [
        'clean:build',
        'build-dev',
        'run-test'
    ]);

    grunt.registerTask("package", function () {
        grunt.task.run(
            'clean',
            'build-dev',
            'run-test',
            'build-dist'
        );
    });

    grunt.registerTask('server', [
        'clean:build',
        'build-dev',
        'configureProxies',
        'connect:livereload',
        'watch'
    ]);

    grunt.registerTask('default', ["package"]);

};
