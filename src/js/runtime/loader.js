function Loader(base) {
  this._base = base;
}

Loader.prototype.loadSource = function (pkgName) {
  var self = this;
  var segments = pkgName.segmentsAsArray();
  var relPath = segments.join('/') + '.zap';

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.responseText);
        } else {
          reject(xhr.responseText);
        }
      }
    };
    xhr.open('GET', self._base + '/' + relPath, true);
    xhr.send(null);
  });
}

module.exports = Loader;
