# Project template for [gulp.js](http://gulpjs.com/)

## What it does
* [Jade](jade-lang.com) files to HTML
* [Stylus](http://learnboost.github.io/stylus) files to CSS
* [CoffeeScript](http://coffeescript.org/) files to Javascript through [browserify](http://browserify.org/)
    * You are able to use 'require' in your client-side code
* Serves your static files to localhost:9001
* Reloads your browser with LiveReload when files change

## Getting things up and running
- Install [Node.js](http://nodejs.org)

```
 git clone git@github.com:leonidas/gulp-project-template.git <your project name>
 cd <your project name>
 npm install
 npm start
 open http://localhost:9001 in your browser
````
## Commands
* npm install
    * Installs server-side dependencies from NPM and client-side dependencies from Bower
* npm start
    * Compiles your files, starts watching files for changes, serves static files to port 9001
* npm run build
    * Builds everything

Minification, uglification and other tasks you're expected to run before deploying your product can be made by running the build command with env variable NODE_ENV set to "production"

    NODE_ENV=production npm run build


## Adding 3rd party libraries
**Note**: If the package you are looking for can be found in NPM it's much easier to install it from there. After installing packages from NPM they can be required without any of the following instructions.

    bower install jquery --save

Now to use jQuery in your frontend code, you'll need to add jQuery to "browser" and "browserify-shim" sections of your package.json. Your package.json should be something like this:

    ...

    "browser": {
      "jquery": "./bower_components/jquery/dist/jquery.js"
    },
    "browserify-shim": {
      "jquery": "$"
    },
    "browserify": {
      "transform": [ "coffeeify", "browserify-shim" ]
    }
    ...

Now your should be able to require jQuery in your coffee files

    $ = require 'jquery'


## Development guidelines
* **public** - directory should be dedicated only to compiled/copied files from **src** - directory.
  It should be possible to delete directory completely and after **npm start** or **npm run build** everything should be as they were before the deletation.
* All backend dependencies should be installed with **npm**. Browser dependencies should be installed with **bower**.

## Enable LiveReload
Install [LiveReload for Chrome](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en)
