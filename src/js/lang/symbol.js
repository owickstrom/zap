var equals = require('./equals.js');
var PkgName = require('./pkg-name.js');

function Symbol(name, pkgName) {
  this.name = name;
  this.pkgName = pkgName;
}

Symbol.prototype.toString = function () {
  if (this.pkgName) {
    return this.pkgName.toString() + '/' + this.name;
  } else {
    return this.name;
  }
};

Symbol.prototype.equals = function (other) {
  if (!other || other.constructor !== Symbol) {
    return false;
  }

  var nameEq = this.name === other.name;

  if (!this.pkgName && !other.pkgName) {
    return nameEq;
  }

  if (this.pkgName && other.pkgName) {
    return nameEq && equals(this.pkgName, other.pkgName);
  }

  return false;
};

Symbol.withoutPkg = function (name) {
  return new Symbol(name, null);
};

Symbol.inPkgString = function (name, pkgNameString) {
  return new Symbol(name, PkgName.fromString(pkgNameString));
};

Symbol.inPkg = function (name, pkgName) {
  return new Symbol(name, pkgName);
};

module.exports = Symbol;
