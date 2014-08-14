var mori = require('mori');
var printString = require('../lang/print-string.js');

function create(methodName) {
  var fn = function (target) {
    if (!target) {
      throw new Error('Cannot call ' + printString(methodName) + ' on ' + target);
    }

    var args = Array.prototype.slice.call(arguments, 1);
    var method = target[methodName.name];

    return method.apply(target, args);
  };

  fn.toString = function () {
    return '(' + printString(methodName) + ' ...)';
  };

  return fn;
}

module.exports = {
  create: create
};
