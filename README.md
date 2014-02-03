# Project template for [gulp.js](http://gulpjs.com/)

## What it does
* [Jade](jade-lang.com) files to HTML
* [Stylus](http://learnboost.github.io/stylus) files to CSS
* [CoffeeScript](http://coffeescript.org/) files to Javascript through [browserify](http://browserify.org/)
    * You are able to use 'require' in your client-side code
* Serves your static files to localhost:9001
* Reloads your browser with LiveReload when files change

## Getting things up and running

    git clone git@github.com:leonidas/gulp-project-template.git
    npm install
    npm start
    open http://localhost:9001 in your browser

## Commands
* npm install
    * Installs server-side dependencies from NPM and client-side dependencies from Bower
* npm start
    * Compiles your files, starts watching files for changes, serves static files to port 9001
* npm run build
    * Builds & minifies everything

## Enable LiveReload
Install [LiveReload for Chrome](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en)
