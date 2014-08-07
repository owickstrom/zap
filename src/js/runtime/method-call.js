var mori = require('mori');

function MethodCall(methodName) {
  this.methodName = methodName;
}

MethodCall.prototype.toString = function () {
  return '(' + this.methodName.toString() + ' ...)';
};

MethodCall.prototype.apply = function (seq) {
  if (mori.count(seq) === 0) {
    throw new Error('Cannot call ' + this.methodName.toString() + ' on nothing');
  }

  var target = mori.first(seq);
  var args = mori.clj_to_js(mori.rest(seq)) || [];
  var fn = target[this.methodName.name];

  return fn.apply(target, args);
};

module.exports = MethodCall;
