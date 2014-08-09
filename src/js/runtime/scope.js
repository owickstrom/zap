var mori = require('mori');
var equals = require('../lang/equals.js');
var printString = require('../lang/print-string.js');
var Symbol = require('../lang/symbol.js');
var Closure = require('./closure.js');
var SpecialForms = require('./special-forms.js');
var MethodName = require('../lang/method-name.js');
var MethodCall = require('./method-call.js');
var PropertyName = require('../lang/property-name.js');
var PropertyGetter = require('./property-getter.js');

var specialForms = new SpecialForms();

// qoute returns it's arguments unevaluated.
specialForms.add('quote', function (scope, args) {
  return Promise.resolve(mori.first(args));
});

// eval calls this method.
specialForms.add('eval', function (scope, args) {
  var form = mori.first(args);
  return new Promise(function (resolve, reject) {
    return scope.eval(form).then(function (data) {
      return resolve(scope.eval(data));
    }, reject);
  });
});

// def does not eval the first argument, the symbol,
// which is uses to create a new var in a pkg.
specialForms.add('def', function (scope, args) {
  var symbol = mori.first(args);
  var value = mori.first(mori.rest(args));
  var evaled = scope.eval(value);
  return evaled.then(function (evaled) {
    return scope.runtime.def(symbol, evaled);
  });
});

// let introduces a new lexical scope.
specialForms.add('let', function (scope, args) {
  var bindings = mori.first(args);
  // TODO: Support implicit do.
  var body = mori.first(mori.rest(args));

  var newScope = Scope.create(bindings, scope, true);
  return newScope.eval(body);
});
//
// fn creates a closure.
specialForms.add('fn', function (scope, args) {
  return new Closure(scope, args);
});

// if does what you'd expect.
specialForms.add('if', function (scope, args) {
  var count = mori.count(args);

  return new Promise(function (resolve, reject) {

    if (count < 2) {
      return reject(new Error('Cannot if without a condition and a true branch'));
    }

    var condition = scope.eval(mori.first(args));

    condition.then(function (c) {
      var exceptCondition = mori.rest(args);
      var trueBranch = mori.first(exceptCondition);
      var falseBranch;

      if (count >= 3) {
        falseBranch = mori.first(mori.rest(exceptCondition));
      }

      var conditionFalse = c === false || (mori.is_list(c) && mori.equals(mori.list(), c));

      if (!conditionFalse) {
        return resolve(scope.eval(trueBranch));
      } else if (falseBranch !== undefined) {
        return resolve(scope.eval(falseBranch));
      } else {
        return resolve(null);
      }
    });
  });
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
    return subScope;
  } else if (count % 2 !== 0) {
    throw new Error('Scope.create requires a bindings vector with even length');
  }

  var symbol = mori.first(bindings);
  var rest = mori.rest(bindings);
  var value = mori.first(rest);

  if (!Symbol.isInstance(symbol)) {
    throw new Error(printString(symbol) + ' is not a symbol');
  }

  var key = symbol.name;

  if (evalArgs) {
    value = subScope.eval(value);
  }

  var values = mori.hash_map(key, value);

  return Scope.create(
    mori.rest(rest),
    new Scope(subScope.runtime, values, subScope),
    evalArgs);
}

Scope.empty = function (runtime) {
  return Scope.create(runtime, mori.hash_map(), null);
};

Scope.prototype.resolve = function (symbol) {
  if(mori.has_key(this._values, symbol.name)) {
    return mori.get(this._values, symbol.name);
  }

  if (this._subScope) {
    return this._subScope.resolve(symbol);
  }

  return null;
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
  return new Promise(function (resolve, reject) {

    if (mori.is_list(form)) {
      var seq = mori.seq(form);
      var first = mori.first(seq);

      if (specialForms.has(first)) {
        return resolve(specialForms.eval(self, first, seq));
      }

      // TODO: macro call

      self.eval(first).then(function (fn) {
        var argPromises = mori.clj_to_js(mori.map(eval, mori.rest(seq)));
        Promise.all(argPromises).then(function (args) {
          return resolve(fn.apply(mori.seq(args)));
        }, reject);
      }, reject);

    } else if (mori.is_vector(form)) {

      var promises = mori.clj_to_js(mori.map(eval, form));
      return Promise.all(promises).then(function (elements) {
        return mori.vector.apply(null, elements);
      }, reject).then(resolve, reject);

    } else if (mori.is_map(form)) {
      return resolve(evalMap(self, form));
    } else if (Symbol.isInstance(form)) {
      // Symbols are automatically derefed.
      var bound = self.resolve(form);

      if (bound) {
        return resolve(bound);
      }

      self.runtime.resolve(form).then(function (v) {
        if (v) {
          return resolve(v.deref());
        } else {
          return reject(new Error('Could not resolve symbol: ' + printString(form)));
        }
      }, reject);
    } else if (MethodName.isInstance(form)) {
      return resolve(new MethodCall(form));
    } else if (PropertyName.isInstance(form)) {
      return resolve(new PropertyGetter(form));
    } else {
      return resolve(form);
    }
  });
};

module.exports = Scope;
