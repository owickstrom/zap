var Promise = require('es6-promise').Promise;
var mori = require('mori');
var Var = require('./var.js');
var printString = require('./print-string.js');

function Pkg(name) {
  this.name = name;
  this.vars = mori.hash_map();
}

Pkg.prototype.resolve = function (symbol) {
  if (mori.has_key(this.vars, symbol.name)) {
    return Promise.resolve(mori.get(this.vars, symbol.name));
  } else {
    return Promise.reject(new Error('Failed to resolve symbol ' + printString(symbol)));
  }
}

Pkg.prototype.def = function (symbol, value) {
  var v = new Var(this, symbol.name, value);

  if (symbol.__meta) {
    v = v.withMeta(symbol.__meta);
  }

  this.vars = mori.assoc(this.vars, symbol.name, v);
  return Promise.resolve(v);
}

module.exports = Pkg;
