var mori = require('mori');
var Reader = require('../reader/reader.js');
var Scope = require('./scope.js');
var Symbol = require('../lang/symbol.js');
var Pkg = require('../lang/pkg.js');
var PkgName = require('../lang/pkg-name.js');
var WrappedFn = require('../lang/wrapped-fn.js');
var Loader = require('./loader.js');

var zapCore = PkgName.withSegments('zap', 'core');

function Runtime(base) {
  this.rootScope = new Scope(this);
  this.pkgs = mori.hash_map();
  this.pkg = this.getPkg(zapCore);
  this._loader = new Loader(base);
}

Runtime.prototype.start = function () {
  var self = this;
  //this.require(zapCore);

  return this.def(Symbol.inPkg(zapCore, 'add'), new WrappedFn(function (a, b) {
    return a + b;
  })).then(function () {
    return self;
  });
};

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
  return Promise.resolve(this._qualifiedOrCurrentPkg(symbol).def(symbol, value));
};

Runtime.prototype.resolve = function (symbol) {
 return this._qualifiedOrCurrentPkg(symbol).resolve(symbol);
};

Runtime.prototype.require = function (pkgName) {
  var self = this;
  return this._loader.loadSource(pkgName).then(function (source) {
    self.loadTopLevelFormsString(source);
  }, function (err) {
    return 'Failed to require ' + pkgName.toString() + ': ' + err;
  });
};

Runtime.prototype.eval = function (value) {
  return this.rootScope.eval(value);
};

Runtime.prototype.evalForms = function (forms) {
  var self = this;
  var promises =
    mori.clj_to_js(
      mori.map(forms, function (form) {
    return self.eval(form);
  }));
  return Promise.all(promises);
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
  return this.evalForms(forms);
};

module.exports = Runtime;
