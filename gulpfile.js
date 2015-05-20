'use strict';

var browserify = require('browserify');
var browserSync = require('browser-sync');
var duration = require('gulp-duration');
var ecstatic = require('ecstatic');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jade = require('gulp-jade');
var notify = require('gulp-notify');
var prefix = require('gulp-autoprefixer');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var streamify = require('gulp-streamify');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var watchify = require('watchify');

var production = process.env.NODE_ENV === 'production';

var config = {
  scripts: {
    source: './src/coffee/main.coffee',
    extensions: ['.coffee'],
    destination: './public/js/',
    filename: 'bundle.js'
  },
  templates: {
    source: './src/jade/*.jade',
    watch: './src/jade/*.jade',
    destination: './public/'
  },
  styles: {
    source: './src/stylus/style.styl',
    watch: './src/stylus/*.styl',
    destination: './public/css/'
  },
  assets: {
    source: './src/assets/**/*.*',
    watch: './src/assets/**/*.*',
    destination: './public/'
  }
};

var browserifyConfig = {
  entries: [config.scripts.source],
  extensions: config.scripts.extensions,
  debug: !production,
  cache: {},
  packageCache: {}
};

function handleError(err) {
  gutil.log(err);
  gutil.beep();
  notify({
    title: 'Compile Error',
    message: err.message
  });
  return this.emit('end');
}

gulp.task('scripts', function() {
  var pipeline = browserify(browserifyConfig)
    .bundle()
    .on('error', handleError)
    .pipe(source(config.scripts.filename));

  if (production) {
    pipeline = pipeline.pipe(streamify(uglify()));
  }
  return pipeline.pipe(gulp.dest(config.scripts.destination));
});

gulp.task('templates', function() {
  var pipeline = gulp.src(config.templates.source)
  .pipe(jade({
    pretty: !production
  }))
  .on('error', handleError)
  .pipe(gulp.dest(config.templates.destination));

  if(production) {
    return pipeline;
  }

  return pipeline.pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('styles', function() {
  var pipeline = gulp.src(config.styles.source);

  if (!production) {
    pipeline = pipeline.pipe(sourcemaps.init());
  }

  pipeline = pipeline.pipe(stylus({
    'include css': true,
    compress: production
  }))
  .on('error', handleError)
  .pipe(prefix('last 2 versions', 'Chrome 34', 'Firefox 28', 'iOS 7'));

  if (!production) {
    pipeline = pipeline.pipe(sourcemaps.write('.'));
  }

  pipeline = pipeline.pipe(gulp.dest(config.styles.destination));

  if (production) {
    return pipeline;
  }

  return pipeline.pipe(browserSync.stream({
    match: '**/*.css'
  }));
});

gulp.task('assets', function() {
  return gulp.src(config.assets.source)
    .pipe(gulp.dest(config.assets.destination));
});

gulp.task('server', function() {
  return browserSync({
    open: false,
    port: 9001,
    server: {
      baseDir: './public'
    }
  });
});

gulp.task('watch', function() {
  gulp.watch(config.templates.watch, ['templates']);
  gulp.watch(config.styles.watch, ['styles']);
  gulp.watch(config.assets.watch, ['assets']);

  var bundle = watchify(browserify(browserifyConfig));

  bundle.on('update', function() {
    var build = bundle.bundle()
      .on('error', handleError)
      .pipe(source(config.scripts.filename));

    build.pipe(gulp.dest(config.scripts.destination))
    .pipe(duration('Rebundling browserify bundle'))
    .pipe(browserSync.reload({stream: true}));
  }).emit('update');
});

var buildTasks = ['templates', 'styles', 'assets'];

gulp.task('build', buildTasks.concat(['scripts']));
gulp.task('default', buildTasks.concat(['watch', 'server']));
