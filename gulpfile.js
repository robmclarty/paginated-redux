'use strict';

const gulp = require('gulp');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

gulp.task('build', function () {
  const browserifyOptions = {
    entries: ['./src/paginated-redux'],
    debug: false,
    fullPaths: false
  };
  const babelifyOptions = {
    presets: ['es2015'],
    plugins: ['babel-plugin-transform-object-rest-spread']
  };
  const stream = browserify(browserifyOptions)
    .transform(babelify.configure(babelifyOptions));

  return stream
    .bundle()
    .pipe(source('paginated-redux.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
});
