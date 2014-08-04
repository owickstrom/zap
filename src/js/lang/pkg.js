var mori = require('mori');
var Var = require('./var.js');

function Pkg(name) {
  this.name = name;
  this.vars = mori.hash_map();
}

Pkg.prototype.resolve = function (symbol) {
  return mori.get(this.vars, symbol.name);
}

Pkg.prototype.def = function (symbol, value) {
  var v = new Var(this, symbol.name, value);
  this.vars = mori.assoc(this.vars, symbol.name, v);
}

module.exports = Pkg;
