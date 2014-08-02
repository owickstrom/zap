var equals = require('./equals.js');

function List(value, rest) {
  this._value = value;
  this._rest = rest;
}

List.prototype.first = function () {
  return this._value;
};

List.prototype.rest = function () {
  return this._rest;
};

List.prototype.cons = function (value) {
  return new List(value, this);
};

List.prototype.equals = function (other) {
  if (other === null || other === undefined) {
    return false;
  }

  var firstEquals = equals(this.first(), other.first());

  if (!firstEquals) {
    return false;
  }

  return firstEquals && equals(this.rest(), other.rest());
};

List.empty = new List(null, null);

List.of = function () {
  var list = List.empty;
  var args = Array.prototype.slice.call(arguments, 0);

  for (var i = args.length - 1; i >= 0; i--) {
    list = list.cons(args[i]);
  }

  return list;
};

module.exports = List;
