var Promise = require('es6-promise').Promise;
var mori = require('mori');
var Var = require('./var.js');

function Pkg(name) {
  this.name = name;
  this.vars = mori.hash_map();
}

Pkg.prototype.resolve = function (symbol) {
  return Promise.resolve(mori.get(this.vars, symbol.name));
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
