var mori = require('mori');
var Runtime = require('./runtime.js');
var equals = require('../lang/equals.js');
var Symbol = require('../lang/symbol.js');
var Keyword = require('../lang/keyword.js');

describe('runtime', function () {
  describe('Runtime', function () {

    it('evals keywords', function () {
      var rt = new Runtime();
      var keyword = rt.loadString(':my-keyword');

      expect(equals(keyword, new Keyword(':my-keyword'))).to.be.true;
    });

    it('defs in current pkg', function () {
      var rt = new Runtime();
      var symbol = Symbol.withoutPkg('my-string');
      rt.def(symbol, '1');

      var v = rt.resolve(symbol);
      expect(v.deref()).to.equal('1');
    });

    it('defs in qualified pkg', function () {
      var rt = new Runtime();
      var symbol = Symbol.inPkg('my-string', 'my-pkg');
      rt.def(symbol, '1');

      var v = rt.resolve(symbol);
      expect(v.deref()).to.equal('1');
    });

    it('does not resolve non-existing vars', function () {
      var rt = new Runtime();
      var symbol = Symbol.inPkg('my-string', 'my-pkg');

      var v = rt.resolve(symbol);
      expect(v).to.be.null;
    });

    it('loads strings', function () {
      var rt = new Runtime();
      var symbol = Symbol.inPkg('my-string', 'my-pkg');

      rt.def(symbol, '1');

      var v = rt.loadString('my-pkg/my-string');
      expect(v).to.equal('1');
    });

    it('resolves in current pkg', function () {
      var rt = new Runtime();
      var symbol = Symbol.withoutPkg('my-string');

      rt.def(symbol, '1');

      var v = rt.loadString('my-string');
      expect(v).to.equal('1');
    });

    it('returns unevaluated data with quote', function () {
      var rt = new Runtime();

      var keyword = rt.loadString('(quote :a)');
      expect(equals(keyword, new Keyword(':a'))).to.be.true;
    });

    it('evals data structures', function () {
      var rt = new Runtime();

      rt.def(Symbol.withoutPkg('my-string'), '1');

      var s = rt.loadString('(eval (quote my-string))');
      expect(s).to.equal('1');
    });

    it('defs vars that can be resolved', function () {
      var rt = new Runtime();

      rt.loadString('(def my-string "1")');
      var v = rt.resolve(Symbol.withoutPkg('my-string'))
      expect(v.deref()).to.equal('1');
    });

    it('defs vars that can be derefed', function () {
      var rt = new Runtime();

      rt.loadString('(def my-string "1")');
      var s = rt.loadString('my-string');
      expect(s).to.equal('1');
    });

    it('lets local bindings', function () {
      var rt = new Runtime();

      var list = rt.loadString('(let [a :a] a)');
      expect(equals(list, new Keyword(':a'))).to.true;
    });

  });
});