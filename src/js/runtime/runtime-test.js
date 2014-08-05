var mori = require('mori');
var Runtime = require('./runtime.js');
var equals = require('../lang/equals.js');
var Symbol = require('../lang/symbol.js');
var Keyword = require('../lang/keyword.js');

describe('runtime', function () {
  describe('Runtime', function () {
    var rt;

    beforeEach(function () {
      rt = new Runtime('/base/src/zap');
    });

    function defStr(rt) {
      rt.def(Symbol.withoutPkg('str'), {
        apply: function (seq) {
          return mori.reduce(function (a, b) {
            return a + b;
          }, '', seq);
        }
      });
    }

    it('evals keywords', function () {
      var keyword = rt.loadString(':my-keyword');

      expect(equals(keyword, new Keyword(':my-keyword'))).to.be.true;
    });

    it('defs in current pkg', function () {
      var symbol = Symbol.withoutPkg('my-string');
      rt.def(symbol, '1');

      var v = rt.resolve(symbol);
      expect(v.deref()).to.equal('1');
    });

    it('defs in qualified pkg', function () {
      var symbol = Symbol.inPkg('my-string', 'my-pkg');
      rt.def(symbol, '1');

      var v = rt.resolve(symbol);
      expect(v.deref()).to.equal('1');
    });

    it('does not resolve non-existing vars', function () {
      var symbol = Symbol.inPkg('my-string', 'my-pkg');

      var v = rt.resolve(symbol);
      expect(v).to.be.null;
    });

    it('loads strings', function () {
      var symbol = Symbol.inPkg('my-string', 'my-pkg');

      rt.def(symbol, '1');

      var v = rt.loadString('my-pkg/my-string');
      expect(v).to.equal('1');
    });

    it('resolves in current pkg', function () {
      var symbol = Symbol.withoutPkg('my-string');

      rt.def(symbol, '1');

      var v = rt.loadString('my-string');
      expect(v).to.equal('1');
    });

    it('returns unevaluated data with quote', function () {

      var keyword = rt.loadString('(quote :a)');
      expect(equals(keyword, new Keyword(':a'))).to.be.true;
    });

    it('evals data structures', function () {

      rt.def(Symbol.withoutPkg('my-string'), '1');

      var s = rt.loadString('(eval (quote my-string))');
      expect(s).to.equal('1');
    });

    it('defs vars that can be resolved', function () {

      rt.loadString('(def my-string "1")');
      var v = rt.resolve(Symbol.withoutPkg('my-string'))
      expect(v.deref()).to.equal('1');
    });

    it('defs vars that can be derefed', function () {

      rt.loadString('(def my-string "1")');
      var s = rt.loadString('my-string');
      expect(s).to.equal('1');
    });

    it('lets local bindings', function () {

      var list = rt.loadString('(let [a :a] a)');
      expect(equals(list, new Keyword(':a'))).to.true;
    });

    it('lets local bindings that build on each other', function () {
      defStr(rt);

      var string = rt.loadString('(let [h "hello" w " world"] (str h w))');
      expect(string).to.equal('hello world');
    });

    it('evals vectors of local bindings', function () {

      var vector = rt.loadString('(let [a :a b :b] [a b])');
      var expected = mori.vector(new Keyword(':a'), new Keyword(':b'));
      expect(equals(vector, expected)).to.be.true;
    });

    it('evals maps of local bindings', function () {

      var map = rt.loadString('(let [a :a b :b] {a a b b})');
      var expected = mori.hash_map(
        new Keyword(':a'),
        new Keyword(':a'),
        new Keyword(':b'),
        new Keyword(':b'));
      expect(equals(map, expected)).to.be.true;
    });

    it('creates closures with fn', function () {
      defStr(rt);

      rt.loadString('(def str2 (fn [a b] (str a b)))')

      var string = rt.loadString('(str2 "hello" " world")');
      expect(string).to.equal('hello world');
    });

    it('creates macros with macro');

  });
});
