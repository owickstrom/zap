var mori = require('mori');

function WrappedFn(f) {
  this._f = f;
}

WrappedFn.prototype.apply = function (seq) {
  this._f.apply(null, mori.clj_to_js(seq));
};

module.exports = WrappedFn;
