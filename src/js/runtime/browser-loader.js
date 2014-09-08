var http = require('../net/http.js');

function BrowserLoader(base) {
  this._base = base;
}

BrowserLoader.prototype.readZapSource = function (pkgName) {
  var self = this;
  var segments = pkgName.segmentsAsArray();
  var relPath = segments.join('/') + '.zap';
  var url = self._base + '/' + relPath;

  return this.readFile(url);
};

BrowserLoader.prototype.readFile = function (url) {
  return http.get(url).then(function (result) {
    return {
      contents: result.data,
      file: url
    };
  });
};

module.exports = BrowserLoader;
