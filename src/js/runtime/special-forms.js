var mori = require('mori');

function SpecialForms() {
  this._fns = mori.hash_map();
}

SpecialForms.prototype.add = function (name, fn) {
  this._fns = mori.assoc(this._fns, name, fn);
};

SpecialForms.prototype.has = function (symbol) {
  return mori.has_key(this._fns, symbol.name);
};

SpecialForms.prototype.eval = function (scope, symbol, seq) {
  if (!symbol) {
    throw new Error('symbol cannot be ' + symbol);
  }
  if (!seq) {
    throw new Error('symbol cannot be ' + seq);
  }

  var fn = mori.get(this._fns, symbol.name);

  if (fn) {
    return fn(scope, mori.rest(seq));
  } else {
    throw new Error(symbol.name + ' is not a special form');
  }
};

module.exports = SpecialForms;
