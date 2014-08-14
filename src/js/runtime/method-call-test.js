var mori = require('mori');
var methodCall = require('./method-call.js');
var MethodName = require('../lang/method-name.js');

describe('runtime', function () {
  describe('MethodCall', function () {

    it('calls with no arguments', function () {
      var mc = methodCall.create(new MethodName('toUpperCase'));
      var result = mc('hello');
      expect(result).to.equal('HELLO');
    });

    it('calls with one argument', function () {
      var mc = methodCall.create(new MethodName('join'));
      var result = mc([1, 2, 3], ' ');
      expect(result).to.equal('1 2 3');
    });

  });
});
