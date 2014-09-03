var Promise = require('es6-promise').Promise;
var mori = require('mori');

function SpecialForms() {
  this._fns = mori.hash_map();
}

SpecialForms.prototype.add = function (name, fn) {
  this._fns = mori.assoc(this._fns, name, fn);
};

SpecialForms.prototype.has = function (symbol) {
  return !!symbol && mori.has_key(this._fns, symbol.name);
};

SpecialForms.prototype.eval = function (scope, symbol, seq) {
  if (!symbol) {
    return Promise.reject('symbol cannot be ' + symbol);
  }
  if (!seq) {
    return Promise.reject('symbol cannot be ' + seq);
  }

  var fn = mori.get(this._fns, symbol.name);

  if (fn) {
    return Promise.resolve(fn(scope, mori.rest(seq)));
  } else {
    return Promise.reject(symbol.name + ' is not a special form');
  }
};

module.exports = SpecialForms;
