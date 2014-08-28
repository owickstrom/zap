var mori = require('mori');
var Runtime = require('./runtime.js');
var BrowserLoader = require('./browser-loader.js');
var equals = require('../lang/equals.js');
var printString = require('../lang/print-string.js');
var Symbol = require('../lang/symbol.js');
var keyword = require('../lang/keyword.js');

describe('runtime', function () {
  describe('predefs', function () {
    var rt;

    beforeEach(function () {
      var loader = new BrowserLoader('/base/src/zap');
      rt = new Runtime(loader);
      return rt.start();
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
        var expected = mori.hash_map(keyword.fromString(':doc'), 'Stuff');
        expect(equals(stuff.__meta, expected)).to.be.true;
      });
    });

    it('retrieves metadata added to collections', function () {
      return rt.loadString('(def stuff (with-meta {:doc "Stuff"} [:my :stuff]))').then(function () {
        return rt.loadString('(meta stuff)').then(function (meta) {
          var expected = mori.hash_map(keyword.fromString(':doc'), 'Stuff');
          expect(equals(meta, expected)).to.be.true;
        });
      });
    });

    it('adds metadata to fns', function () {
      return rt.loadString('(with-meta {:doc "Stuff"} (fn [a] a))').then(function (fn) {
        var expected = mori.hash_map(keyword.fromString(':doc'), 'Stuff');
        expect(equals(fn.__meta, expected)).to.be.true;
      });
    });

    it('looks up docs', function () {
      return rt.loadString('(def (symbol-with-meta {:doc "Stuff"} stuff) [:my :stuff])').then(function () {
        return rt.loadString('(doc stuff)').then(function (doc) {
          expect(doc).to.equal('Stuff');
        });
      });
    });

    it('sets object properties with aset', function () {
      var symbol = Symbol.withoutPkg('my-obj');
      return rt.def(symbol, {}).then(function () {
        return rt.loadString('(aset my-obj "test" "hello")').then(function () {
          return rt.loadString('my-obj').then(function (myObj) {
            expect(myObj.test).to.equal('hello');
          });
        });
      });
    });

  });
});
