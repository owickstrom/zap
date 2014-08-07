var mori = require('mori');
var MethodCall = require('./method-call.js');
var MethodName = require('../lang/method-name.js');

describe('runtime', function () {
  describe('MethodCall', function () {

    it('calls with no arguments', function () {
      var mc = new MethodCall(new MethodName('toUpperCase'));
      var result = mc.apply(mori.list('hello'));
      expect(result).to.equal('HELLO');
    });

    it('calls with one argument', function () {
      var mc = new MethodCall(new MethodName('join'));
      var result = mc.apply(mori.list([1, 2, 3], ' '));
      expect(result).to.equal('1 2 3');
    });

  });
});
