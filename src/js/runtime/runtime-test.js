var mori = require('mori');
var Runtime = require('./runtime.js');
var equals = require('../lang/equals.js');
var printString = require('../lang/print-string.js');
var Symbol = require('../lang/symbol.js');
var Keyword = require('../lang/keyword.js');
var PkgName = require('../lang/pkg-name.js');

describe('runtime', function () {
  describe('Runtime', function () {
    var rt;

    beforeEach(function () {
      rt = new Runtime('/base/src/zap');
      return rt.start();
    });

    it('evals forms', function () {
      var forms = mori.list('[]', '[]', '[]');
      return rt.evalForms(forms).then(function (evaled) {
        expect(mori.count(evaled)).to.equal(3);
      });
    });

    it('loads forms', function () {
      var forms = '(quote [])\n(quote [])';
      return rt.loadTopLevelFormsString(forms).then(function (evaled) {
        expect(mori.count(evaled)).to.equal(2);
      });
    });

    it('requires pkgs', function () {
      var core = PkgName.withSegments('zap', 'core');
      return rt.require(core).then(function (required) {
        return rt.resolve(Symbol.inPkg('+', core)).then(function (addVar) {
          expect(addVar.deref().apply(mori.list(1, 2))).to.equal(3);
        });
      });
    });

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

    it.skip('looks up keywords in maps', function () {
      return rt.loadString('(:hey {:hey "hey"})').then(function (r) {
        expect(r).to.equal('hey');
      });
    });

    it('returns properties from Javascript objects', function () {
      return rt.loadString('(.-length "hello")').then(function (l) {
        expect(l).to.equal(5);
      });
    });

    it('returns properties from Javascript objects in fns', function () {
      return rt.loadString('(fn [v] (.-__meta v))').then(function (meta) {
        return rt.loadString('(with-meta {:doc "hej"} [:yo])').then(function (yo) {
          return meta.apply(mori.list(yo)).then(function (r) {
            //console.log(printString(yo.meta, meta, r));
            expect(mori.is_map(r)).to.be.true;
          });
        });
      });
    });

    it('returns underscored properties from Javascript objects in fns', function () {
      var symbol = Symbol.withoutPkg('value');
      var value = {
        __prop: 1
      };
      return rt.def(symbol, value).then(function () {
        return rt.loadString('((fn [v] (.-__prop v)) value)').then(function (v) {
          expect(v).to.equal(1);
        });
      });
    });

    it('calls methods without arguments on Javascript objects', function () {
      return rt.loadString('(.toUpperCase "hello")').then(function (s) {
        expect(s).to.equal("HELLO");
      });
    });

    it('calls methods with arguments on Javascript objects', function () {
      return rt.loadString('(.indexOf "hello" "h")').then(function (index) {
        expect(index).to.equal(0);
      });
    });

    it('lets local bindings', function () {
      return rt.loadString('(let [a :a] a)').then(function (keyword) {
        expect(equals(keyword, new Keyword(':a'))).to.be.true;
      });
    });

    it('lets local bindings that build on each other', function () {
        return rt.loadString('(let [h "hello" w " world"] (str h w))').then(function (string) {
          expect(string).to.equal('hello world');
        });
    });

    it('evals vectors of local bindings', function () {
      return rt.loadString('(let [a :a b :b] [a b])').then(function (vector) {
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
        return rt.loadString('(def shout (fn [a b] (str a "!")))').then(function () {
          return rt.loadString('(shout "hello")').then(function (string){
            expect(string).to.equal('hello!');
          });
        });
    });

    it('creates macros with macro');

    it('chains returned promises from functions', function () {
      return rt.loadString('(let [response (zap.http/get "/base/src/zap/zap/core.zap")' +
                                  'prefixed (str "!" response)] prefixed)').then(function (string) {
        expect(string.slice(0, 5)).to.equal('!(def');
      });
    });

    it('adds', function () {
      var symbol = Symbol.withoutPkg('some-number');
      return rt.def(symbol, 4).then(function () {
        return rt.loadString('(+ some-number some-number)').then(function (s) {
          expect(s).to.equal(8);
        });
      });
    });

    it('subtracts', function () {
      var symbol = Symbol.withoutPkg('some-number');
      return rt.def(symbol, 5345).then(function () {
        return rt.loadString('(- some-number some-number)').then(function (s) {
          expect(s).to.equal(0);
        });
      });
    });

    it('multiplies', function () {
      var symbol = Symbol.withoutPkg('some-number');
      return rt.def(symbol, 3).then(function () {
        return rt.loadString('(* some-number some-number)').then(function (s) {
          expect(s).to.equal(9);
        });
      });
    });

    it('divides', function () {
      var symbol = Symbol.withoutPkg('some-number');
      return rt.def(symbol, 4).then(function () {
        return rt.loadString('(/ some-number some-number)').then(function (s) {
          expect(s).to.equal(1);
        });
      });
    });

    it('does equals', function () {
      return rt.loadString('(= :a :a)').then(function (r) {
        expect(r).to.equal(true);
      });
    });

    it('does equals on vectors', function () {
      return rt.loadString('(= [:a] [:a])').then(function (r) {
        expect(r).to.equal(true);
      });
    });

    it('does equals on stuff that is not equal', function () {
      return rt.loadString('(= :a :b)').then(function (r) {
        expect(r).to.equal(false);
      });
    });

    it('compares less than', function () {
      return rt.loadString('(< "a" "b")').then(function (r) {
        expect(r).to.equal(true);
      });
    });

    it('compares less than or equals', function () {
      return rt.loadString('(<= "a" "a")').then(function (r) {
        expect(r).to.equal(true);
      });
    });

    it('compares greater than', function () {
      return rt.loadString('(> "b" "a")').then(function (r) {
        expect(r).to.equal(true);
      });
    });

    it('compares greater than or equals', function () {
      return rt.loadString('(>= "a" "a")').then(function (r) {
        expect(r).to.equal(true);
      });
    });

    it('prints strings', function () {
      return rt.loadString('(print-string "a")').then(function (r) {
        expect(r).to.equal('"a"');
      });
    });

    it('prints true', function () {
      return rt.loadString('(print-string true)').then(function (r) {
        expect(r).to.equal('true');
      });
    });

    it('prints false', function () {
      return rt.loadString('(print-string false)').then(function (r) {
        expect(r).to.equal('false');
      });
    });

    it('prints vectors of keywords', function () {
      return rt.loadString('(print-string [:hello :world])').then(function (r) {
        expect(r).to.equal('[:hello :world]');
      });
    });

    it('prints maps of keywords and strings', function () {
      return rt.loadString('(print-string {:hello "hello" :world "world"})').then(function (r) {
        expect(r).to.equal('{:hello "hello" :world "world"}');
      });
    });

    it('prints lists of keywords', function () {
      return rt.loadString('(print-string (quote (:hello :world)))').then(function (r) {
        expect(r).to.equal('(:hello :world)');
      });
    });

    it('adds metadata to collections', function () {
      return rt.loadString('(with-meta {:doc "Stuff"} [:my :stuff])').then(function (stuff) {
        var expected = mori.hash_map(new Keyword(':doc'), 'Stuff');
        expect(equals(stuff.__meta, expected)).to.be.true;
      });
    });

    it('retrieves metadata added to collections', function () {
      return rt.loadString('(def stuff (with-meta {:doc "Stuff"} [:my :stuff]))').then(function () {
        return rt.loadString('(meta stuff)').then(function (meta) {
          var expected = mori.hash_map(new Keyword(':doc'), 'Stuff');
          expect(equals(meta, expected)).to.be.true;
        });
      });
    });

    describe('if', function () {

      it('returns the first expression if true', function () {
        return rt.loadString('(if true "a" "b")').then(function (r) {
          expect(r).to.equal('a');
        });
      });

      it('returns the second expression if false', function () {
        return rt.loadString('(if false "a" "b")').then(function (r) {
          expect(r).to.equal('b');
        });
      });

      it('returns nil if false and no second expression', function () {
        return rt.loadString('(if false "a")').then(function (r) {
          expect(r).to.equal(null);
        });
      });

    });

  });
});
