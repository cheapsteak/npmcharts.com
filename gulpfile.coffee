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
coffeeify  = require 'coffeeify'
nodeStatic = require 'node-static'
lr         = require 'tiny-lr'
livereload = require 'gulp-livereload'
plumber    = require 'gulp-plumber'
prefix     = require 'gulp-autoprefixer'
reloadServer = lr()

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

gulp.task 'scripts', ->

  bundle = browserify paths.scripts.source

  build = bundle.bundle(debug: not production)
    .pipe source paths.scripts.filename

  build.pipe(streamify(uglify())) if production

  build
    .pipe gulp.dest paths.scripts.destination

gulp.task 'templates', ->
  gulp
    .src paths.templates.source
    .pipe(jade(pretty: not production))
    .pipe gulp.dest paths.templates.destination
    .pipe livereload(reloadServer)

gulp.task 'styles', ->
  styles = gulp
    .src paths.styles.source
    .pipe(stylus({set: ['include css']}))
    .pipe prefix 'last 2 versions', 'Chrome 34', 'Firefox 28', 'iOS 7'

  styles = styles.pipe(CSSmin()) if production

  styles.pipe gulp.dest paths.styles.destination
    .pipe livereload reloadServer

gulp.task 'assets', ->
  gulp
    .src paths.assets.source
    .pipe gulp.dest paths.assets.destination

gulp.task "server", ->
  staticFiles = new nodeStatic.Server './public'
  require('http').createServer (req, res) ->
    req.addListener 'end', ->
      staticFiles.serve req, res
    req.resume()
  .listen 9001

gulp.task "watch", ->
  reloadServer.listen 35729

  gulp.watch paths.templates.watch, ['templates']
  gulp.watch paths.styles.watch, ['styles']
  gulp.watch paths.assets.watch, ['assets']

  bundle = watchify paths.scripts.source

  bundle.on 'update', ->
    build = bundle.bundle(debug: not production)
      .pipe source paths.scripts.filename

    build
      .pipe gulp.dest paths.scripts.destination
      .pipe(livereload(reloadServer))

  .emit 'update'

gulp.task "build", ['scripts', 'templates', 'styles', 'assets']
gulp.task "default", ["build", "watch", "server"]
