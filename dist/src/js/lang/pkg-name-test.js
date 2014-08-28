var PkgName = require('./pkg-name.js');
var equals = require('./equals.js');

describe('lang', function () {
  describe('PkgName', function () {

    it('requires at least one segment', function () {
      expect(function () {
        PkgName.withSegments();
      }).to.throw();
    });

    it('requires non-blank segments ', function () {
      expect(function () {
        PkgName.withSegments("");
      }).to.throw();
    });

    it('rejects segments starting with a digit', function () {
      expect(function () {
        PkgName.withSegments("1ab");
      }).to.throw();
    });

    it('accepts valid segments', function () {
      PkgName.withSegments("abc-123", "_____a");
    });

    it('equals when segments equals', function () {
      var one = PkgName.withSegments('hello', 'world');
      var another = PkgName.withSegments('hello', 'world');
      expect(equals(one, another)).to.be.true;
    });

    it('does not equal when segments differ', function () {
      var one = PkgName.withSegments('hello', 'world');
      var another = PkgName.withSegments('hello', 'world', 'two');
      expect(equals(one, another)).to.be.false;
    });

    it('parses pkg name strings', function () {
      var one = PkgName.fromString('hello.world');
      var another = PkgName.withSegments('hello', 'world');
      expect(equals(one, another)).to.be.true;
    });


  });
});
