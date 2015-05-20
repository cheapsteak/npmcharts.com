browserify   = require 'browserify'
browserSync  = require 'browser-sync'
duration     = require 'gulp-duration'
ecstatic     = require 'ecstatic'
gulp         = require 'gulp'
gutil        = require 'gulp-util'
jade         = require 'gulp-jade'
notify       = require 'gulp-notify'
path         = require 'path'
prefix       = require 'gulp-autoprefixer'
source       = require 'vinyl-source-stream'
sourcemaps   = require 'gulp-sourcemaps'
streamify    = require 'gulp-streamify'
stylus       = require 'gulp-stylus'
uglify       = require 'gulp-uglify'
watchify     = require 'watchify'

production = process.env.NODE_ENV is 'production'

config =
  scripts:
    source: './src/coffee/main.coffee'
    extensions: ['.coffee']
    destination: './public/js/'
    filename: 'bundle.js'
  templates:
    source: './src/jade/*.jade'
    watch: './src/jade/*.jade'
    destination: './public/'
  styles:
    source: './src/stylus/style.styl'
    watch: './src/stylus/*.styl'
    destination: './public/css/'
  assets:
    source: './src/assets/**/*.*'
    watch: './src/assets/**/*.*'
    destination: './public/'

browserifyConfig =
  entries: [config.scripts.source]
  extensions: config.scripts.extensions
  debug: not production
  cache: {}
  packageCache: {}

handleError = (err) ->
  gutil.log err
  gutil.beep()

  notify
    title: 'Compile Error'
    message: err.message

  this.emit 'end'

gulp.task 'scripts', ->
  pipeline = browserify(browserifyConfig)
    .bundle()
    .on 'error', handleError
    .pipe source config.scripts.filename

  pipeline = build.pipe(streamify(uglify())) if production

  pipeline.pipe gulp.dest config.scripts.destination

gulp.task 'templates', ->
  pipeline = gulp
    .src config.templates.source
    .pipe jade pretty: not production
    .on 'error', handleError
    .pipe gulp.dest config.templates.destination

  if production then pipeline else pipeline.pipe browserSync.reload(stream: true)

gulp.task 'styles', ->
  pipeline = gulp.src config.styles.source

  pipeline = pipeline.pipe(sourcemaps.init()) unless production

  pipeline = pipeline.pipe stylus
    'include css': true
    compress: production
  .on 'error', handleError
  .pipe prefix 'last 2 versions', 'Chrome 34', 'Firefox 28', 'iOS 7'

  pipeline = pipeline.pipe(sourcemaps.write '.') unless production
  pipeline = pipeline.pipe gulp.dest config.styles.destination

  if production then pipeline else pipeline.pipe browserSync.stream match: '**/*.css'

gulp.task 'assets', ->
  gulp
    .src config.assets.source
    .pipe gulp.dest config.assets.destination

gulp.task 'server', ->
  browserSync
    open: false
    port: 9001
    server:
      baseDir: './public'

gulp.task 'watch', ->
  gulp.watch config.templates.watch, ['templates']
  gulp.watch config.styles.watch, ['styles']
  gulp.watch config.assets.watch, ['assets']

  bundle = watchify browserify browserifyConfig

  bundle.on 'update', ->
    build = bundle.bundle()
      .on 'error', handleError
      .pipe source config.scripts.filename

    build
      .pipe gulp.dest config.scripts.destination
      .pipe(duration('Rebundling browserify bundle'))
      .pipe(browserSync.reload(stream: true))

  .emit 'update'

buildTasks = ['templates', 'styles', 'assets']

gulp.task 'build', buildTasks.concat ['scripts']
gulp.task 'default', buildTasks.concat ['watch', 'server']
