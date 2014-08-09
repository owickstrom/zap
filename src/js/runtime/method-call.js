var mori = require('mori');
var printString = require('../lang/print-string.js');

function MethodCall(methodName) {
  this.methodName = methodName;
}

MethodCall.prototype.toString = function () {
  return '(' + printString(this.methodName) + ' ...)';
};

MethodCall.prototype.apply = function (seq) {
  if (mori.count(seq) === 0) {
    throw new Error('Cannot call ' + printString(this.methodName) + ' on nothing');
  }

  var target = mori.first(seq);
  var args = mori.clj_to_js(mori.rest(seq)) || [];
  var fn = target[this.methodName.name];

  return fn.apply(target, args);
};

module.exports = MethodCall;
