var fs = require('fs'),
  Path = require('path'),
  async = require('async'),
  /* Adapted from https://gist.github.com/2594980 */
  imgRegex = /url\s?\(['"]?(.*?)(?=['"]?\))/gi,
  absoluteUrlRegex = /^\//,
  externalUrlRegex = /http/;

module.exports = optimizeFile;

function optimizeFile(cssFile, root, cb) {
  fs.readFile(cssFile, function(err, css){
    if(err) return cb(err);
    css = css.toString();
    var urls = [], match;
    while (match = imgRegex.exec(css)) {
      urls.push(match[1]);
    }
    async.forEachSeries(urls, base64img, function(err){
      if(err) return cb(err);
      cb(null, css);
    });

    function base64img(imageUrl, cb){
      if(externalUrlRegex.test(imageUrl)) return console.error('Skip ' + imageUrl);

      var imagePath;
      if(absoluteUrlRegex.test(imageUrl)) {
        imagePath = Path.join(imageUrl, imagePath, css, cb);
      }else{
        imagePath = Path.join(Path.dirname(cssFile), imageUrl);
      }
      replaceUrlByB64(imageUrl, imagePath, css, function (err, newCss){
        if(err) return cb(err);
        css = newCss;
        cb();
      });
    }
  });
}

function replaceUrlByB64(imageUrl, imagePath, css, cb){
  imagePath = imagePath.replace(/[?#].*/g, '');
  fs.stat(imagePath, function(err, stat){
    if(err) return cb(err);
    if (stat.size > 4096){
      console.error('Skip ' + imageUrl + ' Exceed max size');
      return cb(null, css);
    }
    fs.readFile(imagePath, 'base64', function(err, img){
      if(err) return cb(err);
      var ext = imagePath.substr(imagePath.lastIndexOf('.') + 1);
      var newCss = css.replace(imageUrl, 'data:image/' + ext + ';base64,' + img);
      cb(null, newCss);
    });
  });
}
