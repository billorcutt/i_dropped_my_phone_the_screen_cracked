module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/**/*.js','plugins/**/*.js'],
                dest: 'dist/cracked.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/cracked.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'plugins/**/*.js'],
            options: {
                // options here to override JSHint defaults
                nonew:true,
                curly:true,
                noarg:true,
                loopfunc:true,
                forin:true,
                noempty:true,
                eqeqeq:true,
                undef:true,
                bitwise:false,
                newcap:true,
                browser:true,
                globals: {
                    AudioContext: true,
                    webkitAudioContext: true,
                    __: true,
                    cracked: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        dox: {
            options: {
                title: "Documentation"
            },
            files: {
                src: ['src/**/*.js','plugins/**/*.js'],
                dest: 'docs'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-dox');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify','dox']);

};