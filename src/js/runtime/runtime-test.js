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
      return rt.start();
    });

    function defStr(rt) {
      return rt.def(Symbol.withoutPkg('str'), {
        apply: function (seq) {
          return mori.reduce(function (a, b) {
            return a + b;
          }, '', seq);
        }
      });
    }

    it('evals keywords', function () {
      return rt.loadString(':my-keyword').then(function (keyword) {
        expect(equals(keyword, new Keyword(':my-keyword'))).to.be.true;
      })
    });

    it('defs in current pkg', function () {
      var symbol = Symbol.withoutPkg('my-string');
      return rt.def(symbol, '1').then(function () {
        return rt.resolve(symbol).then(function (v) {
          expect(v.deref()).to.equal('1');
        });
      });
    });

    it('defs in qualified pkg', function () {
      var symbol = Symbol.inPkg('my-string', 'my-pkg');
      return rt.def(symbol, '1').then(function () {
        return rt.resolve(symbol).then(function (v) {
          expect(v.deref()).to.equal('1');
        });
      })
    });

    it('does not resolve non-existing vars', function () {
      var symbol = Symbol.inPkg('my-string', 'my-pkg');
      return rt.resolve(symbol).then(function (v) {
        expect(v).to.be.null;
      });
    });

    it('loads strings', function () {
      var symbol = Symbol.inPkg('my-string', 'my-pkg');
      return rt.def(symbol, '1').then(function () {
        return rt.loadString('my-pkg/my-string').then(function (v) {
          expect(v).to.equal('1');
        });
      })
    });

    it('resolves in current pkg', function () {
      var symbol = Symbol.withoutPkg('my-string');
      return rt.def(symbol, '1').then(function () {
        return rt.loadString('my-string').then(function (v) {
          expect(v).to.equal('1');
        });
      })
    });

    it('returns unevaluated data with quote', function () {
      return rt.loadString('(quote a)').then(function (keyword) {
        expect(equals(keyword, Symbol.withoutPkg('a'))).to.be.true;
      });
    });

    it('evals data structures', function () {
      return rt.def(Symbol.withoutPkg('my-string'), '1').then(function () {
        return rt.loadString('(eval (quote my-string))').then(function (s) {
          expect(s).to.equal('1');
        });
      });
    });

    it('defs vars that can be resolved', function () {
      return rt.loadString('(def my-string "1")').then(function () {
        return rt.resolve(Symbol.withoutPkg('my-string')).then(function (v) {
          expect(v.deref()).to.equal('1');
        });
      });
    });

    it('defs vars that can be derefed', function () {
      return rt.loadString('(def my-string "1")').then(function () {
        return rt.loadString('my-string').then(function (s) {
          expect(s).to.equal('1');
        });
      });
    });

    it('lets local bindings', function () {
      return rt.loadString('(let [a :a] a)').then(function (keyword) {
        expect(equals(keyword, new Keyword(':a'))).to.be.true;
      });
    });

    it('lets local bindings that build on each other', function () {
      return defStr(rt).then(function () {
        return rt.loadString('(let [h "hello" w " world"] (str h w))').then(function (string) {
          expect(string).to.equal('hello world');
        });
      });
    });

    it('evals vectors of local bindings', function () {
      rt.loadString('(let [a :a b :b] [a b])').then(function (vector) {
        var expected = mori.vector(new Keyword(':a'), new Keyword(':b'));
        expect(equals(vector, expected)).to.be.true;
      });
    });

    it('evals maps of local bindings', function () {
      return rt.loadString('(let [a :a b :b] {a a b b})').then(function (map) {
        var expected = mori.hash_map(
          new Keyword(':a'),
          new Keyword(':a'),
          new Keyword(':b'),
          new Keyword(':b'));
        expect(equals(map, expected)).to.be.true;
      });
    });

    it('creates closures with fn', function () {
      return defStr(rt).then(function () {
        return rt.loadString('(def str2 (fn [a b] (str a b)))').then(function () {
          return rt.loadString('(str2 "hello" " world")').then(function (string){
            expect(string).to.equal('hello world');
          });
        });
      });
    });

    it('creates macros with macro');

  });
});
