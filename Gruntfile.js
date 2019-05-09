/*jshint node: true*/

'use strict';

var path = require('path');

module.exports = function (grunt) {

    require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config'),
        config: {
            pkg: grunt.file.readJSON('package.json'),
            meta: {
                cwd: '',
                cwdAll: '**/*',

                source: 'src/',
                sourceAll: 'src/**/*',

                build: 'build/',
                buildAll: 'build/**/*',

                test: 'test/',
                testAll: 'test/**/*',

                npm: 'node_modules/',
                npmAll: 'node_modules/**/*'
            }
        }
    });
    
    

    grunt.loadTasks('./grunt/tasks');

    grunt.registerTask('build', 'Build a bundle', [
        'clean:build',
        'modularize:build',
        'copy:build',
        'update_json:npm',
        'update_json:bower'
    ]);

    grunt.registerTask('default', 'Run code checker', [
        'jsonlint',
        'jshint'
    ]);

};
