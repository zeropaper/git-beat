'use strict';

module.exports = function (grunt) {

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  var pkg = grunt.file.readJSON(__dirname + '/package.json');

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,

    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      lib: {
        files: {
          src: [
            'lib/**/*.js'
          ],
        }
      },
      mochacli: {
        options: {
          jshintrc: 'test/.jshintrc',
        },
        files: {
          src: [
            'test/**/*Spec.js'
          ],
        }
      }
    },

    jscs: {
      options: {
        config: '.jscs.json'
      },
      lib: {
        files: {
          src: [
            'lib/**/*.js'
          ],
        }
      },
      mochacli: {
        files: {
          src: [
            'test/**/*.js'
          ]
        }
      }
    },

    mochacli: {
      options: {
        files: [
          'test/**/*Spec.js'
        ]
      },
      spec: {
        options: {
          bail: true,
          reporter: 'spec',
          timeout: 10000
        }
      }
    },


    watch: {
      lib: {
        files: [
          'lib/**/*.js'
        ],
        tasks: [
          'jshint:lib',
          'jscs:lib',
          'mochacli'
        ]
      },
      mochacli: {
        files: [
          'test/**/*Spec.js'
        ],
        tasks: [
          'jshint:mochacli',
          'jscs:mochacli',
          'mochacli'
        ]
      }
    }
  });

  grunt.registerTask('default', [
    'mochacli'
  ]);
};
