var Promise = require('es6-promise').Promise;
var mori = require('mori');
var equals = require('../lang/equals.js');
var printString = require('../lang/print-string.js');
var keyword = require('../lang/keyword.js');
var Symbol = require('../lang/symbol.js');
var closure = require('./closure.js');
var SpecialForms = require('./special-forms.js');
var MethodName = require('../lang/method-name.js');
var methodCall = require('./method-call.js');
var PropertyName = require('../lang/property-name.js');
var propertyGetter = require('./property-getter.js');

var specialForms = new SpecialForms();

// qoute returns it's arguments unevaluated.
specialForms.add('quote', function (scope, args) {
  return Promise.resolve(mori.first(args));
});

// the eval special form calls scope.eval two times; first to resolve symbols etc,
// then to actually eval the data as code.
specialForms.add('eval', function (scope, args) {
  var form = mori.first(args);
  var eval = scope.eval.bind(scope);
  return eval(form).then(eval);
});

// def does not eval the first argument if it's a symbol,
// which is uses to create a new var in a pkg. If it is
// something other than a symbol, it will be evaled.
specialForms.add('def', function (scope, args) {
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
specialForms.add('let', function (scope, args) {
  var bindings = mori.first(args);
  // TODO: Support implicit do.
  var body = mori.first(mori.rest(args));

  return Scope.create(bindings, scope, true).then(function (newScope) {
    return newScope.eval(body);
  });
});
//
// fn creates a closure.
specialForms.add('fn*', function (scope, args) {
  return closure.create(scope, args);
});

// if does what you'd expect.
specialForms.add('if', function (scope, args) {
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
specialForms.add('do', function (scope, args) {
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
specialForms.add('throw*', function (scope, args) {
  var error = mori.first(args);

  // Make sure it's an Error.
  error = typeof error === 'string' ? new Error(error) : error;

  return Promise.reject(error);
});

// macroexpand runs a macro and returns the output data structure without
// evaluating it.
specialForms.add('macroexpand', function (scope, args) {
  if (mori.count(args) !== 1) {
    return Promise.reject(new Error('macroexpand takes exactly on argument'));
  }

  return scope.macroexpand(mori.first(args));
});

function Scope(runtime, values, subScope) {
  this.runtime = runtime;
  this._values = values;
  this._subScope = subScope;
}

Scope.prototype.wrap = function (bindings, evalArgs) {
  return Scope.create(bindings, this, evalArgs);
};

Scope.create = function (bindings, subScope, evalArgs) {
  var count = mori.count(bindings);

  if (count == 0) {
    return Promise.resolve(subScope);
  } else if (count % 2 !== 0) {
    return Promise.reject(new Error('Scope.create requires a bindings vector with even length'));
  }

  var symbol = mori.first(bindings);
  var rest = mori.rest(bindings);
  var value = mori.first(rest);

  if (!Symbol.isInstance(symbol)) {
    return Promise.reject(new Error(printString(symbol) + ' is not a symbol'));
  }

  var valuePromise = evalArgs ? subScope.eval(value) : Promise.resolve(value);

  return valuePromise.then(function (value) {
    var values = mori.hash_map(symbol.name, value);

      return Scope.create(
        mori.rest(rest),
        new Scope(subScope.runtime, values, subScope),
        evalArgs);
  });
}

Scope.empty = function (runtime) {
  return Scope.create(runtime, mori.hash_map(), null);
};

Scope.prototype.resolve = function (symbol) {
  if(mori.has_key(this._values, symbol.name)) {
    return Promise.resolve(mori.get(this._values, symbol.name));
  }

  if (this._subScope) {
    return this._subScope.resolve(symbol);
  }

  return Promise.reject('Could not resolve symbol: ' + symbol.toString());
}

// Evals the keys and values in the map and returns a promise of a new map
// constructed from the evaled keys and values.
function evalMap(scope, map) {
  function assocEvaled(pairs, key, value) {
    var pair = [scope.eval(key), scope.eval(value)];
    return pairs.concat(pair);
  }
  var evaledPromises = mori.reduce_kv(assocEvaled, [], map);
  return Promise.all(evaledPromises).then(function (evaled) {
    return mori.hash_map.apply(null, evaled);
  });
}

Scope.prototype.eval = function (form) {
  var self = this;
  var eval = function (value) { return self.eval(value); }

  if (mori.is_list(form)) {
    var seq = mori.seq(form);
    var first = mori.first(seq);

    if (!first) {
      return Promise.resolve(form);
    }

    if (specialForms.has(first)) {
      return specialForms.eval(self, first, seq);
    }

    return self.eval(first).then(function (fn) {
      if (!fn || !fn.apply) {
        return Promise.reject(new Error(printString(fn) + ' is not a fn'));
      }

      if (!!fn.isMacro && fn.isMacro()) {
        return self.macroexpand(seq).then(eval);

      } else {
        var argPromises = mori.into_array(mori.map(eval, mori.rest(seq)));
        return Promise.all(argPromises).then(function (args) {
          return fn.apply(null, args);
        });
      }
    });

  } else if (mori.is_vector(form)) {
    var promises = mori.clj_to_js(mori.map(eval, form));

    return Promise.all(promises).then(function (elements) {
      var newVector = mori.vector.apply(null, elements);
      // Transfer meta data.
      newVector.__meta = form.__meta;
      return newVector;
    });

  } else if (keyword.isInstance(form)) {
    // Treat keywords (which are actually a mori hash map with only one key)
    // different from maps in general.
    return Promise.resolve(form);
  } else if (mori.is_map(form)) {
    return Promise.resolve(evalMap(self, form));
  } else if (Symbol.isInstance(form)) {
    // Symbols are automatically derefed.
    return new Promise(function (resolve, reject) {
      self.resolve(form).then(function (bound) {

        // Symbol is bound in scope.
        resolve(bound);

      }, function () {

        // Not bound in scope.
        self.runtime.resolve(form).then(function (v) {
          return !!v && v.deref ? v.deref() : v;
        }).then(resolve, reject);
      });
    });

  } else if (MethodName.isInstance(form)) {
    return Promise.resolve(methodCall.create(form));
  } else if (PropertyName.isInstance(form)) {
    return Promise.resolve(propertyGetter.create(form));
  } else {
    return Promise.resolve(form);
  }
};

Scope.prototype.macroexpand = function (seq) {
  var self = this;
  return self.eval(mori.first(seq)).then(function (macro) {
    var params = mori.into_array(mori.rest(seq));
    return macro.apply(null, params);
  });
};


module.exports = Scope;
