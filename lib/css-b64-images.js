var fs = require('fs'),
  Path = require('path'),
  /* Adapted from https://gist.github.com/2594980 */
  imgRegex = /url\s?\(['"]?(.*?)(?=['"]?\))/gi,
  absoluteUrlRegex = /^\//,
  externalUrlRegex = /http/;

module.exports = {
  fromFile: fromFile,
  fromString: fromString
};

function fromString(css, relativePath, rootPath , cb) {
  if(!css.replace && css.toString) css = css.toString();
  var urls = [], match;
  while (match = imgRegex.exec(css)) {
    urls.push(match[1]);
  }
  forEachSeries(urls, base64img, function(err){
    if(err) return cb(err, css);
    cb(null, css);
  });

  function base64img(imageUrl, cb){
    if(externalUrlRegex.test(imageUrl)) {
      return cb(new Error('Skip ' + imageUrl + ' External file.'), css);
    }

    var imagePath;
    if(absoluteUrlRegex.test(imageUrl)) {
      imagePath = Path.join(rootPath, imageUrl.substr(1));
    }else{
      imagePath = Path.join(relativePath, imageUrl);
    }
    replaceUrlByB64(imageUrl, imagePath, css, function (err, newCss){
      if(err) return cb(err, css);
      css = newCss;
      cb();
    });
  }
}

function fromFile(cssFile, root, cb) {
  fs.readFile(cssFile, function(err, css){
    if(err) return cb(err, css);
    fromString(css.toString(), Path.dirname(cssFile), root, cb);
  });
}

function replaceUrlByB64(imageUrl, imagePath, css, cb){
  imagePath = imagePath.replace(/[?#].*/g, '');
  fs.stat(imagePath, function(err, stat){
    if(err) return cb(err, css);
    if (stat.size > 4096){
      return cb(new Error('Skip ' + imageUrl + ' Exceed max size'), css);
    }
    fs.readFile(imagePath, 'base64', function(err, img){
      if(err) return cb(err, css);
      var ext = imagePath.substr(imagePath.lastIndexOf('.') + 1);
      var newCss = css.replace(imageUrl, 'data:image/' + ext + ';base64,' + img);
      cb(null, newCss);
    });
  });
}

/* Adapted from async. Continue on error. */
function forEachSeries(arr, iterator, callback) {
  callback = callback || function () {};
  if (!arr.length) {
    return callback();
  }
  var completed = 0, errs = [];
  var iterate = function () {
    iterator(arr[completed], function (err) {
      if (err) {
        errs.push(err);
      }
      completed += 1;
      if (completed === arr.length) {
        if(errs.length) return callback(errs);
        callback(null);
      }
      else {
        iterate();
      }
    });
  };
  iterate();
}
