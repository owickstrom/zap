var Symbol = require('./symbol.js');
var PkgName = require('./pkg-name.js');
var equals = require('./equals.js');

describe('lang', function () {
  describe('Symbol', function () {

    it('checks equality on the name if it has no pkg name', function () {
      var one = Symbol.withoutPkg("hello");
      var another = Symbol.withoutPkg("hello");
      expect(equals(one, another)).to.be.true;
    });

    it('checks equality on the name and pkg name', function () {
      var one = Symbol.inPkg("hello", "pkg");
      var another = Symbol.inPkg("hello", "pkg");
      expect(equals(one, another)).to.be.true;
    });

    it('parses pkg name strings', function () {
      var one = Symbol.inPkgString("hello", "pkg.subpkg");
      var another = Symbol.inPkg("hello", PkgName.withSegments("pkg", "subpkg"));
      console.log(one.toString(), another.toString());
      expect(equals(one, another)).to.be.true;
    });

  });
});
