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

module.exports = MethodName;
