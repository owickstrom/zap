var isInterop = require('./is-interop.js');
var Symbol = require('../lang/symbol.js');

describe('runtime', function () {
  describe('isInterop', function () {

    it('returns false when pkg name is empty', function () {
      var s = Symbol.withoutPkg('hello');
      expect(isInterop(s)).to.be.false;
    });

    it('returns false when pkg name is not js', function () {
      var s = Symbol.inPkgString('hello', 'not-js');
      expect(isInterop(s)).to.be.false;
    });

    it('returns true when pkg name is js', function () {
      var s = Symbol.inPkgString('hello', 'js');
      expect(isInterop(s)).to.be.true;
    });

  });
});
