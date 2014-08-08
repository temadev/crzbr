'use strict';


module.exports = function less(grunt) {
  // Load task
  grunt.loadNpmTasks('grunt-contrib-less');

  // Options
  return {
    build: {
      options: {
        cleancss: true
      },
      files: {
        '.build/css/app.css': 'public/css/app.less'
      }
    }
  };
};
