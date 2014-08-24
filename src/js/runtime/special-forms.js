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
  var self = this;
  return new Promise(function (resolve, reject) {
    if (!symbol) {
      return reject('symbol cannot be ' + symbol);
    }
    if (!seq) {
      return reject('symbol cannot be ' + seq);
    }

    var fn = mori.get(self._fns, symbol.name);

    if (fn) {
      return resolve(fn(scope, mori.rest(seq)));
    } else {
      return reject(symbol.name + ' is not a special form');
    }
  })
};

module.exports = SpecialForms;
