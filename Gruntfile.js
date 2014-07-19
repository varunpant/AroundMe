module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'build/index.js',
        dest: 'build/index.min.js'
      }
    },
    concat: {
      options: {},
      dist: {
        src: [
          'scripts/app.js',
          'scripts/log.js',
          'scripts/ajax.js',
          'scripts/paginator.js',
          'scripts/controls.js',
          'scripts/map.js',
          'scripts/init.js'
        ],
        dest: 'build/index.js'
      }
    }
  });

  /// Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  //default tasks
  grunt.registerTask('default', ['concat', 'uglify']);

};