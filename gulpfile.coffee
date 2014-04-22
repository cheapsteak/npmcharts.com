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

gulp.task 'coffee', ->

  bundle = browserify('./src/coffee/main.coffee')

  build = bundle.bundle(debug: not production)
    .pipe(source('bundle.js'))

  build.pipe(streamify(uglify())) if production

  build
    .pipe(gulp.dest('./public/js/'))

gulp.task 'jade', ->
  gulp
    .src('src/jade/*.jade')
    .pipe(jade(pretty: not production))
    .pipe(gulp.dest('public/'))
    .pipe livereload(reloadServer)

gulp.task 'stylus', ->
  styles = gulp
    .src('src/stylus/style.styl')
    .pipe(stylus({set: ['include css']}))
    .pipe(prefix("last 1 version", "> 1%", "ie 8"))

  styles.pipe(CSSmin()) if production

  styles.pipe(gulp.dest('public/css/'))
    .pipe livereload reloadServer

gulp.task 'assets', ->
  gulp
    .src('src/assets/**/*.*')
    .pipe gulp.dest 'public/'

gulp.task "server", ->
  staticFiles = new nodeStatic.Server './public'
  require('http').createServer (req, res) ->
    req.addListener 'end', ->
      staticFiles.serve req, res
    req.resume()
  .listen 9001

gulp.task "watch", ->
  reloadServer.listen 35729

  gulp.watch "src/jade/*.jade", ["jade"]
  gulp.watch "src/stylus/*.styl", ["stylus"]
  gulp.watch "src/assets/**/*.*", ["assets"]

  bundle = watchify('./src/coffee/main.coffee')

  bundle.on 'update', ->
    build = bundle.bundle(debug: not production)
      .pipe(source('bundle.js'))

    build
      .pipe(gulp.dest('./public/js/'))
      .pipe(livereload(reloadServer))

  .emit 'update'

gulp.task "build", ["coffee", "jade", "stylus", "assets"]
gulp.task "default", ["build", "watch", "server"]
