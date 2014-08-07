var mori = require('mori');

function WrappedFn(f) {
  this._f = f;
}

WrappedFn.prototype.toString = function () {
  return 'Wrapped: ' + this._f.toString();
}

WrappedFn.prototype.apply = function (seq) {
  return this._f.apply(null, mori.clj_to_js(seq));
};

module.exports = WrappedFn;
