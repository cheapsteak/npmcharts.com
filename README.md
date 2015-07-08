# Project template for [gulp.js](http://gulpjs.com/)
<img width="114px" height="257px" align="right" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png"/>

[ ![Codeship Status for leonidas/gulp-project-template](https://codeship.com/projects/07620890-e45d-0132-b176-5e88bc3b0df8/status?branch=master)](https://codeship.com/projects/81833)

### What it does
* [Jade](http://jade-lang.com) files to HTML
* [Stylus](http://learnboost.github.io/stylus) files to CSS
* [ES6+ JavaScript](https://babeljs.io) files to ES5 Javascript through [browserify](http://browserify.org/)
    * You are able to use 'require' in your client-side code
* Uses [BrowserSync](http://www.browsersync.io/) to serve your static files to localhost:9001 and to automatically reload your browser when files change.

## Getting things up and running
- Install [Node.js](http://nodejs.org)

```
 git clone git@github.com:leonidas/gulp-project-template.git <your project name>
 cd <your project name>
 npm install
 npm start
 open http://localhost:9001 in your browser
```

## CLI Commands
* npm install
    * Installs server-side dependencies from NPM and client-side dependencies from Bower
* npm start
    * Compiles your files, starts watching files for changes, serves static files to port 9001
* npm run build
    * Builds everything

# Production build
Minification, uglification and other tasks you're expected to run before deploying your product can be made by running the build command with env variable NODE_ENV set to "production"

    NODE_ENV=production npm run build

## Development guidelines
#### Directory structure

**public** - directory should be dedicated only to compiled/copied files from **src** - directory.
  It should be possible to delete directory completely and after **npm start** or **npm run build** everything should be as they were before the deletion.

#### Dependencies
All dependencies are meant to be installed with **bower** or with **npm**.
* JavaScript-files from both **bower_components** and **node_modules** can be *require()*'d in client-side modules.
* CSS files can be [imported](https://learnboost.github.io/stylus/docs/import.html) from **bower_components** and **node_modules** using relative path from the stylus file to the css file e.g `@import '../../bower_components/bootstrap/dist/css/bootstrap.css'`
* You can either create a new gulp task for copying other assets from directories mentioned above or use an array as a value for [assets sources](https://github.com/leonidas/gulp-project-template/blob/master/gulpfile.js#L38) e.g `source: ['./src/assets/**/*.*', 'bower_components/bootstrap/fonts*/*.*']` *(notice the asterisk after 'fonts'? It makes gulp copy the whole directory instead of just the files inside of it)*

## Suggested development tools

* [eslint](http://eslint.org/)
    * When used as an editor plugin (for example. [SublimeLinter](http://sublimelinter.readthedocs.org/en/latest/) + [SublimeLinter-eslint](https://github.com/roadhump/SublimeLinter-eslint)), gives you immediate feedback about your code and  can find bugs, potential problem areas, poor coding styles and stylistic issues.


## FAQ

### I want to use CoffeeScript instead of JavaScript
Check out the [coffee branch](https://github.com/leonidas/gulp-project-template/tree/coffee)
