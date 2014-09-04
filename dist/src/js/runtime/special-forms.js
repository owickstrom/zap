var Promise = require('es6-promise').Promise;
var mori = require('mori');
var Symbol = require('../lang/symbol.js');
var Closure = require('./closure.js');
var ZapError = require('./zap-error.js');

var fns = mori.hash_map();

function add(name, fn) {
  fns = mori.assoc(fns, name, fn);
}

function has(symbol) {
  return !!symbol && mori.has_key(fns, symbol.name);
}

function eval(scope, symbol, seq) {
  if (!symbol) {
    return Promise.reject('symbol cannot be ' + symbol);
  }
  if (!seq) {
    return Promise.reject('symbol cannot be ' + seq);
  }

  var fn = mori.get(fns, symbol.name);

  if (fn) {
    return Promise.resolve(fn(scope, mori.rest(seq)));
  } else {
    return Promise.reject(symbol.name + ' is not a special form');
  }
};

// qoute returns it's arguments unevaluated.
add('quote', function (scope, args) {
  return Promise.resolve(mori.first(args));
});

// the eval special form calls scope.eval two times; first to resolve symbols etc,
// then to actually eval the data as code.
add('eval', function (scope, args) {
  var form = mori.first(args);
  var eval = scope.eval.bind(scope);
  return eval(form).then(eval);
});

// def does not eval the first argument if it's a symbol,
// which is uses to create a new var in a pkg. If it is
// something other than a symbol, it will be evaled.
add('def', function (scope, args) {
  var symbol = mori.first(args);

  var symbolPromise =
    Symbol.isInstance(symbol) ? Promise.resolve(symbol) : scope.eval(symbol);

  return symbolPromise.then(function (symbol) {
    var value = mori.first(mori.rest(args));
    var evaled = scope.eval(value);
    return evaled.then(function (evaled) {
      return scope.runtime.def(symbol, evaled);
    });
  });
});

// let introduces a new lexical scope.
add('let', function (scope, args) {
  var bindings = mori.first(args);
  // TODO: Support implicit do.
  var body = mori.first(mori.rest(args));

  return scope.wrap(bindings, true).then(function (newScope) {
    return newScope.eval(body);
  });
});
//
// fn creates a closure.
add('fn*', function (scope, args) {
  return Closure.create(scope, args);
});

// if does what you'd expect.
add('if', function (scope, args) {
  var count = mori.count(args);

  if (count < 2) {
    return Promise.reject(new Error('Cannot if without a condition and a true branch'));
  }

  var condition = scope.eval(mori.first(args));

  return condition.then(function (c) {
    var exceptCondition = mori.rest(args);
    var trueBranch = mori.first(exceptCondition);
    var falseBranch;

    if (count >= 3) {
      falseBranch = mori.first(mori.rest(exceptCondition));
    }

    var conditionFalse = c === false || c === null;

    if (!conditionFalse) {
      return scope.eval(trueBranch);
    } else if (falseBranch !== undefined) {
      return scope.eval(falseBranch);
    } else {
      return Promise.resolve(null);
    }
  });
});

// do evaluates all expressions sequentially (using Promise.then) and
// returns the Promise returned by the last expression.
add('do', function (scope, args) {
  function evalNext(exprs) {
    var count = mori.count(exprs);
    if (count === 0) {
      return null;
    } else if (count === 1) {
      return scope.eval(mori.first(exprs));
    } else {
      return scope.eval(mori.first(exprs)).then(function () {
        return evalNext(mori.rest(exprs));
      });
    }
  }
  return evalNext(args);
});

// throw creates a rejected Promise.
add('throw*', function (scope, args) {
  var error = mori.first(args);

  return Promise.reject(new ZapError(error));
});

// try evaluates an expression and invokes the catch clause if it returns a
// rejected Promise.
add('try*', function (scope, args) {
  var expr = mori.first(args);
  var catchClause = mori.first(mori.rest(args));

  return new Promise(function (resolve, reject) {
    scope.eval(expr).then(resolve, function (e) {
      var exceptCatch = mori.rest(catchClause);
      var symbol = mori.first(exceptCatch);
      var catchExpr = mori.first(mori.rest(exceptCatch));
      var bindings = mori.vector(symbol, e);

      scope.wrap(bindings, true).then(function (catchScope) {
        catchScope.eval(catchExpr).then(resolve, reject);
      }, reject);
    });
  });
});

// macroexpand runs a macro and returns the output data structure without
// evaluating it.
add('macroexpand', function (scope, args) {
  if (mori.count(args) !== 1) {
    return Promise.reject(new Error('macroexpand takes exactly on argument'));
  }

  return scope.macroexpand(mori.first(args));
});

module.exports = {
  has: has,
  eval: eval
};
