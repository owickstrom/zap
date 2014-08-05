var m = require('mori');

function Closure(scope, expressions) {
  this._scope = scope;
  this._args = m.first(expressions);
  this._body = m.first(m.rest(expressions));
}

function createBindings(args, params) {
  if (m.count(args) === 0) {
    return m.vector();
  }
  var pair = m.vector(m.first(args), m.first(params));

  return m.concat(pair, createBindings(m.rest(args), m.rest(params)));
}

Closure.prototype.apply = function (params) {
  var bindings = createBindings(this._args, params);
  var scope = this._scope.wrap(bindings, true);
  return scope.eval(this._body);
};

Closure.prototype.toString = function () {
  return '(fn ' + this._args + ' ' + this._body + ')';
};

module.exports = Closure;
