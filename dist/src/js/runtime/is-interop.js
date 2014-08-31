var PkgName = require('../lang/pkg-name.js');

var jsPkgName = PkgName.withSegments('js');

module.exports = function isInterop(symbol) {
  if (!!symbol.pkgName && typeof symbol.pkgName.equals === 'function') {
    return symbol.pkgName.equals(jsPkgName);
  } else {
    return false;
  }
};
