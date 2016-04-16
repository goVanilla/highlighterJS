// ---------------------------------------------------------------------
// | Loading Task modules                                                      |
// ---------------------------------------------------------------------


// ---- gulp core and loaders -----
var gulp = require('gulp');
// Load all gulp plugins automatically
// and attach them to the `plugins` object
var plugins = require('gulp-load-plugins')();
// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

// ---- package specifications -----
var pkg = require('./package.json');
var dirs = pkg['h5bp-configs'].directories;

// ---- JavaScripts -----
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var babel = require("gulp-babel");

// ---- SASS -----
var sass = require('gulp-sass');

// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('clean', function (done) {
    require('del')([
        dirs.dist
    ]).then(function () {
        done();
    });
});

gulp.task('copy', [
    'copy:index.html',
    'copy:misc'
]);

gulp.task('copy:watch', function () {
    gulp.watch(dirs.src + '/index.html', ['copy']);
});



gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + '/index.html')
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        dirs.src + '/**/*',

        // Exclude the following files
        // (other tasks will handle the copying of these files)
        '!' + dirs.src + '/sass',
        '!' + dirs.src + '/js',
        '!' + dirs.src + '/index.html'

    ], {

        // Include hidden files by default
        dot: true

    }).pipe(gulp.dest(dirs.dist));
});



gulp.task('scripts', function() {
    return gulp.src(dirs.src + '/js/*.js')
      .pipe(sourcemaps.init())
      .pipe(babel())
      .pipe(concat(pkg.name + '.js'))
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(dirs.dist + '/js'));
});

gulp.task('scripts:watch', function () {
    gulp.watch('./src/js/**/*.js', ['scripts']);
});


gulp.task('sass', function () {
    return gulp.src('./src/sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('./dist/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./src/sass/**/*.scss', ['sass']);
});



// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------


gulp.task('build', function (done) {
    runSequence(
        ['clean', 'scripts'],
        'copy', 'sass',
    done);
});

gulp.task('default', ['build', 'copy:watch', 'scripts:watch', 'sass:watch']);
