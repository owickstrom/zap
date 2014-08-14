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

function expressionsToOverloads(expressions) {
  if (m.count(expressions) % 2 !== 0) {
    throw new Error('Invalid fn: ' + printString(expressions));
  }

  var expressionPairs = expressions;

  // If it is not an overloaded function, wrap the args and body anyway so it
  // can be handled the same as overloaded ones.
  if (!m.is_list(m.first(expressions))) {
    expressionPairs = m.list(expressions);
  }

  var overloads = {};

  m.each(expressionPairs, function (pair) {
    var args = m.first(pair);
    overloads[m.count(args)] = {
      args: args,
      body: m.first(m.rest(pair))
    };
  });

  return {
    getMatching: function (params) {
      var count = m.count(params);
      return overloads[count];
    }
  };
}

function create(scope, expressions) {
  var overloads = expressionsToOverloads(expressions);

  var fn = function () {
    var params = m.prim_seq(arguments);
    var overload = overloads.getMatching(params);

    if (!overload) {
      return Promise.reject(new Error('Invalid number of parameters'));
    }

    var bindings = createBindings(overload.args, params);
    var evalArgs = !fn.isMacro();

    return scope.wrap(bindings, evalArgs).then(function (scope) {
      return scope.eval(overload.body);
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
