path       = require 'path'
gulp       = require 'gulp'
gutil      = require 'gulp-util'
jade       = require 'gulp-jade'
stylus     = require 'gulp-stylus'
CSSmin     = require 'gulp-minify-css'
browserify = require 'browserify'
watchify   = require 'watchify'
source     = require 'vinyl-source-stream'
streamify  = require 'gulp-streamify'
rename     = require 'gulp-rename'
uglify     = require 'gulp-uglify'
ecstatic   = require 'ecstatic'
livereload = require 'gulp-livereload'
plumber    = require 'gulp-plumber'
prefix     = require 'gulp-autoprefixer'

production = process.env.NODE_ENV is 'production'

paths =
  scripts:
    source: './src/coffee/main.coffee'
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

handleError = (err) ->
  gutil.log err
  gutil.beep()
  this.emit 'end'

gulp.task 'scripts', ->

  bundle = browserify
    entries: [paths.scripts.source]
    extensions: ['.coffee']

  build = bundle.bundle(debug: not production)
    .on 'error', handleError
    .pipe source paths.scripts.filename

  build.pipe(streamify(uglify())) if production

  build
    .pipe gulp.dest paths.scripts.destination

gulp.task 'templates', ->
  pipeline = gulp
    .src paths.templates.source
    .pipe(jade(pretty: not production))
    .on 'error', handleError
    .pipe gulp.dest paths.templates.destination

  pipeline = pipeline.pipe livereload() unless production

  pipeline

gulp.task 'styles', ->
  styles = gulp
    .src paths.styles.source
    .pipe(stylus({set: ['include css']}))
    .on 'error', handleError
    .pipe prefix 'last 2 versions', 'Chrome 34', 'Firefox 28', 'iOS 7'

  styles = styles.pipe(CSSmin()) if production
  styles = styles.pipe gulp.dest paths.styles.destination
  styles = styles.pipe livereload() unless production
  styles

gulp.task 'assets', ->
  gulp
    .src paths.assets.source
    .pipe gulp.dest paths.assets.destination

gulp.task 'server', ->
  require('http')
    .createServer ecstatic root: __dirname + '/public'
    .listen 9001

gulp.task "watch", ->
  livereload.listen()

  gulp.watch paths.templates.watch, ['templates']
  gulp.watch paths.styles.watch, ['styles']
  gulp.watch paths.assets.watch, ['assets']

  bundle = watchify
    entries: [paths.scripts.source]
    extensions: ['.coffee']

  bundle.on 'update', ->
    build = bundle.bundle(debug: not production)
      .on 'error', handleError

      .pipe source paths.scripts.filename

    build
      .pipe gulp.dest paths.scripts.destination
      .pipe(livereload())

  .emit 'update'

gulp.task "build", ['scripts', 'templates', 'styles', 'assets']
gulp.task "default", ["build", "watch", "server"]
