var m = require('mori');
var printString = require('../lang/print-string.js');

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
  var self = this;
  var bindings = createBindings(this._args, params);

  return self._scope.wrap(bindings, true).then(function (scope) {
    return scope.eval(self._body);
  });
};

Closure.prototype.toString = function () {
  return '(fn ' + printString(this._args) + ' ' + printString(this._body) + ')';
};

module.exports = Closure;
