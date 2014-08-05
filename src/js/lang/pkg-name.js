var mori = require('mori');

function PkgName(segments) {
  this.segments = mori.seq(segments);

  if (!validateSegments(this.segments)) {
    throw new Error('Invalid pkg name segments: ' + this.segments.toString());
  }
}

function validateSegments(segments) {
  return mori.count(segments) > 0 && mori.every(validateSegment, segments);
}

function validateSegment(segment) {
  return /^[a-zA-Z_-][\w\d_-]*$/.test(segment);
}

function joinWithDot(a, b) {
  return a + '.' + b;
}

PkgName.prototype.equals = function (other) {
  if (!other || other.constructor !== PkgName) {
    return false;
  }

  return mori.equals(this.segments, other.segments);
};

PkgName.prototype.segmentsAsArray = function () {
  return mori.clj_to_js(this.segments);
}

PkgName.prototype.toString = function () {
  return mori.reduce(joinWithDot, this.segments);
}

PkgName.withSegments = function () {
  var segments = Array.prototype.slice.apply(arguments);
  return new PkgName(segments);
}

PkgName.fromString = function (pkgNameString) {
  return new PkgName(pkgNameString.split('.'));
}

module.exports = PkgName;


