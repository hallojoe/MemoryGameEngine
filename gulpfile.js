'use strict';
 
var gulp = require('gulp');
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require('gulp-rename');
  
gulp.task('default', ['compile', 'compress'], function () { });

gulp.task('compile', function () {
  return gulp.src('src/**/*.ts')
      .pipe(ts({
          noImplicitAny: true,
          outDir:  './dist'
      }))
      .pipe(gulp.dest('./dist'));
});

gulp.task('compress', function (cb) {
  pump([
        gulp.src('./dist/memorygameengine.js'),
        uglify(),
        rename({ suffix: '.min' }),
        gulp.dest('dist')    
      ],
    cb
  );
});