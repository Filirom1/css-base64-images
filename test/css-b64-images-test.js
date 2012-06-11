var Path = require('path'),
  b64 = require('..');

require('should');

describe('A tricky CSS', function(){
  var cssFile = Path.join(__dirname, 'fixture', 'css', 'style.css'),
    root = Path.join(__dirname, 'fixture');
  it('should be optimized with base64', function(done){
    b64(cssFile, root, function(err, css){
      css.should.include(".single-quote {\n  background: url('data:image/gif;base64,");
      css.should.include(".double-quote {\n  background: url(\"data:image/gif;base64,");
      css.should.include(".absolute {\n  background: url('data:image/gif;base64,");

      css.should.include(".external {\n  background: url('http");
      css.should.include(".tooBig {\n  background: url('../img");
      css.should.include(".not-found {\n  background: url('../img");
      done();
    });
  });
});
