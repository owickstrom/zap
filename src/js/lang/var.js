function Var(pkg, name, value) {
  this.pkg = pkg;
  this.name = name;
  this.value = value;
}

Var.prototype.deref = function () {
  return this.value;
};

Var.prototype.toString = function () {
  return '#\'' + this.name;
};

module.exports = Var;
