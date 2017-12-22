
let NODE_ENV = 'dev'

const gulp = require('gulp')
const gulp_uglify_es = require('gulp-uglify-es').default
const gulp_htmlmin = require('gulp-htmlmin')
const gulp_replace = require('gulp-replace')
const gulp_clean_css = require('gulp-clean-css')
const gulp_concat = require('gulp-concat')
const gulp_preprocess = require('gulp-preprocess')
const gulp_run_sequence = require('run-sequence')
const path = require('path')
const del = require('del')
const pump = require('pump')
const fs = require('fs')
const crypto = require('crypto')
const _package = require('./package.json')
const build_folder = _package.config.folders.build
const src_folder = _package.config.folders.src

function getPreprocessConfigs() {
  var config = getFreshConfigs()
  return {
    context: {
      NODE_ENV: NODE_ENV,
      CACHE_VERSION: getCacheVersion(),
      REQUEST_SEARCH_ORIGIN: config.service_worker.request_search.origin,
      REQUEST_SEARCH_TARGET: config.service_worker.request_search.target,
      REQUEST_SEARCH_OUTSIDE: config.service_worker.request_search.outside,
      REQUEST_SEARCH_INSIDE: config.service_worker.request_search.inside
    }
  }
}

function getFreshConfigs() {
  return JSON.parse(fs.readFileSync('./package.json').toString()).config
}

function getCacheVersion() {
  const hash = crypto.createHash('md5')
  const config = getFreshConfigs()
  hash.update('' + config.service_worker.cache_version)
  return hash.digest('hex')
}

const vue_path = {
  dev: 'node_modules/vue/dist/vue.js',
  production: 'node_modules/vue/dist/vue.min.js'
}

const vue_router_path = {
  dev: 'node_modules/vue-router/dist/vue-router.js',
  production: 'node_modules/vue-router/dist/vue-router.min.js'
}

const materialize_js_path = {
  dev: 'node_modules/materialize-css/dist/js/materialize.js',
  production: 'node_modules/materialize-css/dist/js/materialize.min.js'
}

const materialize_css_path = {
  dev: 'node_modules/materialize-css/dist/css/materialize.css',
  production: 'node_modules/materialize-css/dist/css/materialize.min.css'
}

const materialize_font_path = {
  dev: 'node_modules/materialize-css/dist/fonts/**/*',
  production: 'node_modules/materialize-css/dist/fonts/**/*'
}

const jquery_path = {
  dev: 'node_modules/jquery/dist/jquery.js',
  production: 'node_modules/jquery/dist/jquery.min.js'
}

gulp.task('js', function(callback) {
  pump([
    gulp.src([build_folder + '/**/*.js']),
    gulp_uglify_es(),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('vue', function(callback) {
  pump([
    gulp.src([
      jquery_path[NODE_ENV],
      materialize_js_path[NODE_ENV],
      vue_path[NODE_ENV],
      vue_router_path[NODE_ENV],
      build_folder + '/js/app.js'
    ]),
    gulp_uglify_es(),
    gulp_concat('js/app.js'),
    gulp.dest(build_folder)
  ], callback);
})

gulp.task('preprocess-vue', function(callback) {
  pump([
    gulp.src(build_folder + '/**/*.vue.html'),
    gulp_htmlmin({collapseWhitespace: true}),
    gulp_replace(/('|")/g, '\\$&'),
    gulp.dest(build_folder)
  ], callback)
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
    gulp.src([
      build_folder + '/**/*.css',
      materialize_css_path[NODE_ENV]
    ]),
    gulp_clean_css({keepSpecialComments: 0, processImport: true, processImportFrom: ['all'], rebase: false}),
    gulp_concat('css/app.css'),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('watch-dev', function(callback) {
  gulp_run_sequence('dev', function() {
    gulp.watch([src_folder + '/**'], ['dev'])
  })
})

gulp.task('watch-prod', function(callback) {
  gulp_run_sequence('prod', function() {
    gulp.watch([src_folder + '/**'], ['prod'])
  })
})

gulp.task('copy', function(callback) {
  pump([
    gulp.src(src_folder + '/**/*'),
    gulp.dest(build_folder)
  ], function() {
    pump([
      gulp.src([
        build_folder + '/**/*.css',
        materialize_css_path[NODE_ENV]
      ]),
      gulp_concat('css/app.css'),
      gulp.dest(build_folder)
    ], function() {
      pump([
        gulp.src([
          materialize_font_path[NODE_ENV]
        ]),
        gulp.dest(build_folder + '/fonts')
      ], callback)
    })
  })
})

gulp.task('preprocess-dev', function(callback) {
  pump([
    gulp.src([build_folder + '/**/*.js', build_folder + '/**/*.html']),
    gulp_preprocess(getPreprocessConfigs()),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('preprocess-prod', function(callback) {
  pump([
    gulp.src([build_folder + '/**/*.js', build_folder + '/**/*.html']),
    gulp_preprocess(getPreprocessConfigs()),
    gulp.dest(build_folder)
  ], callback)
})

gulp.task('del', function(callback) {
  del([build_folder]).then(function() {
    callback()
  })
})

gulp.task('clean-up', function(callback) {
  del([build_folder + '/**/*.vue.html']).then(function() {
    callback()
  })
})

gulp.task('prod', function(callback) {
  NODE_ENV = 'production'
  gulp_run_sequence('del', 'copy', 'preprocess-vue', 'preprocess-prod', 'html', 'css', 'js', 'vue', 'clean-up', callback)
})

gulp.task('dev', ['default'])

gulp.task('default', function(callback) {
  return gulp_run_sequence('del', 'copy', 'preprocess-vue', 'preprocess-dev', 'vue', 'clean-up', callback)
})
