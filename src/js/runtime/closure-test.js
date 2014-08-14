var mori = require('mori');
var Runtime = require('./runtime.js');
var BrowserLoader = require('./browser-loader.js');
var closure = require('./closure.js');
var Symbol = require('../lang/symbol.js');

describe('runtime', function () {
  describe('Closure', function () {

    var rt;

    beforeEach(function () {
      var loader = new BrowserLoader('/base/src/zap');
      rt = new Runtime(loader);
      return rt.start();
    });

    function identityExpressions() {
      var a = Symbol.withoutPkg('a');
      return mori.list(mori.vector(a), a);
    }

    it('is a normal Javascript function', function () {
      var c = closure.create(rt.rootScope, identityExpressions());

      return c('test').then(function (r) {
        expect(r).to.equal('test');
      });
    });
  });
});
