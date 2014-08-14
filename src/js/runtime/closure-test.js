var Promise = require('es6-promise').Promise;
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

    function lastOfArgsExpressions() {
      var a = Symbol.withoutPkg('a');
      var b = Symbol.withoutPkg('b');
      return mori.list(mori.list(mori.vector(a), a), mori.list(mori.vector(a, b), b));
    }

    it('is a normal Javascript function', function () {
      var c = closure.create(rt.rootScope, identityExpressions());

      return c('test').then(function (r) {
        expect(r).to.equal('test');
      });
    });

    it('supports arity overloading with one and two args', function () {
      var c = closure.create(rt.rootScope, lastOfArgsExpressions());

      var first = c('test').then(function (r) {
        expect(r).to.equal('test');
      });
      var second = c('test', 'test2').then(function (r) {
        expect(r).to.equal('test2');
      });

      return Promise.all([first, second]);
    });

    it('can be variadic');

  });
});
