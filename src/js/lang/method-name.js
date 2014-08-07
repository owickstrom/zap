function MethodName(name) {
  this.name = name;
}

MethodName.prototype.toString = function () {
  return '.' + this.name;
};

MethodName.isInstance = function (other) {
  return !!other && other.constructor === MethodName;
};

MethodName.prototype.equals = function (other) {
  if (!MethodName.isInstance(other)) {
    return false;
  }

  return this.name == other.name;
};

MethodName.fromStringWithDot = function (s) {
  if (!s || s.length === 0) {
    throw new Error('Invalid method name: ' + s);
  }
  if (s[0] === '.') {
    s = s.slice(1);
  }
  return new MethodName(s);
};

module.exports = MethodName;
