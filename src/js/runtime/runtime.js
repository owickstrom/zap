var Promise = require('es6-promise').Promise;
var mori = require('mori');
var Reader = require('../reader/reader.js');
var Scope = require('./scope.js');
var BrowserInterop = require('./browser-interop.js');
var isInterop = require('./is-interop.js');
var Symbol = require('../lang/symbol.js');
var Pkg = require('../lang/pkg.js');
var PkgName = require('../lang/pkg-name.js');
var http = require('../net/http.js');
var equals = require('../lang/equals.js');
var printString = require('../lang/print-string.js');

var zapCore = PkgName.withSegments('zap', 'core');
var zapHttp = PkgName.withSegments('zap', 'http');

function Runtime(loader) {
  this.rootScope = new Scope(this, mori.hash_map(), null);
  this.pkgs = mori.hash_map();
  this.pkg = this.getPkg(zapCore);
  this._loader = loader;
  this._interop = new BrowserInterop();
}

Runtime.prototype.addPreDefs = function () {
  var self = this;
  function wrapCore(name, f) {
    return self.def(Symbol.inPkg(name, zapCore), f);
  }
  function wrapMori(name, f) {
    return wrapCore(name, function () {
      return f.apply(null, arguments);
    });
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
    wrapCore('print-string', printString),

    wrapCore('aset', function (obj, prop, value) {
      if (obj === null || obj === undefined) {
        return Promise.reject('Cannot set property ' + prop + ' of ' + printString(obj));
      }
      obj[prop] = value;
      return Promise.resolve(value);
    }),
    // TODO: Write in zap
    wrapCore('with-meta', function (meta, obj) {
      if (obj === null || obj === undefined) {
        return null;
      } else if (mori.is_collection(obj)) {
        var result;
        if (mori.is_list(obj)) {
          result = mori.list();
        } else if (mori.is_vector(obj)) {
          result = mori.vector();
        } else if (mori.is_map(obj)) {
          result = mori.hash_map();
        }
        var copy = mori.into(result, obj);
        copy.__meta = meta;
        return Promise.resolve(copy);
      } else if (typeof obj.withMeta === 'function') {
        return obj.withMeta(meta);
      } else {
        return Promise.reject(new Error(printString(obj) + ' does not support metadata'));
      }
    }),
    wrapCore('*mori*', mori),

    // TODO: Write in zap
    wrapMori('seq', mori.seq),
    // TODO: Write in zap
    wrapMori('list', mori.list),
    // TODO: Write in zap
    wrapMori('vector', mori.vector),
    // TODO: Write in zap
    wrapMori('hash-map', mori.hash_map),
    // TODO: Write in zap
    wrapMori('first', mori.first),
    // TODO: Write in zap
    wrapMori('rest', mori.rest),
    // TODO: Write in zap
    wrapMori('conj', mori.conj),
    // TODO: Write in zap
    wrapMori('cons', mori.cons),
    // TODO: Write in zap
    wrapMori('empty?', mori.is_empty),
    // TODO: Write in zap
    wrapMori('vector?', mori.is_vector),
    // TODO: Write in zap
    wrapMori('list?', mori.is_list),
    // TODO: Write in zap
    wrapMori('map', mori.map),
    // TODO: Write in zap
    wrapMori('reduce', mori.reduce),
    // TODO: Write in zap
    wrapMori('filter', mori.filter),
    // TODO: Write in zap
    wrapMori('reverse', mori.reverse),
    // TODO: Write in zap
    wrapMori('zap->js', mori.clj_to_js),
    // TODO: Write in zap
    wrapMori('js->zap', mori.js_to_clj),

    this.def(Symbol.inPkg('get', zapHttp), function (url) {
      return http.get(url).then(function (result) {
        return mori.js_to_clj(result.data);
      });
    })
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
  var self = this;
  if (isInterop(symbol)) {
    return self._interop.resolve(symbol);
  }
  var pkg = this._qualifiedOrCurrentPkg(symbol);
  return pkg.resolve(symbol);
};

Runtime.prototype.require = function (pkgName) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self._loader.readZapSource(pkgName).then(function (source) {
      resolve(self.loadTopLevelFormsString(source));
    }, function (err) {
      reject(new Error('Failed to require ' + pkgName.toString() + ': ' + err));
    });
  });
};

Runtime.prototype.loadFile = function (path) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self._loader.readFile(path).then(function (source) {
      self.loadTopLevelFormsString(source).then(resolve, reject);
    }, reject);
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
      return self.eval(value).then(resolve, reject);
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
