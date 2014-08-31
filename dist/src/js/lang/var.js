function Var(pkg, name, value) {
  this.pkg = pkg;
  this.name = name;
  this.value = value;
}

Var.prototype.deref = function () {
  return this.value;
};

Var.prototype.withMeta = function (meta) {
  var v = new Var(this.pkg, this.name, this.value);
  v.__meta = meta;
  return v;
};

Var.prototype.toString = function () {
  return '#\'' + this.name;
};

module.exports = Var;
