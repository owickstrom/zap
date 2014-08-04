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

  });
});
