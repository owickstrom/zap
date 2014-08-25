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

  return Scope.create(bindings, scope, true).then(function (newScope) {
    return newScope.eval(body);
  });
});
//
// fn creates a closure.
specialForms.add('fn', function (scope, args) {
  return closure.create(scope, args);
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

      var conditionFalse = c === false || c === null;

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

// macro creates a fn that does not eval it's arguments, it just transforms
// it as data.
specialForms.add('macro', function (scope, args) {
  var c = closure.create(scope, args);
  c.setMacro();
  return c;
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
  return new Promise(function (resolve, reject) {
    var count = mori.count(bindings);

    if (count == 0) {
      return resolve(subScope);
    } else if (count % 2 !== 0) {
      return reject(new Error('Scope.create requires a bindings vector with even length'));
    }

    var symbol = mori.first(bindings);
    var rest = mori.rest(bindings);
    var value = mori.first(rest);

    if (!Symbol.isInstance(symbol)) {
      return reject(new Error(printString(symbol) + ' is not a symbol'));
    }

    var key = symbol.name;

    var valuePromise;
    if (evalArgs) {
      valuePromise = subScope.eval(value);
    } else {
      valuePromise = Promise.resolve(value);
    }

    valuePromise.then(function (value) {
      var values = mori.hash_map(key, value);

       Scope.create(
        mori.rest(rest),
        new Scope(subScope.runtime, values, subScope),
        evalArgs).then(resolve, reject);
    }, reject);
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
  return new Promise(function (resolve, reject) {

    if (mori.is_list(form)) {
      var seq = mori.seq(form);
      var first = mori.first(seq);

      if (!first) {
        return resolve(form);
      }

      if (specialForms.has(first)) {
        return specialForms.eval(self, first, seq).then(resolve, reject);
      }

      self.eval(first).then(function (fn) {
        if (!fn.apply) {
          return reject(new Error(printString(fn) + ' is not a fn'));
        }

        if (!!fn.isMacro && fn.isMacro()) {
          return self.macroexpand(seq).then(function (expanded) {
            return self.eval(expanded).then(resolve, reject);
          });

        } else {
          var argPromises = mori.into_array(mori.map(eval, mori.rest(seq)));
          Promise.all(argPromises).then(function (args) {
            return resolve(fn.apply(null, args));
          }, reject);
        }
      }, reject);

    } else if (mori.is_vector(form)) {
      var promises = mori.clj_to_js(mori.map(eval, form));

      return Promise.all(promises).then(function (elements) {
        var newVector = mori.vector.apply(null, elements);
        // Transfer meta data.
        newVector.__meta = form.__meta;
        return newVector;
      }, reject).then(resolve, reject);

    } else if (keyword.isInstance(form)) {
      // Treat keywords (which are actually a mori hash map with only one key)
      // different from maps in general.
      return resolve(form);
    } else if (mori.is_map(form)) {
      return resolve(evalMap(self, form));
    } else if (Symbol.isInstance(form)) {
      // Symbols are automatically derefed.
      self.resolve(form).then(function (bound) {

        // Symbol is bound in scope.
        return resolve(bound);

      }, function () {

        // Not bound in scope.
        self.runtime.resolve(form).then(function (v) {
          if (v) {
            // Check if it derefs.
            if (v.deref) {
              return resolve(v.deref());
            } else {
              return resolve(v);
            }
          } else {
            return reject(new Error('Could not resolve symbol: ' + printString(form)));
          }
        }, reject);

      });

    } else if (MethodName.isInstance(form)) {
      return resolve(methodCall.create(form));
    } else if (PropertyName.isInstance(form)) {
      return resolve(propertyGetter.create(form));
    } else {
      return resolve(form);
    }
  });
};

Scope.prototype.macroexpand = function (seq) {
  var self = this;
  return self.eval(mori.first(seq)).then(function (macro) {
    var params = mori.into_array(mori.rest(seq));
    return macro.apply(null, params);
  });
};


module.exports = Scope;
