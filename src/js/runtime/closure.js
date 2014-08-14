var m = require('mori');
var printString = require('../lang/print-string.js');
var keyword = require('../lang/keyword.js');

function createBindings(args, params) {
  if (m.count(args) === 0) {
    return m.vector();
  }
  var pair = m.vector(m.first(args), m.first(params));

  return m.concat(pair, createBindings(m.rest(args), m.rest(params)));
}

function create(scope, expressions) {
  var args = m.first(expressions);
  var body = m.first(m.rest(expressions));

  var fn = function () {
    var params = m.prim_seq(arguments);
    var bindings = createBindings(args, params);
    var evalArgs = !fn.isMacro();

    return scope.wrap(bindings, evalArgs).then(function (scope) {
      return scope.eval(body);
    });
  };

  fn.clone = function () {
    return create(scope, expressions);
  };

  var macroKey = keyword.fromString(':macro');

  fn.setMacro = function () {
    fn.meta = m.assoc(fn.meta, macroKey, true);
  };

  fn.isMacro = function () {
    var macro = m.get(fn.meta, macroKey);
    return macro === true;
  };

  fn.withMeta = function (metadata) {
    var clone = fn.clone();
    clone.__meta = metadata;
    return clone;
  };

  fn.toString = function () {
    return '(fn ' + printString(args) + ' ' + printString(body) + ')';
  };

  return fn;
}

module.exports = {
  create: create
};
