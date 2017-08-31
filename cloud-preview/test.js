
var gm = require('gm').subClass({
  imageMagick: true,
  appPath: __dirname + '/bin/',
});

gm('./test.svg')
  .command('convert')
  .in('-size', '1024x1024')
  .toBuffer('PNG',function (err, buffer) {
    if (err) return handle(err);
    console.log('done!', buffer);
  })
  // .write('./test-out.png', function (err) {
  //   if (!err) console.log('done');
  //   if (err) console.log(err);
  // });