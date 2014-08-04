var mori = require('mori');
var equals = require('../lang/equals.js');
var Symbol = require('../lang/symbol.js');

var quote = Symbol.withoutPkg('quote');
var eval = Symbol.withoutPkg('eval');
var def = Symbol.withoutPkg('def');

function Scope(runtime) {
  this.runtime = runtime;
  this.bindings = mori.hash_map();
}

Scope.prototype.resolve = function (symbol) {
  return mori.get(this.bindings, symbol.toString());
}

Scope.prototype.eval = function (form) {
  if (!mori.is_list(form)) {
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
    }
  }

  var seq = mori.seq(form);
  var first = mori.first(seq);

  // qoute is a special form that returns it's arguments unevaluated.
  if (equals(quote, first)) {
    return mori.first(mori.rest(seq));
  }

  // eval is a special form that calls this method.
  if (equals(eval, first)) {
    var data = mori.first(mori.rest(seq));
    return this.eval(this.eval(data));
  }

  // def is a special form that does not eval the first argument, the symbol.
  if (equals(def, first)) {
    var args = mori.rest(seq);
    var symbol = mori.first(args);
    var value = mori.first(mori.rest(args));
    return this.runtime.def(symbol, value);
  }
};

module.exports = Scope;
