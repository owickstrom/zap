var mori = require('mori');
var keyword = require('./keyword.js');
var equals = require('./equals.js');
var printString = require('./print-string.js');

describe('lang', function () {
  describe('keyword', function () {

    it('equals', function () {
      var one = keyword.fromString(':hello');
      var another = keyword.fromString(':hello');
      expect(equals(one, another)).to.be.true;
    });

    it('reports isInstance', function () {
      var kw = keyword.fromString(':hello');
      expect(keyword.isInstance(kw)).to.be.true;
    });

    it('can be represented as a string', function () {
      var kw = keyword.fromString(':hello');
      expect(kw.toString()).to.equal(':hello');
    });

    it('can be used with print-string', function () {
      var kw = keyword.fromString(':hello');
      expect(printString(kw)).to.equal(':hello');
    });

    it('looks up itself in maps', function () {
      var kw = keyword.fromString(':hello');
      var map = mori.hash_map(kw, 123);
      kw.apply(null, map).then(function (r) {
        expect(r).to.equal(123);
      });
    });

    it('returns nil when applied to a non-map object', function () {
      var kw = keyword.fromString(':hello');
      return kw.apply(null, 'hej').then(function (r) {
        return expect(r).to.be.null;
      });
    });

  });
});
