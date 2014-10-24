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
uglify     = require 'gulp-uglify'
ecstatic   = require 'ecstatic'
livereload = require 'gulp-livereload'
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
    debug: not production

  build = bundle.bundle()
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
    .pipe stylus
      'include css': true

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

gulp.task 'watch', ->
  livereload.listen()

  gulp.watch paths.templates.watch, ['templates']
  gulp.watch paths.styles.watch, ['styles']
  gulp.watch paths.assets.watch, ['assets']

  bundle = watchify browserify
    entries: [paths.scripts.source]
    extensions: ['.coffee']
    debug: not production
    cache: {}
    packageCache: {}
    fullPaths: true

  bundle.on 'update', ->
    build = bundle.bundle()
      .on 'error', handleError

      .pipe source paths.scripts.filename

    build
      .pipe gulp.dest paths.scripts.destination
      .pipe(livereload())

  .emit 'update'

gulp.task 'no-js', ['templates', 'styles', 'assets']
gulp.task 'build', ['scripts', 'no-js']
# scripts and watch conflict and will produce invalid js upon first run
# which is why the no-js task exists.
gulp.task 'default', ['no-js', 'watch', 'server']
