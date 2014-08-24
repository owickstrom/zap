var m = require('mori');
var printString = require('../lang/print-string.js');
var Symbol = require('../lang/symbol.js');
var keyword = require('../lang/keyword.js');
var equals = require('../lang/equals.js');

var ampersand = Symbol.withoutPkg('&');

function processArgs(seq) {
  var hasSeenVariadicSymbol = false;

  var args = {
    filtered: m.vector(),
    unfiltered: m.vector(),
    isVariadic: false
  };

  m.each(seq, function (arg) {
    args.unfiltered = m.conj(args.unfiltered, arg);
    if(equals(ampersand, arg)) {
      args.isVariadic = true;
    } else if (hasSeenVariadicSymbol) {
      throw new Error('Invalid variadic arguments vector: ' + printString(seq));
    } else {
      args.filtered = m.conj(args.filtered, arg);
      hasSeenVariadicSymbol = args.isVariadic;
    }
  });

  return args;
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
  var highestFixedArgCount = 0;
  var variadicArgCount;

  var fixedArgCountHigherThanVariadicError =
    new Error('All fixed arity overloads must have fewer args than the variadic one');

  m.each(expressionPairs, function (pair) {
    var args = processArgs(m.first(pair));

    var argCount = m.count(args.filtered);
    if (args.isVariadic) {
      // This variadic overload has too few args.
      if (argCount <= highestFixedArgCount) {
        throw fixedArgCountHigherThanVariadicError;
      }
      variadicArgCount = argCount;
    } else {
      // This fixed arity overload has too many args.
      if (argCount >= variadicArgCount) {
        throw fixedArgCountHigherThanVariadicError;
      }
      highestFixedArgCount = Math.max(argCount, highestFixedArgCount);
    }

    overloads[argCount] = {
      args: args.filtered,
      body: m.first(m.rest(pair)),
      isVariadic: args.isVariadic
    };
  });

  return {
    getMatching: function (params) {
      var count = m.count(params);
      if (overloads.hasOwnProperty(count)) {
        return overloads[count];
      } else if (variadicArgCount !== undefined && (variadicArgCount - 1) <= count) {
        return overloads[variadicArgCount];
      }
    }
  };
}

function createBindings(args, params, isVariadic) {
  if (m.count(args) === 0) {
    return m.vector();
  } else if (isVariadic && m.count(args) === 1) {
    // The last symbol gets the rest of the arguments bound in a
    // variadic function.
    return m.vector(m.first(args), m.into(m.vector(), params));
  }
  var pair = m.vector(m.first(args), m.first(params));

  return m.concat(pair, createBindings(m.rest(args), m.rest(params), isVariadic));
}

function create(scope, expressions) {
  var overloads = expressionsToOverloads(expressions);

  var fn = function () {
    var params = m.prim_seq(arguments);
    var overload = overloads.getMatching(params);

    if (!overload) {
      return Promise.reject(new Error('Invalid number of parameters'));
    }

    var bindings = createBindings(overload.args, params, overload.isVariadic);
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
    return '(fn [multiple-overloads])';
  };

  return fn;
}

module.exports = {
  create: create
};
