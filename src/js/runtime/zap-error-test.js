var Runtime = require('./runtime.js');
var BrowserLoader = require('./browser-loader.js');

describe('ZapError', function () {
  var rt;

  beforeEach(function () {
    var loader = new BrowserLoader('/base/src/zap');
    rt = new Runtime(loader);
    return rt.start();
  });

  it('produces a correct stack trace', function (done) {
    rt.loadString('(throw "crap")').then(function () {
      done('Should have thrown error');
    }, function (e) {
      expect(e.stack).to.contain('throw');
      done();
    });
  });

});
