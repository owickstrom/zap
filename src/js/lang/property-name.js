function PropertyName(name) {
  this.name = name;
}

PropertyName.prototype.toString = function () {
  return '.-' + this.name;
};

PropertyName.isInstance = function (other) {
  return !!other && other.constructor === PropertyName;
};

PropertyName.prototype.equals = function (other) {
  if (!PropertyName.isInstance(other)) {
    return false;
  }

  return this.name == other.name;
};

module.exports = PropertyName;
