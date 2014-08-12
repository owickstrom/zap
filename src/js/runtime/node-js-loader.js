var Promise = require('es6-promise').Promise;
var fs = require('fs');
var path = require('path');

function NodeJSLoader() {
}

NodeJSLoader.prototype.readZapSource = function (pkgName) {
  var base = __dirname;

  var segments = pkgName.segmentsAsArray();
  var fileName = segments[segments.length - 1] + '.zap';
  var parts = [base]
    .concat(segments.slice(0, segments.length - 1))
    .concat([fileName]);
  var p = path.join.apply(null, parts);

  return this.readFile(p);
};

NodeJSLoader.prototype.readFile = function (p) {
  var self = this;
  return new Promise(function (resolve, reject) {
    fs.readFile(p, 'utf-8', function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

module.exports = NodeJSLoader;
