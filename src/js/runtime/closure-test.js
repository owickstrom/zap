var Promise = require('es6-promise').Promise;
var mori = require('mori');
var Runtime = require('./runtime.js');
var BrowserLoader = require('./browser-loader.js');
var closure = require('./closure.js');
var Symbol = require('../lang/symbol.js');
var equals = require('../lang/equals.js');

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

    var ampersand = Symbol.withoutPkg('&');

    function restExpressions() {
      var a = Symbol.withoutPkg('a');
      var b = Symbol.withoutPkg('b');
      return mori.list(mori.vector(a, ampersand, b), b);
    }

    function identityAndRestExpressions() {
      var a = Symbol.withoutPkg('a');
      var b = Symbol.withoutPkg('b');
      var single = mori.list(mori.vector(a), a);
      var variadic = mori.list(mori.vector(a, ampersand, b), b);
      return mori.list(single, variadic);
    }

    function emptyAndAllExpressions() {
      var a = Symbol.withoutPkg('a');
      var b = Symbol.withoutPkg('b');
      var empty = mori.list(mori.vector(), '');
      var variadic = mori.list(mori.vector(ampersand, b), b);
      return mori.list(empty, variadic);
    }

    function expressionsWithMultipleSymbolsAfterAmpersand() {
      var a = Symbol.withoutPkg('a');
      var b = Symbol.withoutPkg('b');
      return mori.list(mori.vector(ampersand, a, b), b);
    }

    function expressionsWithMoreFixedArgsThanVariadic() {
      var a = Symbol.withoutPkg('a');
      var b = Symbol.withoutPkg('b');
      var fixed = mori.list(mori.vector(a, b), b);
      var variadic = mori.list(mori.vector(ampersand, b), b);
      return mori.list(fixed, variadic);
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

    it('can be variadic', function () {
      var c = closure.create(rt.rootScope, restExpressions());

      return c('single', 'in-rest').then(function (r) {
        expect(equals(r, mori.vector('in-rest'))).to.be.true;
      });
    });

    it('can be variadic and overloaded', function () {
      var c = closure.create(rt.rootScope, identityAndRestExpressions());

      var first = c('single').then(function (r) {
        expect(equals(r, 'single')).to.be.true;
      });
      var second = c('single', 'in-rest', 'also-in-rest').then(function (r) {
        expect(equals(r, mori.vector('in-rest', 'also-in-rest'))).to.be.true;
      });

      return Promise.all([first, second]);
    });

    it('can have an empty and a "catch all" variadic overload', function () {
      var c = closure.create(rt.rootScope, emptyAndAllExpressions());

      var first = c().then(function (r) {
        expect(r).to.equal('');
      });
      var second = c('a', 'b', 'c').then(function (r) {
        expect(equals(r, mori.vector('a', 'b', 'c'))).to.be.true;
      });

      return Promise.all([first, second]);
    });

    it('can take 0 params for the variadic argument', function () {
      var c = closure.create(rt.rootScope, restExpressions());

      return c('single').then(function (r) {
        expect(mori.is_empty(r)).to.be.true;
      });
    });

    it('rejects vectors with multiple symbols after ampersand', function () {
      expect(function () {
        closure.create(rt.rootScope, expressionsWithMultipleSymbolsAfterAmpersand());
      }).throws();
    });

    it('rejects fixed arity overloads with more arguments than the variadic overload', function () {
      expect(function () {
        closure.create(rt.rootScope, expressionsWithMoreFixedArgsThanVariadic());
      }).throws();
    });

    it('can be recursive', function () {
      return rt.loadString('(def doall (fn [v] (if (empty? v) nil (doall (rest v)))))').then(function () {
        return rt.loadString('(doall ["hey" "ya"])').then(function (s) {
          expect(s).to.be.null;
        });
      });
    });

    it('can be recursive and variadic', function () {
      return rt.loadString('(def doall (fn ([] nil) ([& v] (apply doall (rest v)))))').then(function () {
        return rt.loadString('(doall "hey" "ya")').then(function (s) {
          expect(s).to.be.null;
        });
      });
    });

    it('can be a variadic macro', function () {
      return rt.loadString('(def infix (macro [o m & args] (cons m (cons o args))))').then(function (infix) {
        return rt.loadString('(infix js/Number .parseInt "1")').then(function (n) {
          expect(n).to.equal(1);
        });
      });
    });

    it('can be a variadic overloaded macro', function () {
      return rt.loadString('(def infix (macro ([] nil) ([o m & args] (cons m (cons o args)))))').then(function () {
        var int = rt.loadString('(infix js/Number .parseInt "1")');
        var nil = rt.loadString('(infix)')
        return Promise.all([int, nil]).then(function (vals) {
          expect(vals[0]).to.equal(1);
          expect(vals[1]).to.be.null;
        });
      });
    });

  });
});
