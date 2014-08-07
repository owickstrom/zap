var mori = require('mori');

function WrappedFn(f) {
  this._f = f;
}

WrappedFn.prototype.toString = function () {
  return 'Wrapped: ' + this._f.toString();
}

function append(arr, element) {
  return arr.concat([element]);
}

WrappedFn.prototype.apply = function (seq) {
  var args = mori.reduce(append, [], seq);
  return this._f.apply(null, args);
};

module.exports = WrappedFn;
