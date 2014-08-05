var mori = require('mori');
var Reader = require('../reader/reader.js');
var Scope = require('./scope.js');
var Symbol = require('../lang/symbol.js');
var Pkg = require('../lang/pkg.js');
var PkgName = require('../lang/pkg-name.js');
var WrappedFn = require('../lang/wrapped-fn.js');
var Loader = require('./loader.js');

function Runtime(base) {
  this.rootScope = new Scope(this);
  this.pkgs = mori.hash_map();
  this.pkg = this.getPkg(PkgName.withSegments('user'));
  this._loader = new Loader(base);

  var zapCore = PkgName.withSegments('zap', 'core');
  this.require(zapCore);

  this.def(Symbol.inPkg(zapCore, 'add'), new WrappedFn(function (a, b) {
    return a + b;
  }));
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

Runtime.prototype.require = function (pkgName) {
  return this._loader.loadSource(pkgName).then(function (source) {
    this.loadTopLevelFormsString(source);
  }, function (err) {
    console.error(err);
  });
};

Runtime.prototype.eval = function (value) {
  return this.rootScope.eval(value);
};

Runtime.prototype.evalForms = function (forms) {
  var self = this;
  forms = mori.seq(forms);
  mori.each(forms, function (form) {
    self.eval(form);
  });
};

Runtime.prototype.loadString = function (s) {
  var value = Reader.readString(s);
  return this.eval(value);
};

Runtime.prototype.loadTopLevelFormsString = function (s) {
  var forms = Reader.readTopLevelFormsString(s);
  return this.evalForms(forms);
};

Runtime.prototype.loadTopLevelFormsString = function (s) {
  var self = this;
  var forms = Reader.readTopLevelFormsString(s);
  mori.each(function (form) { self.eval(form); }, forms);
};

module.exports = Runtime;
