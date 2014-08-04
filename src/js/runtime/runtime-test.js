var mori = require('mori');
var Runtime = require('./runtime.js');
var Symbol = require('../lang/symbol.js');

describe('runtime', function () {
  describe('Runtime', function () {

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

      var list = rt.loadString('(quote (:a :list))');
      expect(mori.is_list(list)).to.be.true;
    });

    it('evals data structures', function () {
      var rt = new Runtime();

      rt.def(Symbol.withoutPkg('my-string'), '1');

      var s = rt.loadString('(eval (quote my-string))');
      expect(s).to.equal('1');
    });

    it('defs as a special form', function () {
      var rt = new Runtime();

      rt.loadString('(def my-string "1")');
      var s = rt.loadString('my-string');
      expect(s).to.equal('1');
    });

  });
});
