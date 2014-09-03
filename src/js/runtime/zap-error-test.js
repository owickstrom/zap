var Runtime = require('./runtime.js');
var BrowserLoader = require('./browser-loader.js');

describe('ZapError', function () {
  var rt;

  beforeEach(function () {
    var loader = new BrowserLoader('/base/src/zap');
    rt = new Runtime(loader);
    return rt.start();
  });

  it('produces a correct stack trace', function () {
    rt.loadString('(throw "crap")').then(function () {
      throw new Error('Should have thrown error');
    }, function (e) {
      expect(e.stack).to.contain('user');
    });
  });

  it.only('whatevs', function () {
    function test() {

    }
    function test2() {

    }
    //var st = [
      //new ZapCallSite(test, 'my-file.zap', 10, 13),
      //new ZapCallSite(test2, 'my-file.zap', 10, 13)
    //];
    //console.log(Error.prepareStackTrace);
    //var stack = Error.prepareStackTrace(new Error(), st);

    var printStackTrace = require('stacktrace-js');
    console.log(printStackTrace({ e: new Error() })[0]);

    var e = new Error('Cannot do this and that...');
    var custom = '    at zap.core/defmacro (http://localhost:9876/base/src/zap/zap/core.zap:29:19)';

    //var st = printStackTrace({ e: e });
    //st = [custom].concat(st);
    //e.stack = '    ' + st.join('\n    ');

    var lines = e.stack.split('\n');

    lines = [lines[0], custom].concat(lines.slice(1));

    e.stack = lines.join('\n');

    throw e;
  });

});
