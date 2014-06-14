'use strict';

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    var mountFolder = function (connect, dir) {
        return connect.static(require('path').resolve(dir));
    };

    grunt.initConfig({

        pkg: grunt.file.readJSON("bower.json"),

        paths : {
            src   : "src",
            bower : "bower_components",
            build : "build",
            dist  : "dist",
            test  : "test",
            demo  : "demo",
            css   : "css"
        },

        bower_dir : "bower_components",
        build_dir : "build",
        dist_dir  : "dist",
        test_dir  : "test",

        files : {
            core : [
                "src/itModule.js",
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
                "<%= paths.bower %>/angular/angular.js",
                "<%= paths.bower %>/angular-route/angular-route.js"
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
                    '<%= paths.build %>/infiniTable.js': ["<%= files.core %>"]
                }
            },

            demo : {
                files : {
                    '<%= paths.build %>/infiniTable-demo.js' : ["demo/demo-app.js", "demo/demos/**/*.js"]
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
                    "<%= paths.build %>/infiniTable.css": ["css/infiniTable.less"],
                    "<%= paths.build %>/infiniTable-themes.css": ["css/themes/**/*.less"]
                }
            },
            demo: {
                files: {
                    "<%= paths.build %>/infiniTable-demo.css": ["demo/demo-app.less"]
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
            build: {
                files: [
                    {
                        dot: true,
                        src: ['<%= paths.build %>/*']
                    }
                ]
            },
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

        connect: {
            options: {
                port: 9000,
                hostname: 'localhost'
            },
            demo: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, grunt.config.get("paths.demo")),
                            mountFolder(connect, grunt.config.get("paths.build"))
                        ];
                    }
                }
            }
        },

        watch: {

            options: {
                interrupt: true
            },

            scripts: {
                files: ['<%= paths.src %>/**/*.js'],
                tasks: ['concat:app']
            },

            css: {
                files: ['<%= paths.css %>/**/*.less'],
                tasks: ['less:app']
            },

            demoJs : {
                files: ['<%= paths.demo %>/**/*.js'],
                tasks: ['concat:demo']
            },

            demoCss: {
                files: ['<%= paths.demo %>/**/*.less'],
                tasks: ['less:demo']
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


    grunt.registerTask("build-src", [
        'concat:app',
        'concat:libs',
        "less:app"
    ]);

    grunt.registerTask("build-demo", [
        "concat:demo",
        "less:demo"
    ]);

    // package-table
    // package-site

    grunt.registerTask("package", [
        'clean',
        "build-src",
        "build-demo",

        "karma:unit"
        //'run-test',
        //'build-dist'
    ]);


    grunt.registerTask("run-demo", [
        "build-src",
        "build-demo",
        "connect:demo",
        "watch"
    ]);

    grunt.registerTask('default', ["package"]);

};
