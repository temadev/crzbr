var gulp = require('gulp'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  jade = require('gulp-jade'),
  less = require('gulp-less'),
  livereload = require('gulp-livereload'), // Livereload plugin needed: https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei
  tinylr = require('tiny-lr'),
  marked = require('marked'), // For :markdown filter in jade
  path = require('path'),
  changed = require('gulp-changed'),
  prettify = require('gulp-html-prettify'),
  server = tinylr();

// LiveReload port. Change it only if there's a conflict
var lvr_port = 35727;

//  Edit here the modules scripts 
//  that will be used in the pages
var pageScripts = [
  'public/js/modules/utils.js',
  'public/js/modules/play-animations.js',
  'public/js/pages.init.js'
];

// SOURCES CONFIG 
var source = {
  scripts: {
    app: ['public/js/modules/*.js', 'public/js/app.init.js'],
    pages: pageScripts
  }
};

// BUILD TARGET CONFIG 
var build = {
  scripts: {
    app: {
      main: 'app.js',
      dir: 'public/js/'
    },
    pages: {
      main: 'pages.js',
      dir: 'public/js/'
    }
  }
};


// Error handler
function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}


//---------------
// TASKS
//---------------


// JS APP
gulp.task('scripts-app', function () {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(source.scripts.app)
    //.pipe(uglify())  /* UNCOMMENT TO MINIFY * /
    .pipe(concat(build.scripts.app.main))
    .pipe(gulp.dest(build.scripts.app.dir))
    .pipe(livereload(server));
});

// JS PAGES
gulp.task('scripts-pages', function () {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(source.scripts.pages)
    //.pipe(uglify())  /* UNCOMMENT TO MINIFY * /
    .pipe(concat(build.scripts.pages.main))
    .pipe(gulp.dest(build.scripts.pages.dir))
    .pipe(livereload(server));
});


//---------------
// WATCH
//---------------

// Rerun the task when a file changes
gulp.task('watch', function () {
  try {
    server.listen(
      lvr_port,
      function (err) {

        if (err) {
          return console.log(err);
        }

        gulp.watch(source.scripts.app, ['scripts-app']);
        gulp.watch(source.scripts.pages, ['scripts-pages']);

      });
  }
  catch (e) {
    console.log(e);
  }

});

//---------------
// DEFAULT TASK
//---------------

gulp.task('default', [
  'scripts-app',
  'scripts-pages',
  'watch'
]);
