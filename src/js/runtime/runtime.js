var mori = require('mori');
var Reader = require('../reader/reader.js');
var Scope = require('./scope.js');
var Pkg = require('../lang/pkg.js');
var PkgName = require('../lang/pkg-name.js');

function Runtime() {
  this.rootScope = new Scope(this);
  this.pkgs = mori.hash_map();
  this.pkg = this.getPkg(PkgName.withSegments('user'));
}

Runtime.prototype.currentPkg = function () {
  return this.pkg;
};

Runtime.prototype.getPkg = function (name) {
  var str = name.toString();
  var pkg = mori.get(this.pkgs, str);

  if (!pkg) {
    pkg = new Pkg(name);
    this.pkgs = mori.assoc(this.pkgs, str, pkg);
  }

  return pkg;
};

Runtime.prototype._qualifiedOrCurrentPkg = function (symbol) {
  return !!symbol.pkgName ? this.getPkg(symbol.pkgName) : this.currentPkg();
};

Runtime.prototype.def = function (symbol, value) {
  this._qualifiedOrCurrentPkg(symbol).def(symbol, value);
};

Runtime.prototype.resolve = function (symbol) {
 return  this._qualifiedOrCurrentPkg(symbol).resolve(symbol);
};

Runtime.prototype.eval = function (value) {
  return this.rootScope.eval(value);
};

Runtime.prototype.evalForms = function (forms) {
  forms = mori.seq(forms);
  mori.each(forms, this.eval.bind(this));
};

Runtime.prototype.loadString = function (s) {
  var value = Reader.readString(s);
  return this.eval(value);
};

module.exports = Runtime;
