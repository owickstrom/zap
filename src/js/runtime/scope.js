var mori = require('mori');
var equals = require('../lang/equals.js');
var Symbol = require('../lang/symbol.js');
var SpecialForms = require('./special-forms.js');

var specialForms = new SpecialForms();

// qoute returns it's arguments unevaluated.
specialForms.add('quote', function (scope, args) {
  return mori.first(args);
});

// eval calls this method.
specialForms.add('eval', function (scope, args) {
  var data = mori.first(args);
  return scope.eval(scope.eval(data));
});

// def does not eval the first argument, the symbol,
// which is uses to create a new var in a pkg.
specialForms.add('def', function (scope, args) {
  var symbol = mori.first(args);
  var value = mori.first(mori.rest(args));
  return scope, scope.runtime.def(symbol, value);
});

// let introduces a new lexical scope.
specialForms.add('let', function (scope, args) {
  var bindings = mori.first(args);
  // TODO: Support implicit do.
  var body = mori.first(mori.rest(args));

  var newScope = Scope.create(bindings, scope, true);
  return newScope.eval(body);
});

function Scope(runtime, values, subScope) {
  this.runtime = runtime;
  this._values = values;
  this._subScope = subScope;

}

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
    throw new Error(symbol.toString() + ' is not a symbol');
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

Scope.prototype.eval = function (form) {
  var self = this;
  var eval = function (value) { return self.eval(value); }

  if (mori.is_list(form)) {
    var seq = mori.seq(form);
    var first = mori.first(seq);

    if (specialForms.has(first)) {
      return specialForms.eval(this, first, seq);
    }
    // TODO: fn call and macros

  } else if (mori.is_vector(form)) {
    return mori.into(mori.vector(), mori.map(eval, form));
  } else if (mori.is_map(form)) {
    function assocEvaled(m, key, value) {
      return mori.assoc(m, eval(key), eval(value));
    }
    return mori.reduce_kv(assocEvaled, mori.hash_map(), form);
  } else {

    // Symbols are automatically derefed.
    if (Symbol.isInstance(form)) {
      var bound = this.resolve(form);

      if (bound) {
        return bound;
      }

      var v = this.runtime.resolve(form);

      if (v) {
        return v.deref();
      } else {
        throw new Error('Could not resolve symbol: ' + form.toString());
      }
    } else {
      return form;
    }
  }

};

module.exports = Scope;
