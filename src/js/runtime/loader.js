var http = require('../net/http.js');

function Loader(base) {
  this._base = base;
}

Loader.prototype.loadSource = function (pkgName) {
  var self = this;
  var segments = pkgName.segmentsAsArray();
  var relPath = segments.join('/') + '.zap';
  var url = self._base + '/' + relPath;

  return http.get(url).then(function (result) {
    return result.data;
  });
}

module.exports = Loader;
