var mori = require('mori');
var Symbol = require('../lang/symbol.js');

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
};

module.exports = Scope;
