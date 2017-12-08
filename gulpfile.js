
const gulp = require('gulp')
const gulp_uglify = require('gulp-uglify')
const gulp_htmlmin = require('gulp-htmlmin')
const gulp_clean_css = require('gulp-clean-css')
const gulp_concat = require('gulp-concat')
const gulp_preprocess = require('gulp-preprocess')
const gulp_run_sequence = require('run-sequence')
const path = require('path')
const del = require('del')
const pump = require('pump')
const _package = require('./package.json')
const build_folder = _package.config.folders.build
const src_folder = _package.config.folders.src
const vue_path = {
  dev: 'node_modules/vue/dist/vue.js',
  production: 'node_modules/vue/dist/vue.min.js'
}
let NODE_ENV = 'dev'

gulp.task('js', function(callback) {
  pump([
    gulp.src([build_folder + '/**/*.js']),
    gulp_uglify(),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('vue', function(callback) {
  pump([
    gulp.src([build_folder + '/js/app.js', vue_path[NODE_ENV]]),
    gulp_uglify(),
    gulp_concat('js/app.js'),
    gulp.dest(build_folder)
  ], callback);
})

gulp.task('html', function(callback) {
  pump([
    gulp.src(build_folder + '/**/*.html'),
    gulp_htmlmin({collapseWhitespace: true}),
    gulp.dest(build_folder)
  ], function() {
    return pump([
      gulp.src(build_folder + '/index.html'),
      gulp_htmlmin({collapseWhitespace: true}),
      gulp.dest(build_folder)
    ], callback)
  })
})

gulp.task('css', function(callback) {
  pump([
    gulp.src(build_folder + '/**/*.css'),
    gulp_clean_css({keepSpecialComments: 0, processImport: false}),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('watch-dev', function(callback) {
  gulp.watch([src_folder + '/**'], ['dev'])
})

gulp.task('watch-prod', function(callback) {
  gulp.watch([src_folder + '/**'], ['prod'])
})

gulp.task('copy', function(callback) {
  pump([
    gulp.src(src_folder + '/**/*'),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('preprocess-dev', function(callback) {
  pump([
    gulp.src(build_folder + '/**/*'),
    gulp_preprocess({
      context: {
        S3_REGION: _package.config.aws.s3.region,
        NODE_ENV: NODE_ENV
      }
    }),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('preprocess-prod', function(callback) {
  pump([
    gulp.src(build_folder + '/**/*'),
    gulp_preprocess({
      context: {
        S3_REGION: _package.config.aws.s3.region,
        NODE_ENV: NODE_ENV
      }
    }),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('clean', function(callback) {
  del([build_folder]).then(function() {
    callback()
  })
})

gulp.task('prod', function(callback) {
  NODE_ENV = 'production'
  gulp_run_sequence('clean', 'copy', 'preprocess-prod', 'html', 'css', 'js', 'vue', callback)
})

gulp.task('dev', ['default'])

gulp.task('default', function(callback) {
  return gulp_run_sequence('clean', 'copy', 'preprocess-dev', 'vue', callback)
})
