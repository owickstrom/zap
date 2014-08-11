var mori = require('mori');
var Reader = require('../reader/reader.js');
var Scope = require('./scope.js');
var Symbol = require('../lang/symbol.js');
var Pkg = require('../lang/pkg.js');
var PkgName = require('../lang/pkg-name.js');
var WrappedFn = require('../lang/wrapped-fn.js');
var Loader = require('./loader.js');
var http = require('../net/http.js');
var equals = require('../lang/equals.js');
var printString = require('../lang/print-string.js');

var zapCore = PkgName.withSegments('zap', 'core');
var zapHttp = PkgName.withSegments('zap', 'http');

function Runtime(base) {
  this.rootScope = new Scope(this, mori.hash_map(), null);
  this.pkgs = mori.hash_map();
  this.pkg = this.getPkg(zapCore);
  this._loader = new Loader(base);
}

Runtime.prototype.addPreDefs = function () {
  var self = this;
  function wrapCore(name, f) {
    return self.def(Symbol.inPkg(name, zapCore), new WrappedFn(f));
  }
  return Promise.all([
    wrapCore('+', function (a, b) {
      return a + b;
    }),
    wrapCore('-', function (a, b) {
      return a - b;
    }),
    wrapCore('*', function (a, b) {
      return a * b;
    }),
    wrapCore('/', function (a, b) {
      return a / b;
    }),
    wrapCore('%', function (a, b) {
      return a % b;
    }),
    wrapCore('=', function (a, b) {
      return equals(a, b);
    }),
    wrapCore('<', function (a, b) {
      return a < b;
    }),
    wrapCore('>', function (a, b) {
      return a > b;
    }),
    wrapCore('<=', function (a, b) {
      return a <= b;
    }),
    wrapCore('>=', function (a, b) {
      return a >= b;
    }),
    wrapCore('type-of', function (a) {
      return typeof a;
    }),
    wrapCore('print-string', function () {
      return printString.apply(null, arguments);
    }),
    wrapCore('with-meta', function (meta, coll) {
      if (mori.is_collection(coll)) {
        var result;
        if (mori.is_list(coll)) {
          result = mori.list();
        } else if (mori.is_vector(coll)) {
          result = mori.vector();
        } else if (mori.is_map(coll)) {
          result = mori.hash_map();
        }
        var copy = mori.into(result, coll);
        copy.__meta = meta;
        return Promise.resolve(copy);
      } else {
        return Promise.reject(printString(coll) + ' does not support metadata');
      }
    }),
    wrapCore('list', function () {
      return mori.list.apply(null, arguments);
    }),
    wrapCore('vector', function () {
      return mori.vector.apply(null, arguments);
    }),
    wrapCore('hash-map', function () {
      return mori.hash_map.apply(null, arguments);
    }),
    this.def(Symbol.inPkg('get', zapHttp), new WrappedFn(function (url) {
      return http.get(url).then(function (result) {
        return result.data;
      });
    }))
  ]);
};

Runtime.prototype.start = function () {
  var self = this;

  return self.addPreDefs().then(function () {
    return self.require(zapCore);
  });
};

Runtime.prototype.currentPkg = function () {
  return this.pkg;
};

Runtime.prototype.getPkg = function (name) {
  var str = name.toString();
  var pkg = mori.get(this.pkgs, str);

  if (!pkg) {
    pkg = new Pkg(name);
    this.pkgs = mori.assoc(this.pkgs, str, pkg);
  }

  return pkg;
};

Runtime.prototype._qualifiedOrCurrentPkg = function (symbol) {
  return !!symbol.pkgName ? this.getPkg(symbol.pkgName) : this.currentPkg();
};

Runtime.prototype.def = function (symbol, value) {
  var pkg = this._qualifiedOrCurrentPkg(symbol);
  return Promise.resolve(pkg.def(symbol, value));
};

Runtime.prototype.resolve = function (symbol) {
  var pkg = this._qualifiedOrCurrentPkg(symbol);
  return pkg.resolve(symbol);
};

Runtime.prototype.require = function (pkgName) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self._loader.loadSource(pkgName).then(function (source) {
      resolve(self.loadTopLevelFormsString(source));
    }, function (err) {
      reject(new Error('Failed to require ' + pkgName.toString() + ': ' + err));
    });
  });
};

Runtime.prototype.eval = function (value) {
  return this.rootScope.eval(value);
};

Runtime.prototype.evalForms = function (forms) {
  var self = this;

  if (mori.count(forms) === 0) {
    return Promise.resolve(null);
  }

  return new Promise(function (resolve, reject) {
    self.eval(mori.first(forms)).then(function (evaled) {
      self.evalForms(mori.rest(forms)).then(function (restEvaled) {
        resolve(mori.cons(evaled, restEvaled));
      }, reject);
    });
  });
};

Runtime.prototype.loadString = function (s) {
  var self = this;

  return new Promise(function (resolve, reject) {
    try {
      var value = Reader.readString(s);
      return resolve(self.eval(value));
    } catch (e) {
      return reject(e);
    }
  });
};

Runtime.prototype.loadTopLevelFormsString = function (s) {
  var self = this;

  return new Promise(function (resolve, reject) {
    try {
      var forms = Reader.readTopLevelFormsString(s);
      resolve(self.evalForms(forms));
    } catch (e) {
      return reject(e);
    }
  });
};

module.exports = Runtime;
