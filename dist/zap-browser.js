!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.zap=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var Promise = _dereq_("./promise/promise").Promise;
var polyfill = _dereq_("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":6,"./promise/promise":7}],3:[function(_dereq_,module,exports){
"use strict";
/* global toString */

var isArray = _dereq_("./utils").isArray;
var isFunction = _dereq_("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":11}],4:[function(_dereq_,module,exports){
(function (process,global){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
}).call(this,_dereq_("FWaASH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"FWaASH":1}],5:[function(_dereq_,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],6:[function(_dereq_,module,exports){
(function (global){
"use strict";
/*global self*/
var RSVPPromise = _dereq_("./promise").Promise;
var isFunction = _dereq_("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./promise":7,"./utils":11}],7:[function(_dereq_,module,exports){
"use strict";
var config = _dereq_("./config").config;
var configure = _dereq_("./config").configure;
var objectOrFunction = _dereq_("./utils").objectOrFunction;
var isFunction = _dereq_("./utils").isFunction;
var now = _dereq_("./utils").now;
var all = _dereq_("./all").all;
var race = _dereq_("./race").race;
var staticResolve = _dereq_("./resolve").resolve;
var staticReject = _dereq_("./reject").reject;
var asap = _dereq_("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":3,"./asap":4,"./config":5,"./race":8,"./reject":9,"./resolve":10,"./utils":11}],8:[function(_dereq_,module,exports){
"use strict";
/* global toString */
var isArray = _dereq_("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":11}],9:[function(_dereq_,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],10:[function(_dereq_,module,exports){
"use strict";
function resolve(value) {
  /*jshint validthis:true */
  if (value && typeof value === 'object' && value.constructor === this) {
    return value;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],11:[function(_dereq_,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],12:[function(_dereq_,module,exports){
(function(definition){if(typeof exports==="object"){module.exports=definition();}else if(typeof define==="function"&&define.amd){define(definition);}else{mori=definition();}})(function(){return function(){
var g,aa=this;
function m(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==
b&&"undefined"==typeof a.call)return"object";return b}var ba="closure_uid_"+(1E9*Math.random()>>>0),ca=0;function p(a,b){var c=a.split("."),d=aa;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===b?d=d[e]?d[e]:d[e]={}:d[e]=b};function da(a,b){for(var c in a)b.call(void 0,a[c],c,a)};function ea(a,b){null!=a&&this.append.apply(this,arguments)}ea.prototype.Va="";ea.prototype.append=function(a,b,c){this.Va+=a;if(null!=b)for(var d=1;d<arguments.length;d++)this.Va+=arguments[d];return this};ea.prototype.toString=function(){return this.Va};function fa(a,b){a.sort(b||ga)}function ha(a,b){for(var c=0;c<a.length;c++)a[c]={index:c,value:a[c]};var d=b||ga;fa(a,function(a,b){return d(a.value,b.value)||a.index-b.index});for(c=0;c<a.length;c++)a[c]=a[c].value}function ga(a,b){return a>b?1:a<b?-1:0};var ia=null,ja=null;function ka(){return new la(null,5,[ma,!0,oa,!0,pa,!1,qa,!1,ra,ia],null)}function r(a){return null!=a&&!1!==a}function sa(a){return r(a)?!1:!0}function s(a,b){return a[m(null==b?null:b)]?!0:a._?!0:u?!1:null}function ta(a){return null==a?null:a.constructor}function x(a,b){var c=ta(b),c=r(r(c)?c.Db:c)?c.Bb:m(b);return Error(["No protocol method ",a," defined for type ",c,": ",b].join(""))}function ua(a){var b=a.Bb;return r(b)?b:""+A.b(a)}
function va(a){for(var b=a.length,c=Array(b),d=0;;)if(d<b)c[d]=a[d],d+=1;else break;return c}function wa(a){return Array.prototype.slice.call(arguments)}
var xa=function(){function a(a,b){return C.c?C.c(function(a,b){a.push(b);return a},[],b):C.call(null,function(a,b){a.push(b);return a},[],b)}function b(a){return c.a(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,0,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),ya={},za={};
function Aa(a){if(a?a.L:a)return a.L(a);var b;b=Aa[m(null==a?null:a)];if(!b&&(b=Aa._,!b))throw x("ICounted.-count",a);return b.call(null,a)}function Ba(a){if(a?a.I:a)return a.I(a);var b;b=Ba[m(null==a?null:a)];if(!b&&(b=Ba._,!b))throw x("IEmptyableCollection.-empty",a);return b.call(null,a)}var Ca={};function Da(a,b){if(a?a.G:a)return a.G(a,b);var c;c=Da[m(null==a?null:a)];if(!c&&(c=Da._,!c))throw x("ICollection.-conj",a);return c.call(null,a,b)}
var Ea={},D=function(){function a(a,b,c){if(a?a.aa:a)return a.aa(a,b,c);var h;h=D[m(null==a?null:a)];if(!h&&(h=D._,!h))throw x("IIndexed.-nth",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.J:a)return a.J(a,b);var c;c=D[m(null==a?null:a)];if(!c&&(c=D._,!c))throw x("IIndexed.-nth",a);return c.call(null,a,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),
Fa={};function Ha(a){if(a?a.Q:a)return a.Q(a);var b;b=Ha[m(null==a?null:a)];if(!b&&(b=Ha._,!b))throw x("ISeq.-first",a);return b.call(null,a)}function Ia(a){if(a?a.S:a)return a.S(a);var b;b=Ia[m(null==a?null:a)];if(!b&&(b=Ia._,!b))throw x("ISeq.-rest",a);return b.call(null,a)}
var Ja={},Ka={},La=function(){function a(a,b,c){if(a?a.C:a)return a.C(a,b,c);var h;h=La[m(null==a?null:a)];if(!h&&(h=La._,!h))throw x("ILookup.-lookup",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.u:a)return a.u(a,b);var c;c=La[m(null==a?null:a)];if(!c&&(c=La._,!c))throw x("ILookup.-lookup",a);return c.call(null,a,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=
a;return c}(),Ma={};function Na(a,b){if(a?a.kb:a)return a.kb(a,b);var c;c=Na[m(null==a?null:a)];if(!c&&(c=Na._,!c))throw x("IAssociative.-contains-key?",a);return c.call(null,a,b)}function Oa(a,b,c){if(a?a.ua:a)return a.ua(a,b,c);var d;d=Oa[m(null==a?null:a)];if(!d&&(d=Oa._,!d))throw x("IAssociative.-assoc",a);return d.call(null,a,b,c)}var Pa={};function Qa(a,b){if(a?a.nb:a)return a.nb(a,b);var c;c=Qa[m(null==a?null:a)];if(!c&&(c=Qa._,!c))throw x("IMap.-dissoc",a);return c.call(null,a,b)}var Sa={};
function Ta(a){if(a?a.$a:a)return a.$a(a);var b;b=Ta[m(null==a?null:a)];if(!b&&(b=Ta._,!b))throw x("IMapEntry.-key",a);return b.call(null,a)}function Ua(a){if(a?a.ab:a)return a.ab(a);var b;b=Ua[m(null==a?null:a)];if(!b&&(b=Ua._,!b))throw x("IMapEntry.-val",a);return b.call(null,a)}var Va={};function Wa(a,b){if(a?a.vb:a)return a.vb(a,b);var c;c=Wa[m(null==a?null:a)];if(!c&&(c=Wa._,!c))throw x("ISet.-disjoin",a);return c.call(null,a,b)}
function Xa(a){if(a?a.Ia:a)return a.Ia(a);var b;b=Xa[m(null==a?null:a)];if(!b&&(b=Xa._,!b))throw x("IStack.-peek",a);return b.call(null,a)}function Ya(a){if(a?a.Ja:a)return a.Ja(a);var b;b=Ya[m(null==a?null:a)];if(!b&&(b=Ya._,!b))throw x("IStack.-pop",a);return b.call(null,a)}var Za={};function $a(a,b,c){if(a?a.Pa:a)return a.Pa(a,b,c);var d;d=$a[m(null==a?null:a)];if(!d&&(d=$a._,!d))throw x("IVector.-assoc-n",a);return d.call(null,a,b,c)}
function ab(a){if(a?a.ub:a)return a.ub(a);var b;b=ab[m(null==a?null:a)];if(!b&&(b=ab._,!b))throw x("IDeref.-deref",a);return b.call(null,a)}var bb={};function cb(a){if(a?a.D:a)return a.D(a);var b;b=cb[m(null==a?null:a)];if(!b&&(b=cb._,!b))throw x("IMeta.-meta",a);return b.call(null,a)}var db={};function eb(a,b){if(a?a.F:a)return a.F(a,b);var c;c=eb[m(null==a?null:a)];if(!c&&(c=eb._,!c))throw x("IWithMeta.-with-meta",a);return c.call(null,a,b)}
var fb={},gb=function(){function a(a,b,c){if(a?a.M:a)return a.M(a,b,c);var h;h=gb[m(null==a?null:a)];if(!h&&(h=gb._,!h))throw x("IReduce.-reduce",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.N:a)return a.N(a,b);var c;c=gb[m(null==a?null:a)];if(!c&&(c=gb._,!c))throw x("IReduce.-reduce",a);return c.call(null,a,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();
function hb(a,b,c){if(a?a.Za:a)return a.Za(a,b,c);var d;d=hb[m(null==a?null:a)];if(!d&&(d=hb._,!d))throw x("IKVReduce.-kv-reduce",a);return d.call(null,a,b,c)}function ib(a,b){if(a?a.v:a)return a.v(a,b);var c;c=ib[m(null==a?null:a)];if(!c&&(c=ib._,!c))throw x("IEquiv.-equiv",a);return c.call(null,a,b)}function jb(a){if(a?a.B:a)return a.B(a);var b;b=jb[m(null==a?null:a)];if(!b&&(b=jb._,!b))throw x("IHash.-hash",a);return b.call(null,a)}var kb={};
function lb(a){if(a?a.H:a)return a.H(a);var b;b=lb[m(null==a?null:a)];if(!b&&(b=lb._,!b))throw x("ISeqable.-seq",a);return b.call(null,a)}var mb={},nb={},ob={};function pb(a){if(a?a.Xa:a)return a.Xa(a);var b;b=pb[m(null==a?null:a)];if(!b&&(b=pb._,!b))throw x("IReversible.-rseq",a);return b.call(null,a)}function qb(a,b){if(a?a.yb:a)return a.yb(a,b);var c;c=qb[m(null==a?null:a)];if(!c&&(c=qb._,!c))throw x("ISorted.-sorted-seq",a);return c.call(null,a,b)}
function rb(a,b,c){if(a?a.zb:a)return a.zb(a,b,c);var d;d=rb[m(null==a?null:a)];if(!d&&(d=rb._,!d))throw x("ISorted.-sorted-seq-from",a);return d.call(null,a,b,c)}function sb(a,b){if(a?a.xb:a)return a.xb(a,b);var c;c=sb[m(null==a?null:a)];if(!c&&(c=sb._,!c))throw x("ISorted.-entry-key",a);return c.call(null,a,b)}function tb(a){if(a?a.wb:a)return a.wb(a);var b;b=tb[m(null==a?null:a)];if(!b&&(b=tb._,!b))throw x("ISorted.-comparator",a);return b.call(null,a)}
function ub(a,b){if(a?a.Sb:a)return a.Sb(0,b);var c;c=ub[m(null==a?null:a)];if(!c&&(c=ub._,!c))throw x("IWriter.-write",a);return c.call(null,a,b)}var vb={};function wb(a,b,c){if(a?a.w:a)return a.w(a,b,c);var d;d=wb[m(null==a?null:a)];if(!d&&(d=wb._,!d))throw x("IPrintWithWriter.-pr-writer",a);return d.call(null,a,b,c)}function xb(a,b,c){if(a?a.Rb:a)return a.Rb(0,b,c);var d;d=xb[m(null==a?null:a)];if(!d&&(d=xb._,!d))throw x("IWatchable.-notify-watches",a);return d.call(null,a,b,c)}
function yb(a){if(a?a.Wa:a)return a.Wa(a);var b;b=yb[m(null==a?null:a)];if(!b&&(b=yb._,!b))throw x("IEditableCollection.-as-transient",a);return b.call(null,a)}function zb(a,b){if(a?a.Ka:a)return a.Ka(a,b);var c;c=zb[m(null==a?null:a)];if(!c&&(c=zb._,!c))throw x("ITransientCollection.-conj!",a);return c.call(null,a,b)}function Ab(a){if(a?a.Oa:a)return a.Oa(a);var b;b=Ab[m(null==a?null:a)];if(!b&&(b=Ab._,!b))throw x("ITransientCollection.-persistent!",a);return b.call(null,a)}
function Bb(a,b,c){if(a?a.cb:a)return a.cb(a,b,c);var d;d=Bb[m(null==a?null:a)];if(!d&&(d=Bb._,!d))throw x("ITransientAssociative.-assoc!",a);return d.call(null,a,b,c)}function Cb(a,b){if(a?a.Ab:a)return a.Ab(a,b);var c;c=Cb[m(null==a?null:a)];if(!c&&(c=Cb._,!c))throw x("ITransientMap.-dissoc!",a);return c.call(null,a,b)}function Db(a,b,c){if(a?a.Pb:a)return a.Pb(0,b,c);var d;d=Db[m(null==a?null:a)];if(!d&&(d=Db._,!d))throw x("ITransientVector.-assoc-n!",a);return d.call(null,a,b,c)}
function Eb(a){if(a?a.Qb:a)return a.Qb();var b;b=Eb[m(null==a?null:a)];if(!b&&(b=Eb._,!b))throw x("ITransientVector.-pop!",a);return b.call(null,a)}function Fb(a,b){if(a?a.Ob:a)return a.Ob(0,b);var c;c=Fb[m(null==a?null:a)];if(!c&&(c=Fb._,!c))throw x("ITransientSet.-disjoin!",a);return c.call(null,a,b)}function Gb(a){if(a?a.Kb:a)return a.Kb();var b;b=Gb[m(null==a?null:a)];if(!b&&(b=Gb._,!b))throw x("IChunk.-drop-first",a);return b.call(null,a)}
function Hb(a){if(a?a.sb:a)return a.sb(a);var b;b=Hb[m(null==a?null:a)];if(!b&&(b=Hb._,!b))throw x("IChunkedSeq.-chunked-first",a);return b.call(null,a)}function Ib(a){if(a?a.tb:a)return a.tb(a);var b;b=Ib[m(null==a?null:a)];if(!b&&(b=Ib._,!b))throw x("IChunkedSeq.-chunked-rest",a);return b.call(null,a)}function Jb(a){if(a?a.rb:a)return a.rb(a);var b;b=Jb[m(null==a?null:a)];if(!b&&(b=Jb._,!b))throw x("IChunkedNext.-chunked-next",a);return b.call(null,a)}
function Kb(a){this.vc=a;this.q=0;this.i=1073741824}Kb.prototype.Sb=function(a,b){return this.vc.append(b)};function Lb(a){var b=new ea;a.w(null,new Kb(b),ka());return""+A.b(b)}var Mb="undefined"!==typeof Math.imul&&0!==(Math.imul.a?Math.imul.a(4294967295,5):Math.imul.call(null,4294967295,5))?function(a,b){return Math.imul(a,b)}:function(a,b){var c=a&65535,d=b&65535;return c*d+((a>>>16&65535)*d+c*(b>>>16&65535)<<16>>>0)|0};function Nb(a){a=Mb(a,3432918353);return Mb(a<<15|a>>>-15,461845907)}
function Ob(a,b){var c=a^b;return Mb(c<<13|c>>>-13,5)+3864292196}function Pb(a,b){var c=a^b,c=Mb(c^c>>>16,2246822507),c=Mb(c^c>>>13,3266489909);return c^c>>>16}var Qb={},Rb=0;function Sb(a){255<Rb&&(Qb={},Rb=0);var b=Qb[a];if("number"!==typeof b){a:if(null!=a)if(b=a.length,0<b){for(var c=0,d=0;;)if(c<b)var e=c+1,d=Mb(31,d)+a.charCodeAt(c),c=e;else{b=d;break a}b=void 0}else b=0;else b=0;Qb[a]=b;Rb+=1}return a=b}
function Tb(a){a&&(a.i&4194304||a.Dc)?a=a.B(null):"number"===typeof a?a=Math.floor(a)%2147483647:!0===a?a=1:!1===a?a=0:"string"===typeof a?(a=Sb(a),0!==a&&(a=Nb(a),a=Ob(0,a),a=Pb(a,4))):a=null==a?0:u?jb(a):null;return a}
function Ub(a){var b;b=a.name;var c;a:{c=1;for(var d=0;;)if(c<b.length){var e=c+2,d=Ob(d,Nb(b.charCodeAt(c-1)|b.charCodeAt(c)<<16));c=e}else{c=d;break a}c=void 0}c=1===(b.length&1)?c^Nb(b.charCodeAt(b.length-1)):c;b=Pb(c,Mb(2,b.length));a=Sb(a.fa);return b^a+2654435769+(b<<6)+(b>>2)}
function Vb(a,b){if(r(Wb.a?Wb.a(a,b):Wb.call(null,a,b)))return 0;var c=sa(a.fa);if(r(c?b.fa:c))return-1;if(r(a.fa)){if(sa(b.fa))return 1;c=Xb.a?Xb.a(a.fa,b.fa):Xb.call(null,a.fa,b.fa);return 0===c?Xb.a?Xb.a(a.name,b.name):Xb.call(null,a.name,b.name):c}return Yb?Xb.a?Xb.a(a.name,b.name):Xb.call(null,a.name,b.name):null}function Zb(a,b,c,d,e){this.fa=a;this.name=b;this.Na=c;this.Ua=d;this.W=e;this.i=2154168321;this.q=4096}g=Zb.prototype;g.w=function(a,b){return ub(b,this.Na)};
g.B=function(){var a=this.Ua;return null!=a?a:this.Ua=a=Ub(this)};g.F=function(a,b){return new Zb(this.fa,this.name,this.Na,this.Ua,b)};g.D=function(){return this.W};g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return La.c(c,this,null);case 3:return La.c(c,this,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return La.c(a,this,null)};
g.a=function(a,b){return La.c(a,this,b)};g.v=function(a,b){return b instanceof Zb?this.Na===b.Na:!1};g.toString=function(){return this.Na};var $b=function(){function a(a,b){var c=null!=a?""+A.b(a)+"/"+A.b(b):b;return new Zb(a,b,c,null,null)}function b(a){return a instanceof Zb?a:c.a(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();
function E(a){if(null==a)return null;if(a&&(a.i&8388608||a.hc))return a.H(null);if(a instanceof Array||"string"===typeof a)return 0===a.length?null:new ac(a,0);if(s(kb,a))return lb(a);if(u)throw Error(""+A.b(a)+" is not ISeqable");return null}function F(a){if(null==a)return null;if(a&&(a.i&64||a.bb))return a.Q(null);a=E(a);return null==a?null:Ha(a)}function G(a){return null!=a?a&&(a.i&64||a.bb)?a.S(null):(a=E(a))?Ia(a):H:H}function I(a){return null==a?null:a&&(a.i&128||a.ob)?a.U(null):E(G(a))}
var Wb=function(){function a(a,b){return null==a?null==b:a===b||ib(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(b.a(a,d))if(I(e))a=d,d=F(e),e=I(e);else return b.a(d,F(e));else return!1}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return!0;case 2:return a.call(this,b,
e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.b=function(){return!0};b.a=a;b.d=c.d;return b}();function bc(a,b){var c=Nb(a),c=Ob(0,c);return Pb(c,b)}function cc(a){var b=0,c=1;for(a=E(a);;)if(null!=a)b+=1,c=Mb(31,c)+Tb(F(a))|0,a=I(a);else return bc(c,b)}function dc(a){var b=0,c=0;for(a=E(a);;)if(null!=a)b+=1,c=c+Tb(F(a))|0,a=I(a);else return bc(c,b)}za["null"]=!0;Aa["null"]=function(){return 0};
Date.prototype.v=function(a,b){return b instanceof Date&&this.toString()===b.toString()};ib.number=function(a,b){return a===b};bb["function"]=!0;cb["function"]=function(){return null};ya["function"]=!0;jb._=function(a){return a[ba]||(a[ba]=++ca)};function ec(a){this.l=a;this.q=0;this.i=32768}ec.prototype.ub=function(){return this.l};function fc(a){return a instanceof ec}
var gc=function(){function a(a,b,c,d){for(var l=Aa(a);;)if(d<l){c=b.a?b.a(c,D.a(a,d)):b.call(null,c,D.a(a,d));if(fc(c))return K.b?K.b(c):K.call(null,c);d+=1}else return c}function b(a,b,c){for(var d=Aa(a),l=0;;)if(l<d){c=b.a?b.a(c,D.a(a,l)):b.call(null,c,D.a(a,l));if(fc(c))return K.b?K.b(c):K.call(null,c);l+=1}else return c}function c(a,b){var c=Aa(a);if(0===c)return b.o?b.o():b.call(null);for(var d=D.a(a,0),l=1;;)if(l<c){d=b.a?b.a(d,D.a(a,l)):b.call(null,d,D.a(a,l));if(fc(d))return K.b?K.b(d):K.call(null,
d);l+=1}else return d}var d=null,d=function(d,f,h,k){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,h);case 4:return a.call(this,d,f,h,k)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}(),hc=function(){function a(a,b,c,d){for(var l=a.length;;)if(d<l){c=b.a?b.a(c,a[d]):b.call(null,c,a[d]);if(fc(c))return K.b?K.b(c):K.call(null,c);d+=1}else return c}function b(a,b,c){for(var d=a.length,l=0;;)if(l<d){c=b.a?b.a(c,a[l]):b.call(null,c,
a[l]);if(fc(c))return K.b?K.b(c):K.call(null,c);l+=1}else return c}function c(a,b){var c=a.length;if(0===a.length)return b.o?b.o():b.call(null);for(var d=a[0],l=1;;)if(l<c){d=b.a?b.a(d,a[l]):b.call(null,d,a[l]);if(fc(d))return K.b?K.b(d):K.call(null,d);l+=1}else return d}var d=null,d=function(d,f,h,k){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,h);case 4:return a.call(this,d,f,h,k)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}();
function ic(a){return a?a.i&2||a.Yb?!0:a.i?!1:s(za,a):s(za,a)}function jc(a){return a?a.i&16||a.Lb?!0:a.i?!1:s(Ea,a):s(Ea,a)}function ac(a,b){this.e=a;this.p=b;this.i=166199550;this.q=8192}g=ac.prototype;g.toString=function(){return Lb(this)};g.J=function(a,b){var c=b+this.p;return c<this.e.length?this.e[c]:null};g.aa=function(a,b,c){a=b+this.p;return a<this.e.length?this.e[a]:c};g.U=function(){return this.p+1<this.e.length?new ac(this.e,this.p+1):null};g.L=function(){return this.e.length-this.p};
g.Xa=function(){var a=Aa(this);return 0<a?new kc(this,a-1,null):null};g.B=function(){return cc(this)};g.v=function(a,b){return lc.a?lc.a(this,b):lc.call(null,this,b)};g.I=function(){return H};g.N=function(a,b){return hc.n(this.e,b,this.e[this.p],this.p+1)};g.M=function(a,b,c){return hc.n(this.e,b,c,this.p)};g.Q=function(){return this.e[this.p]};g.S=function(){return this.p+1<this.e.length?new ac(this.e,this.p+1):H};g.H=function(){return this};
g.G=function(a,b){return M.a?M.a(b,this):M.call(null,b,this)};
var mc=function(){function a(a,b){return b<a.length?new ac(a,b):null}function b(a){return c.a(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),J=function(){function a(a,b){return mc.a(a,b)}function b(a){return mc.a(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+
arguments.length);};c.b=b;c.a=a;return c}();function kc(a,b,c){this.jb=a;this.p=b;this.j=c;this.i=32374990;this.q=8192}g=kc.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.U=function(){return 0<this.p?new kc(this.jb,this.p-1,null):null};g.L=function(){return this.p+1};g.B=function(){return cc(this)};g.v=function(a,b){return lc.a?lc.a(this,b):lc.call(null,this,b)};g.I=function(){return N.a?N.a(H,this.j):N.call(null,H,this.j)};
g.N=function(a,b){return nc.a?nc.a(b,this):nc.call(null,b,this)};g.M=function(a,b,c){return nc.c?nc.c(b,c,this):nc.call(null,b,c,this)};g.Q=function(){return D.a(this.jb,this.p)};g.S=function(){return 0<this.p?new kc(this.jb,this.p-1,null):H};g.H=function(){return this};g.F=function(a,b){return new kc(this.jb,this.p,b)};g.G=function(a,b){return M.a?M.a(b,this):M.call(null,b,this)};function oc(a){for(;;){var b=I(a);if(null!=b)a=b;else return F(a)}}ib._=function(a,b){return a===b};
var pc=function(){function a(a,b){return null!=a?Da(a,b):Da(H,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(r(e))a=b.a(a,d),d=F(e),e=I(e);else return b.a(a,d)}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+
arguments.length);};b.k=2;b.f=c.f;b.a=a;b.d=c.d;return b}();function qc(a){return null==a?null:Ba(a)}function O(a){if(null!=a)if(a&&(a.i&2||a.Yb))a=a.L(null);else if(a instanceof Array)a=a.length;else if("string"===typeof a)a=a.length;else if(s(za,a))a=Aa(a);else if(u)a:{a=E(a);for(var b=0;;){if(ic(a)){a=b+Aa(a);break a}a=I(a);b+=1}a=void 0}else a=null;else a=0;return a}
var rc=function(){function a(a,b,c){for(;;){if(null==a)return c;if(0===b)return E(a)?F(a):c;if(jc(a))return D.c(a,b,c);if(E(a))a=I(a),b-=1;else return u?c:null}}function b(a,b){for(;;){if(null==a)throw Error("Index out of bounds");if(0===b){if(E(a))return F(a);throw Error("Index out of bounds");}if(jc(a))return D.a(a,b);if(E(a)){var c=I(a),h=b-1;a=c;b=h}else{if(u)throw Error("Index out of bounds");return null}}}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),P=function(){function a(a,b,c){if("number"!==typeof b)throw Error("index argument to nth must be a number.");if(null==a)return c;if(a&&(a.i&16||a.Lb))return a.aa(null,b,c);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:c;if(s(Ea,a))return D.a(a,b);if(a?a.i&64||a.bb||(a.i?0:s(Fa,a)):s(Fa,a))return rc.c(a,b,c);if(u)throw Error("nth not supported on this type "+A.b(ua(ta(a))));return null}function b(a,
b){if("number"!==typeof b)throw Error("index argument to nth must be a number");if(null==a)return a;if(a&&(a.i&16||a.Lb))return a.J(null,b);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:null;if(s(Ea,a))return D.a(a,b);if(a?a.i&64||a.bb||(a.i?0:s(Fa,a)):s(Fa,a))return rc.a(a,b);if(u)throw Error("nth not supported on this type "+A.b(ua(ta(a))));return null}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+
arguments.length);};c.a=b;c.c=a;return c}(),Q=function(){function a(a,b,c){return null!=a?a&&(a.i&256||a.Mb)?a.C(null,b,c):a instanceof Array?b<a.length?a[b]:c:"string"===typeof a?b<a.length?a[b]:c:s(Ka,a)?La.c(a,b,c):u?c:null:c}function b(a,b){return null==a?null:a&&(a.i&256||a.Mb)?a.u(null,b):a instanceof Array?b<a.length?a[b]:null:"string"===typeof a?b<a.length?a[b]:null:s(Ka,a)?La.a(a,b):null}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),R=function(){function a(a,b,c){return null!=a?Oa(a,b,c):sc.a?sc.a([b],[c]):sc.call(null,[b],[c])}var b=null,c=function(){function a(b,d,k,l){var n=null;3<arguments.length&&(n=J(Array.prototype.slice.call(arguments,3),0));return c.call(this,b,d,k,n)}function c(a,d,e,l){for(;;)if(a=b.c(a,d,e),r(l))d=F(l),e=F(I(l)),l=I(I(l));else return a}a.k=3;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=I(a);var l=F(a);a=G(a);return c(b,
d,l,a)};a.d=c;return a}(),b=function(b,e,f,h){switch(arguments.length){case 3:return a.call(this,b,e,f);default:return c.d(b,e,f,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};b.k=3;b.f=c.f;b.c=a;b.d=c.d;return b}(),tc=function(){function a(a,b){return null==a?null:Qa(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==a)return null;a=b.a(a,d);
if(r(e))d=F(e),e=I(e);else return a}}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}();function uc(a){var b="function"==m(a);return b?b:a?r(r(null)?null:a.Xb)?!0:a.Cb?!1:s(ya,a):s(ya,a)}
function vc(a,b){this.h=a;this.j=b;this.q=0;this.i=393217}g=vc.prototype;
g.call=function(){var a=null;return a=function(a,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,Ra,wc){switch(arguments.length){case 1:var z=a,z=this;return z.h.o?z.h.o():z.h.call(null);case 2:return z=a,z=this,z.h.b?z.h.b(c):z.h.call(null,c);case 3:return z=a,z=this,z.h.a?z.h.a(c,d):z.h.call(null,c,d);case 4:return z=a,z=this,z.h.c?z.h.c(c,d,e):z.h.call(null,c,d,e);case 5:return z=a,z=this,z.h.n?z.h.n(c,d,e,f):z.h.call(null,c,d,e,f);case 6:return z=a,z=this,z.h.s?z.h.s(c,d,e,f,h):z.h.call(null,c,d,e,f,
h);case 7:return z=a,z=this,z.h.X?z.h.X(c,d,e,f,h,k):z.h.call(null,c,d,e,f,h,k);case 8:return z=a,z=this,z.h.ga?z.h.ga(c,d,e,f,h,k,l):z.h.call(null,c,d,e,f,h,k,l);case 9:return z=a,z=this,z.h.Ga?z.h.Ga(c,d,e,f,h,k,l,n):z.h.call(null,c,d,e,f,h,k,l,n);case 10:return z=a,z=this,z.h.Ha?z.h.Ha(c,d,e,f,h,k,l,n,q):z.h.call(null,c,d,e,f,h,k,l,n,q);case 11:return z=a,z=this,z.h.va?z.h.va(c,d,e,f,h,k,l,n,q,t):z.h.call(null,c,d,e,f,h,k,l,n,q,t);case 12:return z=a,z=this,z.h.wa?z.h.wa(c,d,e,f,h,k,l,n,q,t,v):
z.h.call(null,c,d,e,f,h,k,l,n,q,t,v);case 13:return z=a,z=this,z.h.xa?z.h.xa(c,d,e,f,h,k,l,n,q,t,v,w):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w);case 14:return z=a,z=this,z.h.ya?z.h.ya(c,d,e,f,h,k,l,n,q,t,v,w,y):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y);case 15:return z=a,z=this,z.h.za?z.h.za(c,d,e,f,h,k,l,n,q,t,v,w,y,B):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B);case 16:return z=a,z=this,z.h.Aa?z.h.Aa(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L);case 17:return z=a,z=this,
z.h.Ba?z.h.Ba(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U);case 18:return z=a,z=this,z.h.Ca?z.h.Ca(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z);case 19:return z=a,z=this,z.h.Da?z.h.Da(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na);case 20:return z=a,z=this,z.h.Ea?z.h.Ea(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga);case 21:return z=
a,z=this,z.h.Fa?z.h.Fa(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,Ra):z.h.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,Ra);case 22:return z=a,z=this,S.bc?S.bc(z.h,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,Ra,wc):S.call(null,z.h,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,Ra,wc)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.o=function(){return this.h.o?this.h.o():this.h.call(null)};
g.b=function(a){return this.h.b?this.h.b(a):this.h.call(null,a)};g.a=function(a,b){return this.h.a?this.h.a(a,b):this.h.call(null,a,b)};g.c=function(a,b,c){return this.h.c?this.h.c(a,b,c):this.h.call(null,a,b,c)};g.n=function(a,b,c,d){return this.h.n?this.h.n(a,b,c,d):this.h.call(null,a,b,c,d)};g.s=function(a,b,c,d,e){return this.h.s?this.h.s(a,b,c,d,e):this.h.call(null,a,b,c,d,e)};g.X=function(a,b,c,d,e,f){return this.h.X?this.h.X(a,b,c,d,e,f):this.h.call(null,a,b,c,d,e,f)};
g.ga=function(a,b,c,d,e,f,h){return this.h.ga?this.h.ga(a,b,c,d,e,f,h):this.h.call(null,a,b,c,d,e,f,h)};g.Ga=function(a,b,c,d,e,f,h,k){return this.h.Ga?this.h.Ga(a,b,c,d,e,f,h,k):this.h.call(null,a,b,c,d,e,f,h,k)};g.Ha=function(a,b,c,d,e,f,h,k,l){return this.h.Ha?this.h.Ha(a,b,c,d,e,f,h,k,l):this.h.call(null,a,b,c,d,e,f,h,k,l)};g.va=function(a,b,c,d,e,f,h,k,l,n){return this.h.va?this.h.va(a,b,c,d,e,f,h,k,l,n):this.h.call(null,a,b,c,d,e,f,h,k,l,n)};
g.wa=function(a,b,c,d,e,f,h,k,l,n,q){return this.h.wa?this.h.wa(a,b,c,d,e,f,h,k,l,n,q):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q)};g.xa=function(a,b,c,d,e,f,h,k,l,n,q,t){return this.h.xa?this.h.xa(a,b,c,d,e,f,h,k,l,n,q,t):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t)};g.ya=function(a,b,c,d,e,f,h,k,l,n,q,t,v){return this.h.ya?this.h.ya(a,b,c,d,e,f,h,k,l,n,q,t,v):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v)};
g.za=function(a,b,c,d,e,f,h,k,l,n,q,t,v,w){return this.h.za?this.h.za(a,b,c,d,e,f,h,k,l,n,q,t,v,w):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v,w)};g.Aa=function(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y){return this.h.Aa?this.h.Aa(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v,w,y)};g.Ba=function(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B){return this.h.Ba?this.h.Ba(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B)};
g.Ca=function(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L){return this.h.Ca?this.h.Ca(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L)};g.Da=function(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U){return this.h.Da?this.h.Da(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U)};
g.Ea=function(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z){return this.h.Ea?this.h.Ea(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z)};g.Fa=function(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na){return this.h.Fa?this.h.Fa(a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na):this.h.call(null,a,b,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na)};g.Xb=!0;g.F=function(a,b){return new vc(this.h,b)};g.D=function(){return this.j};
function N(a,b){return uc(a)&&!(a?a.i&262144||a.oc||(a.i?0:s(db,a)):s(db,a))?new vc(a,b):null==a?null:eb(a,b)}function xc(a){var b=null!=a;return(b?a?a.i&131072||a.ec||(a.i?0:s(bb,a)):s(bb,a):b)?cb(a):null}function yc(a){return null==a?null:Xa(a)}function zc(a){return null==a?null:Ya(a)}
var Ac=function(){function a(a,b){return null==a?null:Wa(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==a)return null;a=b.a(a,d);if(r(e))d=F(e),e=I(e);else return a}}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.d(b,
e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}();function Bc(a){return null==a||sa(E(a))}function Cc(a){return null==a?!1:a?a.i&8||a.Ac?!0:a.i?!1:s(Ca,a):s(Ca,a)}function Dc(a){return null==a?!1:a?a.i&4096||a.jc?!0:a.i?!1:s(Va,a):s(Va,a)}function Ec(a){return a?a.i&512||a.yc?!0:a.i?!1:s(Ma,a):s(Ma,a)}function Fc(a){return a?a.i&16777216||a.ic?!0:a.i?!1:s(mb,a):s(mb,a)}
function Gc(a){return null==a?!1:a?a.i&1024||a.cc?!0:a.i?!1:s(Pa,a):s(Pa,a)}function Hc(a){return a?a.i&16384||a.Gc?!0:a.i?!1:s(Za,a):s(Za,a)}function Ic(a){return a?a.q&512||a.zc?!0:!1:!1}function Jc(a){var b=[];da(a,function(a){return function(b,e){return a.push(e)}}(b));return b}function Kc(a,b,c,d,e){for(;0!==e;)c[d]=a[b],d+=1,e-=1,b+=1}var Lc={};function Mc(a){return null==a?!1:a?a.i&64||a.bb?!0:a.i?!1:s(Fa,a):s(Fa,a)}function Nc(a){return r(a)?!0:!1}
function Oc(a,b){return Q.c(a,b,Lc)===Lc?!1:!0}function Xb(a,b){if(a===b)return 0;if(null==a)return-1;if(null==b)return 1;if(ta(a)===ta(b))return a&&(a.q&2048||a.lb)?a.mb(null,b):ga(a,b);if(u)throw Error("compare on non-nil objects of different types");return null}
var Pc=function(){function a(a,b,c,h){for(;;){var k=Xb(P.a(a,h),P.a(b,h));if(0===k&&h+1<c)h+=1;else return k}}function b(a,b){var f=O(a),h=O(b);return f<h?-1:f>h?1:u?c.n(a,b,f,0):null}var c=null,c=function(c,e,f,h){switch(arguments.length){case 2:return b.call(this,c,e);case 4:return a.call(this,c,e,f,h)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.n=a;return c}();
function Qc(a){return Wb.a(a,Xb)?Xb:function(b,c){var d=a.a?a.a(b,c):a.call(null,b,c);return"number"===typeof d?d:r(d)?-1:r(a.a?a.a(c,b):a.call(null,c,b))?1:0}}
var Sc=function(){function a(a,b){if(E(b)){var c=Rc.b?Rc.b(b):Rc.call(null,b);ha(c,Qc(a));return E(c)}return H}function b(a){return c.a(Xb,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Tc=function(){function a(a,b,c){return Sc.a(function(c,f){return Qc(b).call(null,a.b?a.b(c):a.call(null,c),a.b?a.b(f):a.call(null,f))},c)}function b(a,b){return c.c(a,Xb,b)}
var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),nc=function(){function a(a,b,c){for(c=E(c);;)if(c){b=a.a?a.a(b,F(c)):a.call(null,b,F(c));if(fc(b))return K.b?K.b(b):K.call(null,b);c=I(c)}else return b}function b(a,b){var c=E(b);return c?C.c?C.c(a,F(c),I(c)):C.call(null,a,F(c),I(c)):a.o?a.o():a.call(null)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,
c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),C=function(){function a(a,b,c){return c&&(c.i&524288||c.Nb)?c.M(null,a,b):c instanceof Array?hc.c(c,a,b):"string"===typeof c?hc.c(c,a,b):s(fb,c)?gb.c(c,a,b):u?nc.c(a,b,c):null}function b(a,b){return b&&(b.i&524288||b.Nb)?b.N(null,a):b instanceof Array?hc.a(b,a):"string"===typeof b?hc.a(b,a):s(fb,b)?gb.a(b,a):u?nc.a(a,b):null}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,
c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),Uc=function(){var a=null,b=function(){function a(c,f,h){var k=null;2<arguments.length&&(k=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,f,k)}function b(a,c,d){for(;;)if(a>c)if(I(d))a=c,c=F(d),d=I(d);else return c>F(d);else return!1}a.k=2;a.f=function(a){var c=F(a);a=I(a);var h=F(a);a=G(a);return b(c,h,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 1:return!0;
case 2:return a>d;default:return b.d(a,d,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};a.k=2;a.f=b.f;a.b=function(){return!0};a.a=function(a,b){return a>b};a.d=b.d;return a}(),Vc=function(){var a=null,b=function(){function a(c,f,h){var k=null;2<arguments.length&&(k=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,f,k)}function b(a,c,d){for(;;)if(a>=c)if(I(d))a=c,c=F(d),d=I(d);else return c>=F(d);else return!1}a.k=2;a.f=function(a){var c=F(a);a=I(a);var h=F(a);
a=G(a);return b(c,h,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 1:return!0;case 2:return a>=d;default:return b.d(a,d,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};a.k=2;a.f=b.f;a.b=function(){return!0};a.a=function(a,b){return a>=b};a.d=b.d;return a}();function Wc(a){return a-1}
var Xc=function(){function a(a,b){return a>b?a:b}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){return C.c(b,a>d?a:d,e)}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);
};b.k=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}();function Yc(a){a=(a-a%2)/2;return 0<=a?Math.floor.b?Math.floor.b(a):Math.floor.call(null,a):Math.ceil.b?Math.ceil.b(a):Math.ceil.call(null,a)}function Zc(a){a-=a>>1&1431655765;a=(a&858993459)+(a>>2&858993459);return 16843009*(a+(a>>4)&252645135)>>24}function $c(a){var b=1;for(a=E(a);;)if(a&&0<b)b-=1,a=I(a);else return a}
var A=function(){function a(a){return null==a?"":a.toString()}var b=null,c=function(){function a(b,d){var k=null;1<arguments.length&&(k=J(Array.prototype.slice.call(arguments,1),0));return c.call(this,b,k)}function c(a,d){for(var e=new ea(b.b(a)),l=d;;)if(r(l))e=e.append(b.b(F(l))),l=I(l);else return e.toString()}a.k=1;a.f=function(a){var b=F(a);a=G(a);return c(b,a)};a.d=c;return a}(),b=function(b,e){switch(arguments.length){case 0:return"";case 1:return a.call(this,b);default:return c.d(b,J(arguments,
1))}throw Error("Invalid arity: "+arguments.length);};b.k=1;b.f=c.f;b.o=function(){return""};b.b=a;b.d=c.d;return b}(),ad=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return a.substring(c);case 3:return a.substring(c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return a.substring(c)};a.c=function(a,c,d){return a.substring(c,d)};return a}();
function lc(a,b){return Nc(Fc(b)?function(){for(var c=E(a),d=E(b);;){if(null==c)return null==d;if(null==d)return!1;if(Wb.a(F(c),F(d)))c=I(c),d=I(d);else return u?!1:null}}():null)}function bd(a,b,c,d,e){this.j=a;this.first=b;this.ta=c;this.count=d;this.m=e;this.i=65937646;this.q=8192}g=bd.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.U=function(){return 1===this.count?null:this.ta};g.L=function(){return this.count};g.Ia=function(){return this.first};g.Ja=function(){return Ia(this)};
g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return H};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return this.first};g.S=function(){return 1===this.count?H:this.ta};g.H=function(){return this};g.F=function(a,b){return new bd(b,this.first,this.ta,this.count,this.m)};g.G=function(a,b){return new bd(this.j,b,this,this.count+1,null)};
function cd(a){this.j=a;this.i=65937614;this.q=8192}g=cd.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.U=function(){return null};g.L=function(){return 0};g.Ia=function(){return null};g.Ja=function(){throw Error("Can't pop empty list");};g.B=function(){return 0};g.v=function(a,b){return lc(this,b)};g.I=function(){return this};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return null};g.S=function(){return H};
g.H=function(){return null};g.F=function(a,b){return new cd(b)};g.G=function(a,b){return new bd(this.j,b,null,1,null)};var H=new cd(null);function dd(a){return a?a.i&134217728||a.Fc?!0:a.i?!1:s(ob,a):s(ob,a)}function ed(a){return dd(a)?pb(a):C.c(pc,H,a)}
var fd=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){var b;if(a instanceof ac&&0===a.p)b=a.e;else a:{for(b=[];;)if(null!=a)b.push(a.Q(null)),a=a.U(null);else break a;b=void 0}a=b.length;for(var e=H;;)if(0<a){var f=a-1,e=e.G(null,b[a-1]);a=f}else return e}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}();function gd(a,b,c,d){this.j=a;this.first=b;this.ta=c;this.m=d;this.i=65929452;this.q=8192}
g=gd.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.U=function(){return null==this.ta?null:E(this.ta)};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.j)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return this.first};g.S=function(){return null==this.ta?H:this.ta};g.H=function(){return this};
g.F=function(a,b){return new gd(b,this.first,this.ta,this.m)};g.G=function(a,b){return new gd(null,b,this,this.m)};function M(a,b){var c=null==b;return(c?c:b&&(b.i&64||b.bb))?new gd(null,a,b,null):new gd(null,a,E(b),null)}function T(a,b,c,d){this.fa=a;this.name=b;this.sa=c;this.Ua=d;this.i=2153775105;this.q=4096}g=T.prototype;g.w=function(a,b){return ub(b,":"+A.b(this.sa))};g.B=function(){var a=this.Ua;return null!=a?a:this.Ua=a=Ub(this)+2654435769};
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return Q.a(c,this);case 3:return Q.c(c,this,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return Q.a(a,this)};g.a=function(a,b){return Q.c(a,this,b)};g.v=function(a,b){return b instanceof T?this.sa===b.sa:!1};g.toString=function(){return":"+A.b(this.sa)};
function hd(a,b){return a===b?!0:a instanceof T&&b instanceof T?a.sa===b.sa:!1}
var jd=function(){function a(a,b){return new T(a,b,""+A.b(r(a)?""+A.b(a)+"/":null)+A.b(b),null)}function b(a){if(a instanceof T)return a;if(a instanceof Zb){var b;if(a&&(a.q&4096||a.fc))b=a.fa;else throw Error("Doesn't support namespace: "+A.b(a));return new T(b,id.b?id.b(a):id.call(null,a),a.Na,null)}return"string"===typeof a?(b=a.split("/"),2===b.length?new T(b[0],b[1],a,null):new T(null,b[0],a,null)):null}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,
c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();function V(a,b,c,d){this.j=a;this.Ya=b;this.r=c;this.m=d;this.q=0;this.i=32374988}g=V.prototype;g.toString=function(){return Lb(this)};function kd(a){null!=a.Ya&&(a.r=a.Ya.o?a.Ya.o():a.Ya.call(null),a.Ya=null);return a.r}g.D=function(){return this.j};g.U=function(){lb(this);return null==this.r?null:I(this.r)};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};
g.I=function(){return N(H,this.j)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){lb(this);return null==this.r?null:F(this.r)};g.S=function(){lb(this);return null!=this.r?G(this.r):H};g.H=function(){kd(this);if(null==this.r)return null;for(var a=this.r;;)if(a instanceof V)a=kd(a);else return this.r=a,E(this.r)};g.F=function(a,b){return new V(b,this.Ya,this.r,this.m)};g.G=function(a,b){return M(b,this)};
function ld(a,b){this.qb=a;this.end=b;this.q=0;this.i=2}ld.prototype.L=function(){return this.end};ld.prototype.add=function(a){this.qb[this.end]=a;return this.end+=1};ld.prototype.da=function(){var a=new md(this.qb,0,this.end);this.qb=null;return a};function md(a,b,c){this.e=a;this.O=b;this.end=c;this.q=0;this.i=524306}g=md.prototype;g.N=function(a,b){return hc.n(this.e,b,this.e[this.O],this.O+1)};g.M=function(a,b,c){return hc.n(this.e,b,c,this.O)};
g.Kb=function(){if(this.O===this.end)throw Error("-drop-first of empty chunk");return new md(this.e,this.O+1,this.end)};g.J=function(a,b){return this.e[this.O+b]};g.aa=function(a,b,c){return 0<=b&&b<this.end-this.O?this.e[this.O+b]:c};g.L=function(){return this.end-this.O};
var nd=function(){function a(a,b,c){return new md(a,b,c)}function b(a,b){return new md(a,b,a.length)}function c(a){return new md(a,0,a.length)}var d=null,d=function(d,f,h){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,f);case 3:return a.call(this,d,f,h)}throw Error("Invalid arity: "+arguments.length);};d.b=c;d.a=b;d.c=a;return d}();function od(a,b,c,d){this.da=a;this.oa=b;this.j=c;this.m=d;this.i=31850732;this.q=1536}g=od.prototype;g.toString=function(){return Lb(this)};
g.D=function(){return this.j};g.U=function(){if(1<Aa(this.da))return new od(Gb(this.da),this.oa,this.j,null);var a=lb(this.oa);return null==a?null:a};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.j)};g.Q=function(){return D.a(this.da,0)};g.S=function(){return 1<Aa(this.da)?new od(Gb(this.da),this.oa,this.j,null):null==this.oa?H:this.oa};g.H=function(){return this};g.sb=function(){return this.da};
g.tb=function(){return null==this.oa?H:this.oa};g.F=function(a,b){return new od(this.da,this.oa,b,this.m)};g.G=function(a,b){return M(b,this)};g.rb=function(){return null==this.oa?null:this.oa};function pd(a,b){return 0===Aa(a)?b:new od(a,b,null,null)}function Rc(a){for(var b=[];;)if(E(a))b.push(F(a)),a=I(a);else return b}function qd(a,b){if(ic(a))return O(a);for(var c=a,d=b,e=0;;)if(0<d&&E(c))c=I(c),d-=1,e+=1;else return e}
var sd=function rd(b){return null==b?null:null==I(b)?E(F(b)):u?M(F(b),rd(I(b))):null},td=function(){function a(a,b){return new V(null,function(){var c=E(a);return c?Ic(c)?pd(Hb(c),d.a(Ib(c),b)):M(F(c),d.a(G(c),b)):b},null,null)}function b(a){return new V(null,function(){return a},null,null)}function c(){return new V(null,function(){return null},null,null)}var d=null,e=function(){function a(c,d,e){var f=null;2<arguments.length&&(f=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,
d,f)}function b(a,c,e){return function t(a,b){return new V(null,function(){var c=E(a);return c?Ic(c)?pd(Hb(c),t(Ib(c),b)):M(F(c),t(G(c),b)):r(b)?t(F(b),I(b)):null},null,null)}(d.a(a,c),e)}a.k=2;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=G(a);return b(c,d,a)};a.d=b;return a}(),d=function(d,h,k){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,d);case 2:return a.call(this,d,h);default:return e.d(d,h,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};d.k=
2;d.f=e.f;d.o=c;d.b=b;d.a=a;d.d=e.d;return d}(),ud=function(){function a(a,b,c,d){return M(a,M(b,M(c,d)))}function b(a,b,c){return M(a,M(b,c))}var c=null,d=function(){function a(c,d,e,n,q){var t=null;4<arguments.length&&(t=J(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,n,t)}function b(a,c,d,e,f){return M(a,M(c,M(d,M(e,sd(f)))))}a.k=4;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=I(a);var e=F(a);a=I(a);var q=F(a);a=G(a);return b(c,d,e,q,a)};a.d=b;return a}(),c=function(c,f,
h,k,l){switch(arguments.length){case 1:return E(c);case 2:return M(c,f);case 3:return b.call(this,c,f,h);case 4:return a.call(this,c,f,h,k);default:return d.d(c,f,h,k,J(arguments,4))}throw Error("Invalid arity: "+arguments.length);};c.k=4;c.f=d.f;c.b=function(a){return E(a)};c.a=function(a,b){return M(a,b)};c.c=b;c.n=a;c.d=d.d;return c}();function vd(a){return Ab(a)}
var wd=function(){var a=null,b=function(){function a(c,f,h){var k=null;2<arguments.length&&(k=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,f,k)}function b(a,c,d){for(;;)if(a=zb(a,c),r(d))c=F(d),d=I(d);else return a}a.k=2;a.f=function(a){var c=F(a);a=I(a);var h=F(a);a=G(a);return b(c,h,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 2:return zb(a,d);default:return b.d(a,d,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};a.k=2;a.f=b.f;a.a=
function(a,b){return zb(a,b)};a.d=b.d;return a}(),xd=function(){var a=null,b=function(){function a(c,f,h,k){var l=null;3<arguments.length&&(l=J(Array.prototype.slice.call(arguments,3),0));return b.call(this,c,f,h,l)}function b(a,c,d,k){for(;;)if(a=Bb(a,c,d),r(k))c=F(k),d=F(I(k)),k=I(I(k));else return a}a.k=3;a.f=function(a){var c=F(a);a=I(a);var h=F(a);a=I(a);var k=F(a);a=G(a);return b(c,h,k,a)};a.d=b;return a}(),a=function(a,d,e,f){switch(arguments.length){case 3:return Bb(a,d,e);default:return b.d(a,
d,e,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};a.k=3;a.f=b.f;a.c=function(a,b,e){return Bb(a,b,e)};a.d=b.d;return a}(),yd=function(){var a=null,b=function(){function a(c,f,h){var k=null;2<arguments.length&&(k=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,f,k)}function b(a,c,d){for(;;)if(a=Cb(a,c),r(d))c=F(d),d=I(d);else return a}a.k=2;a.f=function(a){var c=F(a);a=I(a);var h=F(a);a=G(a);return b(c,h,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 2:return Cb(a,
d);default:return b.d(a,d,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};a.k=2;a.f=b.f;a.a=function(a,b){return Cb(a,b)};a.d=b.d;return a}(),zd=function(){var a=null,b=function(){function a(c,f,h){var k=null;2<arguments.length&&(k=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,f,k)}function b(a,c,d){for(;;)if(a=Fb(a,c),r(d))c=F(d),d=I(d);else return a}a.k=2;a.f=function(a){var c=F(a);a=I(a);var h=F(a);a=G(a);return b(c,h,a)};a.d=b;return a}(),a=function(a,d,
e){switch(arguments.length){case 2:return Fb(a,d);default:return b.d(a,d,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};a.k=2;a.f=b.f;a.a=function(a,b){return Fb(a,b)};a.d=b.d;return a}();
function Ad(a,b,c){var d=E(c);if(0===b)return a.o?a.o():a.call(null);c=Ha(d);var e=Ia(d);if(1===b)return a.b?a.b(c):a.b?a.b(c):a.call(null,c);var d=Ha(e),f=Ia(e);if(2===b)return a.a?a.a(c,d):a.a?a.a(c,d):a.call(null,c,d);var e=Ha(f),h=Ia(f);if(3===b)return a.c?a.c(c,d,e):a.c?a.c(c,d,e):a.call(null,c,d,e);var f=Ha(h),k=Ia(h);if(4===b)return a.n?a.n(c,d,e,f):a.n?a.n(c,d,e,f):a.call(null,c,d,e,f);var h=Ha(k),l=Ia(k);if(5===b)return a.s?a.s(c,d,e,f,h):a.s?a.s(c,d,e,f,h):a.call(null,c,d,e,f,h);var k=Ha(l),
n=Ia(l);if(6===b)return a.X?a.X(c,d,e,f,h,k):a.X?a.X(c,d,e,f,h,k):a.call(null,c,d,e,f,h,k);var l=Ha(n),q=Ia(n);if(7===b)return a.ga?a.ga(c,d,e,f,h,k,l):a.ga?a.ga(c,d,e,f,h,k,l):a.call(null,c,d,e,f,h,k,l);var n=Ha(q),t=Ia(q);if(8===b)return a.Ga?a.Ga(c,d,e,f,h,k,l,n):a.Ga?a.Ga(c,d,e,f,h,k,l,n):a.call(null,c,d,e,f,h,k,l,n);var q=Ha(t),v=Ia(t);if(9===b)return a.Ha?a.Ha(c,d,e,f,h,k,l,n,q):a.Ha?a.Ha(c,d,e,f,h,k,l,n,q):a.call(null,c,d,e,f,h,k,l,n,q);var t=Ha(v),w=Ia(v);if(10===b)return a.va?a.va(c,d,e,
f,h,k,l,n,q,t):a.va?a.va(c,d,e,f,h,k,l,n,q,t):a.call(null,c,d,e,f,h,k,l,n,q,t);var v=Ha(w),y=Ia(w);if(11===b)return a.wa?a.wa(c,d,e,f,h,k,l,n,q,t,v):a.wa?a.wa(c,d,e,f,h,k,l,n,q,t,v):a.call(null,c,d,e,f,h,k,l,n,q,t,v);var w=Ha(y),B=Ia(y);if(12===b)return a.xa?a.xa(c,d,e,f,h,k,l,n,q,t,v,w):a.xa?a.xa(c,d,e,f,h,k,l,n,q,t,v,w):a.call(null,c,d,e,f,h,k,l,n,q,t,v,w);var y=Ha(B),L=Ia(B);if(13===b)return a.ya?a.ya(c,d,e,f,h,k,l,n,q,t,v,w,y):a.ya?a.ya(c,d,e,f,h,k,l,n,q,t,v,w,y):a.call(null,c,d,e,f,h,k,l,n,q,
t,v,w,y);var B=Ha(L),U=Ia(L);if(14===b)return a.za?a.za(c,d,e,f,h,k,l,n,q,t,v,w,y,B):a.za?a.za(c,d,e,f,h,k,l,n,q,t,v,w,y,B):a.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B);var L=Ha(U),Z=Ia(U);if(15===b)return a.Aa?a.Aa(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L):a.Aa?a.Aa(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L):a.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L);var U=Ha(Z),na=Ia(Z);if(16===b)return a.Ba?a.Ba(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U):a.Ba?a.Ba(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U):a.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U);var Z=
Ha(na),Ga=Ia(na);if(17===b)return a.Ca?a.Ca(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z):a.Ca?a.Ca(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z):a.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z);var na=Ha(Ga),Ra=Ia(Ga);if(18===b)return a.Da?a.Da(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na):a.Da?a.Da(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na):a.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na);Ga=Ha(Ra);Ra=Ia(Ra);if(19===b)return a.Ea?a.Ea(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga):a.Ea?a.Ea(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga):a.call(null,
c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga);var wc=Ha(Ra);Ia(Ra);if(20===b)return a.Fa?a.Fa(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,wc):a.Fa?a.Fa(c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,wc):a.call(null,c,d,e,f,h,k,l,n,q,t,v,w,y,B,L,U,Z,na,Ga,wc);throw Error("Only up to 20 arguments supported on functions");}
var S=function(){function a(a,b,c,d,e){b=ud.n(b,c,d,e);c=a.k;return a.f?(d=qd(b,c+1),d<=c?Ad(a,d,b):a.f(b)):a.apply(a,Rc(b))}function b(a,b,c,d){b=ud.c(b,c,d);c=a.k;return a.f?(d=qd(b,c+1),d<=c?Ad(a,d,b):a.f(b)):a.apply(a,Rc(b))}function c(a,b,c){b=ud.a(b,c);c=a.k;if(a.f){var d=qd(b,c+1);return d<=c?Ad(a,d,b):a.f(b)}return a.apply(a,Rc(b))}function d(a,b){var c=a.k;if(a.f){var d=qd(b,c+1);return d<=c?Ad(a,d,b):a.f(b)}return a.apply(a,Rc(b))}var e=null,f=function(){function a(c,d,e,f,h,w){var y=null;
5<arguments.length&&(y=J(Array.prototype.slice.call(arguments,5),0));return b.call(this,c,d,e,f,h,y)}function b(a,c,d,e,f,h){c=M(c,M(d,M(e,M(f,sd(h)))));d=a.k;return a.f?(e=qd(c,d+1),e<=d?Ad(a,e,c):a.f(c)):a.apply(a,Rc(c))}a.k=5;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=I(a);var e=F(a);a=I(a);var f=F(a);a=I(a);var h=F(a);a=G(a);return b(c,d,e,f,h,a)};a.d=b;return a}(),e=function(e,k,l,n,q,t){switch(arguments.length){case 2:return d.call(this,e,k);case 3:return c.call(this,e,k,l);case 4:return b.call(this,
e,k,l,n);case 5:return a.call(this,e,k,l,n,q);default:return f.d(e,k,l,n,q,J(arguments,5))}throw Error("Invalid arity: "+arguments.length);};e.k=5;e.f=f.f;e.a=d;e.c=c;e.n=b;e.s=a;e.d=f.d;return e}(),Bd=function(){function a(a,b){return!Wb.a(a,b)}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){return sa(S.n(Wb,a,c,d))}a.k=2;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=G(a);return b(c,
d,a)};a.d=b;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return!1;case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.b=function(){return!1};b.a=a;b.d=c.d;return b}();function Cd(a){return E(a)?a:null}function Dd(a,b){for(;;){if(null==E(b))return!0;if(r(a.b?a.b(F(b)):a.call(null,F(b)))){var c=a,d=I(b);a=c;b=d}else return u?!1:null}}
function Ed(a,b){for(;;)if(E(b)){var c=a.b?a.b(F(b)):a.call(null,F(b));if(r(c))return c;var c=a,d=I(b);a=c;b=d}else return null}function Fd(a){return a}
function Gd(a){return function(){var b=null,c=function(){function b(a,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,a,d,l)}function c(b,d,e){return sa(S.n(a,b,d,e))}b.k=2;b.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};b.d=c;return b}(),b=function(b,e,f){switch(arguments.length){case 0:return sa(a.o?a.o():a.call(null));case 1:var h=b;return sa(a.b?a.b(h):a.call(null,h));case 2:var h=b,k=e;return sa(a.a?a.a(h,k):a.call(null,
h,k));default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;return b}()}
var Hd=function(){function a(a,b,c){return function(){var d=null,l=function(){function d(a,b,c,e){var f=null;3<arguments.length&&(f=J(Array.prototype.slice.call(arguments,3),0));return k.call(this,a,b,c,f)}function k(d,l,n,q){return a.b?a.b(b.b?b.b(S.s(c,d,l,n,q)):b.call(null,S.s(c,d,l,n,q))):a.call(null,b.b?b.b(S.s(c,d,l,n,q)):b.call(null,S.s(c,d,l,n,q)))}d.k=3;d.f=function(a){var b=F(a);a=I(a);var c=F(a);a=I(a);var d=F(a);a=G(a);return k(b,c,d,a)};d.d=k;return d}(),d=function(d,k,t,v){switch(arguments.length){case 0:return a.b?
a.b(b.b?b.b(c.o?c.o():c.call(null)):b.call(null,c.o?c.o():c.call(null))):a.call(null,b.b?b.b(c.o?c.o():c.call(null)):b.call(null,c.o?c.o():c.call(null)));case 1:var w=d;return a.b?a.b(b.b?b.b(c.b?c.b(w):c.call(null,w)):b.call(null,c.b?c.b(w):c.call(null,w))):a.call(null,b.b?b.b(c.b?c.b(w):c.call(null,w)):b.call(null,c.b?c.b(w):c.call(null,w)));case 2:var w=d,y=k;return a.b?a.b(b.b?b.b(c.a?c.a(w,y):c.call(null,w,y)):b.call(null,c.a?c.a(w,y):c.call(null,w,y))):a.call(null,b.b?b.b(c.a?c.a(w,y):c.call(null,
w,y)):b.call(null,c.a?c.a(w,y):c.call(null,w,y)));case 3:var w=d,y=k,B=t;return a.b?a.b(b.b?b.b(c.c?c.c(w,y,B):c.call(null,w,y,B)):b.call(null,c.c?c.c(w,y,B):c.call(null,w,y,B))):a.call(null,b.b?b.b(c.c?c.c(w,y,B):c.call(null,w,y,B)):b.call(null,c.c?c.c(w,y,B):c.call(null,w,y,B)));default:return l.d(d,k,t,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};d.k=3;d.f=l.f;return d}()}function b(a,b){return function(){var c=null,d=function(){function c(a,b,e,f){var h=null;3<arguments.length&&
(h=J(Array.prototype.slice.call(arguments,3),0));return d.call(this,a,b,e,h)}function d(c,h,k,l){return a.b?a.b(S.s(b,c,h,k,l)):a.call(null,S.s(b,c,h,k,l))}c.k=3;c.f=function(a){var b=F(a);a=I(a);var c=F(a);a=I(a);var e=F(a);a=G(a);return d(b,c,e,a)};c.d=d;return c}(),c=function(c,h,q,t){switch(arguments.length){case 0:return a.b?a.b(b.o?b.o():b.call(null)):a.call(null,b.o?b.o():b.call(null));case 1:var v=c;return a.b?a.b(b.b?b.b(v):b.call(null,v)):a.call(null,b.b?b.b(v):b.call(null,v));case 2:var v=
c,w=h;return a.b?a.b(b.a?b.a(v,w):b.call(null,v,w)):a.call(null,b.a?b.a(v,w):b.call(null,v,w));case 3:var v=c,w=h,y=q;return a.b?a.b(b.c?b.c(v,w,y):b.call(null,v,w,y)):a.call(null,b.c?b.c(v,w,y):b.call(null,v,w,y));default:return d.d(c,h,q,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};c.k=3;c.f=d.f;return c}()}var c=null,d=function(){function a(c,d,e,n){var q=null;3<arguments.length&&(q=J(Array.prototype.slice.call(arguments,3),0));return b.call(this,c,d,e,q)}function b(a,c,d,
e){return function(a){return function(){function b(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return c.call(this,d)}function c(b){b=S.a(F(a),b);for(var d=I(a);;)if(d)b=F(d).call(null,b),d=I(d);else return b}b.k=0;b.f=function(a){a=E(a);return c(a)};b.d=c;return b}()}(ed(ud.n(a,c,d,e)))}a.k=3;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=I(a);var e=F(a);a=G(a);return b(c,d,e,a)};a.d=b;return a}(),c=function(c,f,h,k){switch(arguments.length){case 0:return Fd;
case 1:return c;case 2:return b.call(this,c,f);case 3:return a.call(this,c,f,h);default:return d.d(c,f,h,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};c.k=3;c.f=d.f;c.o=function(){return Fd};c.b=function(a){return a};c.a=b;c.c=a;c.d=d.d;return c}(),Id=function(){function a(a,b,c,d){return function(){function e(a){var b=null;0<arguments.length&&(b=J(Array.prototype.slice.call(arguments,0),0));return q.call(this,b)}function q(e){return S.s(a,b,c,d,e)}e.k=0;e.f=function(a){a=E(a);
return q(a)};e.d=q;return e}()}function b(a,b,c){return function(){function d(a){var b=null;0<arguments.length&&(b=J(Array.prototype.slice.call(arguments,0),0));return e.call(this,b)}function e(d){return S.n(a,b,c,d)}d.k=0;d.f=function(a){a=E(a);return e(a)};d.d=e;return d}()}function c(a,b){return function(){function c(a){var b=null;0<arguments.length&&(b=J(Array.prototype.slice.call(arguments,0),0));return d.call(this,b)}function d(c){return S.c(a,b,c)}c.k=0;c.f=function(a){a=E(a);return d(a)};
c.d=d;return c}()}var d=null,e=function(){function a(c,d,e,f,t){var v=null;4<arguments.length&&(v=J(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,f,v)}function b(a,c,d,e,f){return function(){function b(a){var c=null;0<arguments.length&&(c=J(Array.prototype.slice.call(arguments,0),0));return h.call(this,c)}function h(b){return S.s(a,c,d,e,td.a(f,b))}b.k=0;b.f=function(a){a=E(a);return h(a)};b.d=h;return b}()}a.k=4;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=I(a);var e=F(a);
a=I(a);var f=F(a);a=G(a);return b(c,d,e,f,a)};a.d=b;return a}(),d=function(d,h,k,l,n){switch(arguments.length){case 1:return d;case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.d(d,h,k,l,J(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.k=4;d.f=e.f;d.b=function(a){return a};d.a=c;d.c=b;d.n=a;d.d=e.d;return d}(),Jd=function(){function a(a,b,c,d){return function(){var l=null,n=function(){function l(a,b,c,d){var e=null;
3<arguments.length&&(e=J(Array.prototype.slice.call(arguments,3),0));return n.call(this,a,b,c,e)}function n(l,q,t,B){return S.s(a,null==l?b:l,null==q?c:q,null==t?d:t,B)}l.k=3;l.f=function(a){var b=F(a);a=I(a);var c=F(a);a=I(a);var d=F(a);a=G(a);return n(b,c,d,a)};l.d=n;return l}(),l=function(l,t,v,w){switch(arguments.length){case 2:var y=l,B=t;return a.a?a.a(null==y?b:y,null==B?c:B):a.call(null,null==y?b:y,null==B?c:B);case 3:var y=l,B=t,L=v;return a.c?a.c(null==y?b:y,null==B?c:B,null==L?d:L):a.call(null,
null==y?b:y,null==B?c:B,null==L?d:L);default:return n.d(l,t,v,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};l.k=3;l.f=n.f;return l}()}function b(a,b,c){return function(){var d=null,l=function(){function d(a,b,c,e){var f=null;3<arguments.length&&(f=J(Array.prototype.slice.call(arguments,3),0));return k.call(this,a,b,c,f)}function k(d,l,n,q){return S.s(a,null==d?b:d,null==l?c:l,n,q)}d.k=3;d.f=function(a){var b=F(a);a=I(a);var c=F(a);a=I(a);var d=F(a);a=G(a);return k(b,c,d,a)};d.d=
k;return d}(),d=function(d,k,t,v){switch(arguments.length){case 2:var w=d,y=k;return a.a?a.a(null==w?b:w,null==y?c:y):a.call(null,null==w?b:w,null==y?c:y);case 3:var w=d,y=k,B=t;return a.c?a.c(null==w?b:w,null==y?c:y,B):a.call(null,null==w?b:w,null==y?c:y,B);default:return l.d(d,k,t,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};d.k=3;d.f=l.f;return d}()}function c(a,b){return function(){var c=null,d=function(){function c(a,b,e,f){var h=null;3<arguments.length&&(h=J(Array.prototype.slice.call(arguments,
3),0));return d.call(this,a,b,e,h)}function d(c,h,k,l){return S.s(a,null==c?b:c,h,k,l)}c.k=3;c.f=function(a){var b=F(a);a=I(a);var c=F(a);a=I(a);var e=F(a);a=G(a);return d(b,c,e,a)};c.d=d;return c}(),c=function(c,h,q,t){switch(arguments.length){case 1:var v=c;return a.b?a.b(null==v?b:v):a.call(null,null==v?b:v);case 2:var v=c,w=h;return a.a?a.a(null==v?b:v,w):a.call(null,null==v?b:v,w);case 3:var v=c,w=h,y=q;return a.c?a.c(null==v?b:v,w,y):a.call(null,null==v?b:v,w,y);default:return d.d(c,h,q,J(arguments,
3))}throw Error("Invalid arity: "+arguments.length);};c.k=3;c.f=d.f;return c}()}var d=null,d=function(d,f,h,k){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,h);case 4:return a.call(this,d,f,h,k)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}(),Kd=function(){function a(a,b,c,e){return new V(null,function(){var n=E(b),q=E(c),t=E(e);return n&&q&&t?M(a.c?a.c(F(n),F(q),F(t)):a.call(null,F(n),F(q),F(t)),d.n(a,G(n),G(q),G(t))):null},
null,null)}function b(a,b,c){return new V(null,function(){var e=E(b),n=E(c);return e&&n?M(a.a?a.a(F(e),F(n)):a.call(null,F(e),F(n)),d.c(a,G(e),G(n))):null},null,null)}function c(a,b){return new V(null,function(){var c=E(b);if(c){if(Ic(c)){for(var e=Hb(c),n=O(e),q=new ld(Array(n),0),t=0;;)if(t<n){var v=a.b?a.b(D.a(e,t)):a.call(null,D.a(e,t));q.add(v);t+=1}else break;return pd(q.da(),d.a(a,Ib(c)))}return M(a.b?a.b(F(c)):a.call(null,F(c)),d.a(a,G(c)))}return null},null,null)}var d=null,e=function(){function a(c,
d,e,f,t){var v=null;4<arguments.length&&(v=J(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,f,v)}function b(a,c,e,f,h){var v=function y(a){return new V(null,function(){var b=d.a(E,a);return Dd(Fd,b)?M(d.a(F,b),y(d.a(G,b))):null},null,null)};return d.a(function(){return function(b){return S.a(a,b)}}(v),v(pc.d(h,f,J([e,c],0))))}a.k=4;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=I(a);var e=F(a);a=I(a);var f=F(a);a=G(a);return b(c,d,e,f,a)};a.d=b;return a}(),d=function(d,h,k,l,
n){switch(arguments.length){case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.d(d,h,k,l,J(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.k=4;d.f=e.f;d.a=c;d.c=b;d.n=a;d.d=e.d;return d}(),Md=function Ld(b,c){return new V(null,function(){if(0<b){var d=E(c);return d?M(F(d),Ld(b-1,G(d))):null}return null},null,null)};
function Nd(a,b){return new V(null,function(c){return function(){return c(a,b)}}(function(a,b){for(;;){var e=E(b);if(0<a&&e){var f=a-1,e=G(e);a=f;b=e}else return e}}),null,null)}
var Od=function(){function a(a,b){return Md(a,c.b(b))}function b(a){return new V(null,function(){return M(a,c.b(a))},null,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Pd=function(){function a(a,b){return Md(a,c.b(b))}function b(a){return new V(null,function(){return M(a.o?a.o():a.call(null),c.b(a))},null,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Qd=function(){function a(a,c){return new V(null,function(){var f=E(a),h=E(c);return f&&h?M(F(f),M(F(h),b.a(G(f),G(h)))):null},null,null)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){return new V(null,function(){var c=Kd.a(E,pc.d(e,d,J([a],0)));return Dd(Fd,c)?td.a(Kd.a(F,
c),S.a(b,Kd.a(G,c))):null},null,null)}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.a=a;b.d=c.d;return b}();function Rd(a){return function c(a,e){return new V(null,function(){var f=E(a);return f?M(F(f),c(G(f),e)):E(e)?c(F(e),G(e)):null},null,null)}(null,a)}
var Sd=function(){function a(a,b){return Rd(Kd.a(a,b))}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){return Rd(S.n(Kd,a,c,d))}a.k=2;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=G(a);return b(c,d,a)};a.d=b;return a}(),b=function(b,e,f){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};
b.k=2;b.f=c.f;b.a=a;b.d=c.d;return b}(),Ud=function Td(b,c){return new V(null,function(){var d=E(c);if(d){if(Ic(d)){for(var e=Hb(d),f=O(e),h=new ld(Array(f),0),k=0;;)if(k<f){if(r(b.b?b.b(D.a(e,k)):b.call(null,D.a(e,k)))){var l=D.a(e,k);h.add(l)}k+=1}else break;return pd(h.da(),Td(b,Ib(d)))}e=F(d);d=G(d);return r(b.b?b.b(e):b.call(null,e))?M(e,Td(b,d)):Td(b,d)}return null},null,null)};function Vd(a,b){return Ud(Gd(a),b)}
function Wd(a){var b=Xd;return function d(a){return new V(null,function(){return M(a,r(b.b?b.b(a):b.call(null,a))?Sd.a(d,E.b?E.b(a):E.call(null,a)):null)},null,null)}(a)}function Yd(a,b){return null!=a?a&&(a.q&4||a.Bc)?vd(C.c(zb,yb(a),b)):C.c(Da,a,b):C.c(pc,H,b)}
var Zd=function(){function a(a,b,c,k){return new V(null,function(){var l=E(k);if(l){var n=Md(a,l);return a===O(n)?M(n,d.n(a,b,c,Nd(b,l))):Da(H,Md(a,td.a(n,c)))}return null},null,null)}function b(a,b,c){return new V(null,function(){var k=E(c);if(k){var l=Md(a,k);return a===O(l)?M(l,d.c(a,b,Nd(b,k))):null}return null},null,null)}function c(a,b){return d.c(a,a,b)}var d=null,d=function(d,f,h,k){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,h);case 4:return a.call(this,
d,f,h,k)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}(),$d=function(){function a(a,b,c){var h=Lc;for(b=E(b);;)if(b){var k=a;if(k?k.i&256||k.Mb||(k.i?0:s(Ka,k)):s(Ka,k)){a=Q.c(a,F(b),h);if(h===a)return c;b=I(b)}else return c}else return a}function b(a,b){return c.c(a,b,null)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),ae=
function(){function a(a,b,c,d,f,t){var v=P.c(b,0,null);return(b=$c(b))?R.c(a,v,e.X(Q.a(a,v),b,c,d,f,t)):R.c(a,v,c.n?c.n(Q.a(a,v),d,f,t):c.call(null,Q.a(a,v),d,f,t))}function b(a,b,c,d,f){var t=P.c(b,0,null);return(b=$c(b))?R.c(a,t,e.s(Q.a(a,t),b,c,d,f)):R.c(a,t,c.c?c.c(Q.a(a,t),d,f):c.call(null,Q.a(a,t),d,f))}function c(a,b,c,d){var f=P.c(b,0,null);return(b=$c(b))?R.c(a,f,e.n(Q.a(a,f),b,c,d)):R.c(a,f,c.a?c.a(Q.a(a,f),d):c.call(null,Q.a(a,f),d))}function d(a,b,c){var d=P.c(b,0,null);return(b=$c(b))?
R.c(a,d,e.c(Q.a(a,d),b,c)):R.c(a,d,c.b?c.b(Q.a(a,d)):c.call(null,Q.a(a,d)))}var e=null,f=function(){function a(c,d,e,f,h,w,y){var B=null;6<arguments.length&&(B=J(Array.prototype.slice.call(arguments,6),0));return b.call(this,c,d,e,f,h,w,B)}function b(a,c,d,f,h,k,y){var B=P.c(c,0,null);return(c=$c(c))?R.c(a,B,S.d(e,Q.a(a,B),c,d,f,J([h,k,y],0))):R.c(a,B,S.d(d,Q.a(a,B),f,h,k,J([y],0)))}a.k=6;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=I(a);var e=F(a);a=I(a);var f=F(a);a=I(a);var h=F(a);a=I(a);var y=
F(a);a=G(a);return b(c,d,e,f,h,y,a)};a.d=b;return a}(),e=function(e,k,l,n,q,t,v){switch(arguments.length){case 3:return d.call(this,e,k,l);case 4:return c.call(this,e,k,l,n);case 5:return b.call(this,e,k,l,n,q);case 6:return a.call(this,e,k,l,n,q,t);default:return f.d(e,k,l,n,q,t,J(arguments,6))}throw Error("Invalid arity: "+arguments.length);};e.k=6;e.f=f.f;e.c=d;e.n=c;e.s=b;e.X=a;e.d=f.d;return e}();function be(a,b){this.t=a;this.e=b}
function ce(a){return new be(a,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null])}function de(a){return new be(a.t,va(a.e))}function ee(a){a=a.g;return 32>a?0:a-1>>>5<<5}function fe(a,b,c){for(;;){if(0===b)return c;var d=ce(a);d.e[0]=c;c=d;b-=5}}var he=function ge(b,c,d,e){var f=de(d),h=b.g-1>>>c&31;5===c?f.e[h]=e:(d=d.e[h],b=null!=d?ge(b,c-5,d,e):fe(null,c-5,e),f.e[h]=b);return f};
function ie(a,b){throw Error("No item "+A.b(a)+" in vector of length "+A.b(b));}function je(a){var b=a.root;for(a=a.shift;;)if(0<a)a-=5,b=b.e[0];else return b.e}function ke(a,b){if(b>=ee(a))return a.R;for(var c=a.root,d=a.shift;;)if(0<d)var e=d-5,c=c.e[b>>>d&31],d=e;else return c.e}function le(a,b){return 0<=b&&b<a.g?ke(a,b):ie(b,a.g)}
var ne=function me(b,c,d,e,f){var h=de(d);if(0===c)h.e[e&31]=f;else{var k=e>>>c&31;b=me(b,c-5,d.e[k],e,f);h.e[k]=b}return h},pe=function oe(b,c,d){var e=b.g-2>>>c&31;if(5<c){b=oe(b,c-5,d.e[e]);if(null==b&&0===e)return null;d=de(d);d.e[e]=b;return d}return 0===e?null:u?(d=de(d),d.e[e]=null,d):null};function W(a,b,c,d,e,f){this.j=a;this.g=b;this.shift=c;this.root=d;this.R=e;this.m=f;this.i=167668511;this.q=8196}g=W.prototype;g.toString=function(){return Lb(this)};
g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){return"number"===typeof b?D.c(this,b,c):c};g.Za=function(a,b,c){a=[0,c];for(c=0;;)if(c<this.g){var d=ke(this,c),e=d.length;a:{for(var f=0,h=a[1];;)if(f<e){h=b.c?b.c(h,f+c,d[f]):b.call(null,h,f+c,d[f]);if(fc(h)){d=h;break a}f+=1}else{a[0]=e;d=a[1]=h;break a}d=void 0}if(fc(d))return K.b?K.b(d):K.call(null,d);c+=a[0]}else return a[1]};g.J=function(a,b){return le(this,b)[b&31]};
g.aa=function(a,b,c){return 0<=b&&b<this.g?ke(this,b)[b&31]:c};g.Pa=function(a,b,c){if(0<=b&&b<this.g)return ee(this)<=b?(a=va(this.R),a[b&31]=c,new W(this.j,this.g,this.shift,this.root,a,null)):new W(this.j,this.g,this.shift,ne(this,this.shift,this.root,b,c),this.R,null);if(b===this.g)return Da(this,c);if(u)throw Error("Index "+A.b(b)+" out of bounds  [0,"+A.b(this.g)+"]");return null};g.D=function(){return this.j};g.L=function(){return this.g};g.$a=function(){return D.a(this,0)};
g.ab=function(){return D.a(this,1)};g.Ia=function(){return 0<this.g?D.a(this,this.g-1):null};g.Ja=function(){if(0===this.g)throw Error("Can't pop empty vector");if(1===this.g)return eb(qe,this.j);if(1<this.g-ee(this))return new W(this.j,this.g-1,this.shift,this.root,this.R.slice(0,-1),null);if(u){var a=ke(this,this.g-2),b=pe(this,this.shift,this.root),b=null==b?X:b,c=this.g-1;return 5<this.shift&&null==b.e[1]?new W(this.j,c,this.shift-5,b.e[0],a,null):new W(this.j,c,this.shift,b,a,null)}return null};
g.Xa=function(){return 0<this.g?new kc(this,this.g-1,null):null};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.Wa=function(){return new re(this.g,this.shift,se.b?se.b(this.root):se.call(null,this.root),te.b?te.b(this.R):te.call(null,this.R))};g.I=function(){return N(qe,this.j)};g.N=function(a,b){return gc.a(this,b)};g.M=function(a,b,c){return gc.c(this,b,c)};
g.ua=function(a,b,c){if("number"===typeof b)return $a(this,b,c);throw Error("Vector's key for assoc must be a number.");};g.H=function(){return 0===this.g?null:32>=this.g?new ac(this.R,0):u?ue.n?ue.n(this,je(this),0,0):ue.call(null,this,je(this),0,0):null};g.F=function(a,b){return new W(b,this.g,this.shift,this.root,this.R,this.m)};
g.G=function(a,b){if(32>this.g-ee(this)){for(var c=this.R.length,d=Array(c+1),e=0;;)if(e<c)d[e]=this.R[e],e+=1;else break;d[c]=b;return new W(this.j,this.g+1,this.shift,this.root,d,null)}c=(d=this.g>>>5>1<<this.shift)?this.shift+5:this.shift;d?(d=ce(null),d.e[0]=this.root,e=fe(null,this.shift,new be(null,this.R)),d.e[1]=e):d=he(this,this.shift,this.root,new be(null,this.R));return new W(this.j,this.g+1,c,d,[b],null)};
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.J(null,c);case 3:return this.aa(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.J(null,a)};g.a=function(a,b){return this.aa(null,a,b)};
var X=new be(null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]),qe=new W(null,0,5,X,[],0);function ve(a,b){var c=a.length,d=b?a:va(a);if(32>c)return new W(null,c,5,X,d,null);for(var e=32,f=(new W(null,32,5,X,d.slice(0,32),null)).Wa(null);;)if(e<c)var h=e+1,f=wd.a(f,d[e]),e=h;else return Ab(f)}function we(a){return Ab(C.c(zb,yb(qe),a))}
var xe=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return a instanceof ac&&0===a.p?ve.a?ve.a(a.e,!0):ve.call(null,a.e,!0):we(a)}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}();function ye(a,b,c,d,e,f){this.P=a;this.ea=b;this.p=c;this.O=d;this.j=e;this.m=f;this.i=32243948;this.q=1536}g=ye.prototype;g.toString=function(){return Lb(this)};
g.U=function(){if(this.O+1<this.ea.length){var a=ue.n?ue.n(this.P,this.ea,this.p,this.O+1):ue.call(null,this.P,this.ea,this.p,this.O+1);return null==a?null:a}return Jb(this)};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(qe,this.j)};g.N=function(a,b){return gc.a(ze.c?ze.c(this.P,this.p+this.O,O(this.P)):ze.call(null,this.P,this.p+this.O,O(this.P)),b)};
g.M=function(a,b,c){return gc.c(ze.c?ze.c(this.P,this.p+this.O,O(this.P)):ze.call(null,this.P,this.p+this.O,O(this.P)),b,c)};g.Q=function(){return this.ea[this.O]};g.S=function(){if(this.O+1<this.ea.length){var a=ue.n?ue.n(this.P,this.ea,this.p,this.O+1):ue.call(null,this.P,this.ea,this.p,this.O+1);return null==a?H:a}return Ib(this)};g.H=function(){return this};g.sb=function(){return nd.a(this.ea,this.O)};
g.tb=function(){var a=this.p+this.ea.length;return a<Aa(this.P)?ue.n?ue.n(this.P,ke(this.P,a),a,0):ue.call(null,this.P,ke(this.P,a),a,0):H};g.F=function(a,b){return ue.s?ue.s(this.P,this.ea,this.p,this.O,b):ue.call(null,this.P,this.ea,this.p,this.O,b)};g.G=function(a,b){return M(b,this)};g.rb=function(){var a=this.p+this.ea.length;return a<Aa(this.P)?ue.n?ue.n(this.P,ke(this.P,a),a,0):ue.call(null,this.P,ke(this.P,a),a,0):null};
var ue=function(){function a(a,b,c,d,l){return new ye(a,b,c,d,l,null)}function b(a,b,c,d){return new ye(a,b,c,d,null,null)}function c(a,b,c){return new ye(a,le(a,b),b,c,null,null)}var d=null,d=function(d,f,h,k,l){switch(arguments.length){case 3:return c.call(this,d,f,h);case 4:return b.call(this,d,f,h,k);case 5:return a.call(this,d,f,h,k,l)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.n=b;d.s=a;return d}();
function Ae(a,b,c,d,e){this.j=a;this.ca=b;this.start=c;this.end=d;this.m=e;this.i=166617887;this.q=8192}g=Ae.prototype;g.toString=function(){return Lb(this)};g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){return"number"===typeof b?D.c(this,b,c):c};g.J=function(a,b){return 0>b||this.end<=this.start+b?ie(b,this.end-this.start):D.a(this.ca,this.start+b)};g.aa=function(a,b,c){return 0>b||this.end<=this.start+b?c:D.c(this.ca,this.start+b,c)};
g.Pa=function(a,b,c){var d=this,e=d.start+b;return Be.s?Be.s(d.j,R.c(d.ca,e,c),d.start,function(){var a=d.end,b=e+1;return a>b?a:b}(),null):Be.call(null,d.j,R.c(d.ca,e,c),d.start,function(){var a=d.end,b=e+1;return a>b?a:b}(),null)};g.D=function(){return this.j};g.L=function(){return this.end-this.start};g.Ia=function(){return D.a(this.ca,this.end-1)};
g.Ja=function(){if(this.start===this.end)throw Error("Can't pop empty vector");return Be.s?Be.s(this.j,this.ca,this.start,this.end-1,null):Be.call(null,this.j,this.ca,this.start,this.end-1,null)};g.Xa=function(){return this.start!==this.end?new kc(this,this.end-this.start-1,null):null};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(qe,this.j)};g.N=function(a,b){return gc.a(this,b)};
g.M=function(a,b,c){return gc.c(this,b,c)};g.ua=function(a,b,c){if("number"===typeof b)return $a(this,b,c);throw Error("Subvec's key for assoc must be a number.");};g.H=function(){var a=this;return function(b){return function d(e){return e===a.end?null:M(D.a(a.ca,e),new V(null,function(){return function(){return d(e+1)}}(b),null,null))}}(this)(a.start)};g.F=function(a,b){return Be.s?Be.s(b,this.ca,this.start,this.end,this.m):Be.call(null,b,this.ca,this.start,this.end,this.m)};
g.G=function(a,b){return Be.s?Be.s(this.j,$a(this.ca,this.end,b),this.start,this.end+1,null):Be.call(null,this.j,$a(this.ca,this.end,b),this.start,this.end+1,null)};g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.J(null,c);case 3:return this.aa(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.J(null,a)};
g.a=function(a,b){return this.aa(null,a,b)};function Be(a,b,c,d,e){for(;;)if(b instanceof Ae)c=b.start+c,d=b.start+d,b=b.ca;else{var f=O(b);if(0>c||0>d||c>f||d>f)throw Error("Index out of bounds");return new Ae(a,b,c,d,e)}}
var ze=function(){function a(a,b,c){return Be(null,a,b,c,null)}function b(a,b){return c.c(a,b,O(a))}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();function Ce(a,b){return a===b.t?b:new be(a,va(b.e))}function se(a){return new be({},va(a.e))}
function te(a){var b=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];Kc(a,0,b,0,a.length);return b}
var Ee=function De(b,c,d,e){d=Ce(b.root.t,d);var f=b.g-1>>>c&31;if(5===c)b=e;else{var h=d.e[f];b=null!=h?De(b,c-5,h,e):fe(b.root.t,c-5,e)}d.e[f]=b;return d},Ge=function Fe(b,c,d){d=Ce(b.root.t,d);var e=b.g-2>>>c&31;if(5<c){b=Fe(b,c-5,d.e[e]);if(null==b&&0===e)return null;d.e[e]=b;return d}return 0===e?null:u?(d.e[e]=null,d):null};function re(a,b,c,d){this.g=a;this.shift=b;this.root=c;this.R=d;this.i=275;this.q=88}g=re.prototype;
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){return"number"===typeof b?D.c(this,b,c):c};
g.J=function(a,b){if(this.root.t)return le(this,b)[b&31];throw Error("nth after persistent!");};g.aa=function(a,b,c){return 0<=b&&b<this.g?D.a(this,b):c};g.L=function(){if(this.root.t)return this.g;throw Error("count after persistent!");};
g.Pb=function(a,b,c){var d=this;if(d.root.t){if(0<=b&&b<d.g)return ee(this)<=b?d.R[b&31]=c:(a=function(){return function f(a,k){var l=Ce(d.root.t,k);if(0===a)l.e[b&31]=c;else{var n=b>>>a&31,q=f(a-5,l.e[n]);l.e[n]=q}return l}}(this).call(null,d.shift,d.root),d.root=a),this;if(b===d.g)return zb(this,c);if(u)throw Error("Index "+A.b(b)+" out of bounds for TransientVector of length"+A.b(d.g));return null}throw Error("assoc! after persistent!");};
g.Qb=function(){if(this.root.t){if(0===this.g)throw Error("Can't pop empty vector");if(1===this.g)return this.g=0,this;if(0<(this.g-1&31))return this.g-=1,this;if(u){var a;a:if(a=this.g-2,a>=ee(this))a=this.R;else{for(var b=this.root,c=b,d=this.shift;;)if(0<d)c=Ce(b.t,c.e[a>>>d&31]),d-=5;else{a=c.e;break a}a=void 0}b=Ge(this,this.shift,this.root);b=null!=b?b:new be(this.root.t,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,
null,null,null,null,null,null,null,null]);5<this.shift&&null==b.e[1]?(this.root=Ce(this.root.t,b.e[0]),this.shift-=5):this.root=b;this.g-=1;this.R=a;return this}return null}throw Error("pop! after persistent!");};g.cb=function(a,b,c){if("number"===typeof b)return Db(this,b,c);throw Error("TransientVector's key for assoc! must be a number.");};
g.Ka=function(a,b){if(this.root.t){if(32>this.g-ee(this))this.R[this.g&31]=b;else{var c=new be(this.root.t,this.R),d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];d[0]=b;this.R=d;if(this.g>>>5>1<<this.shift){var d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],e=this.shift+
5;d[0]=this.root;d[1]=fe(this.root.t,this.shift,c);this.root=new be(this.root.t,d);this.shift=e}else this.root=Ee(this,this.shift,this.root,c)}this.g+=1;return this}throw Error("conj! after persistent!");};g.Oa=function(){if(this.root.t){this.root.t=null;var a=this.g-ee(this),b=Array(a);Kc(this.R,0,b,0,a);return new W(null,this.g,this.shift,this.root,b,null)}throw Error("persistent! called twice");};function He(a,b,c,d){this.j=a;this.ba=b;this.pa=c;this.m=d;this.q=0;this.i=31850572}g=He.prototype;
g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.j)};g.Q=function(){return F(this.ba)};g.S=function(){var a=I(this.ba);return a?new He(this.j,a,this.pa,null):null==this.pa?Ba(this):new He(this.j,this.pa,null,null)};g.H=function(){return this};g.F=function(a,b){return new He(b,this.ba,this.pa,this.m)};g.G=function(a,b){return M(b,this)};
function Ie(a,b,c,d,e){this.j=a;this.count=b;this.ba=c;this.pa=d;this.m=e;this.i=31858766;this.q=8192}g=Ie.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.L=function(){return this.count};g.Ia=function(){return F(this.ba)};g.Ja=function(){if(r(this.ba)){var a=I(this.ba);return a?new Ie(this.j,this.count-1,a,this.pa,null):new Ie(this.j,this.count-1,E(this.pa),qe,null)}return this};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};
g.v=function(a,b){return lc(this,b)};g.I=function(){return Je};g.Q=function(){return F(this.ba)};g.S=function(){return G(E(this))};g.H=function(){var a=E(this.pa),b=this.ba;return r(r(b)?b:a)?new He(null,this.ba,E(a),null):null};g.F=function(a,b){return new Ie(b,this.count,this.ba,this.pa,this.m)};g.G=function(a,b){var c;r(this.ba)?(c=this.pa,c=new Ie(this.j,this.count+1,this.ba,pc.a(r(c)?c:qe,b),null)):c=new Ie(this.j,this.count+1,pc.a(this.ba,b),qe,null);return c};var Je=new Ie(null,0,null,qe,0);
function Ke(){this.q=0;this.i=2097152}Ke.prototype.v=function(){return!1};var Le=new Ke;function Me(a,b){return Nc(Gc(b)?O(a)===O(b)?Dd(Fd,Kd.a(function(a){return Wb.a(Q.c(b,F(a),Le),F(I(a)))},a)):null:null)}function Ne(a){this.r=a}Ne.prototype.next=function(){if(null!=this.r){var a=F(this.r);this.r=I(this.r);return{done:!1,value:a}}return{done:!0,value:null}};function Oe(a){return new Ne(E(a))}function Pe(a){this.r=a}
Pe.prototype.next=function(){if(null!=this.r){var a=F(this.r),b=P.c(a,0,null),a=P.c(a,1,null);this.r=I(this.r);return{done:!1,value:[b,a]}}return{done:!0,value:null}};function Qe(a){return new Pe(E(a))}function Re(a){this.r=a}Re.prototype.next=function(){if(null!=this.r){var a=F(this.r);this.r=I(this.r);return{done:!1,value:[a,a]}}return{done:!0,value:null}};function Se(a){return new Re(E(a))}
function Te(a,b){var c=a.e;if(b instanceof T)a:{for(var d=c.length,e=b.sa,f=0;;){if(d<=f){c=-1;break a}var h=c[f];if(h instanceof T&&e===h.sa){c=f;break a}if(u)f+=2;else{c=null;break a}}c=void 0}else if("string"==typeof b||"number"===typeof b)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(b===c[e]){c=e;break a}if(u)e+=2;else{c=null;break a}}c=void 0}else if(b instanceof Zb)a:{d=c.length;e=b.Na;for(f=0;;){if(d<=f){c=-1;break a}h=c[f];if(h instanceof Zb&&e===h.Na){c=f;break a}if(u)f+=2;else{c=null;
break a}}c=void 0}else if(null==b)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(null==c[e]){c=e;break a}if(u)e+=2;else{c=null;break a}}c=void 0}else if(u)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(Wb.a(b,c[e])){c=e;break a}if(u)e+=2;else{c=null;break a}}c=void 0}else c=null;return c}function Ue(a,b,c){this.e=a;this.p=b;this.W=c;this.q=0;this.i=32374990}g=Ue.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.W};
g.U=function(){return this.p<this.e.length-2?new Ue(this.e,this.p+2,this.W):null};g.L=function(){return(this.e.length-this.p)/2};g.B=function(){return cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.W)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return new W(null,2,5,X,[this.e[this.p],this.e[this.p+1]],null)};g.S=function(){return this.p<this.e.length-2?new Ue(this.e,this.p+2,this.W):H};g.H=function(){return this};
g.F=function(a,b){return new Ue(this.e,this.p,b)};g.G=function(a,b){return M(b,this)};function la(a,b,c,d){this.j=a;this.g=b;this.e=c;this.m=d;this.i=16647951;this.q=8196}g=la.prototype;g.toString=function(){return Lb(this)};g.keys=function(){return Oe(Ve.b?Ve.b(this):Ve.call(null,this))};g.entries=function(){return Qe(E(this))};g.values=function(){return Oe(We.b?We.b(this):We.call(null,this))};g.has=function(a){return Oc(this,a)};g.get=function(a){return this.u(null,a)};
g.forEach=function(a){for(var b=E(this),c=null,d=0,e=0;;)if(e<d){var f=c.J(null,e),h=P.c(f,0,null),f=P.c(f,1,null);a.a?a.a(f,h):a.call(null,f,h);e+=1}else if(b=E(b))Ic(b)?(c=Hb(b),b=Ib(b),h=c,d=O(c),c=h):(c=F(b),h=P.c(c,0,null),f=P.c(c,1,null),a.a?a.a(f,h):a.call(null,f,h),b=I(b),c=null,d=0),e=0;else return null};g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){a=Te(this,b);return-1===a?c:this.e[a+1]};
g.Za=function(a,b,c){a=this.e.length;for(var d=0;;)if(d<a){c=b.c?b.c(c,this.e[d],this.e[d+1]):b.call(null,c,this.e[d],this.e[d+1]);if(fc(c))return K.b?K.b(c):K.call(null,c);d+=2}else return c};g.D=function(){return this.j};g.L=function(){return this.g};g.B=function(){var a=this.m;return null!=a?a:this.m=a=dc(this)};g.v=function(a,b){return Me(this,b)};g.Wa=function(){return new Xe({},this.e.length,va(this.e))};g.I=function(){return eb(Ye,this.j)};g.N=function(a,b){return nc.a(b,this)};
g.M=function(a,b,c){return nc.c(b,c,this)};g.nb=function(a,b){if(0<=Te(this,b)){var c=this.e.length,d=c-2;if(0===d)return Ba(this);for(var d=Array(d),e=0,f=0;;){if(e>=c)return new la(this.j,this.g-1,d,null);if(Wb.a(b,this.e[e]))e+=2;else if(u)d[f]=this.e[e],d[f+1]=this.e[e+1],f+=2,e+=2;else return null}}else return this};
g.ua=function(a,b,c){a=Te(this,b);if(-1===a){if(this.g<Ze){a=this.e;for(var d=a.length,e=Array(d+2),f=0;;)if(f<d)e[f]=a[f],f+=1;else break;e[d]=b;e[d+1]=c;return new la(this.j,this.g+1,e,null)}return eb(Oa(Yd($e,this),b,c),this.j)}return c===this.e[a+1]?this:u?(b=va(this.e),b[a+1]=c,new la(this.j,this.g,b,null)):null};g.kb=function(a,b){return-1!==Te(this,b)};g.H=function(){var a=this.e;return 0<=a.length-2?new Ue(a,0,null):null};g.F=function(a,b){return new la(b,this.g,this.e,this.m)};
g.G=function(a,b){if(Hc(b))return Oa(this,D.a(b,0),D.a(b,1));for(var c=this,d=E(b);;){if(null==d)return c;var e=F(d);if(Hc(e))c=Oa(c,D.a(e,0),D.a(e,1)),d=I(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};
g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};var Ye=new la(null,0,[],null),Ze=8;function af(a){for(var b=a.length,c=0,d=yb(Ye);;)if(c<b)var e=c+2,d=Bb(d,a[c],a[c+1]),c=e;else return Ab(d)}function Xe(a,b,c){this.Ra=a;this.ja=b;this.e=c;this.q=56;this.i=258}g=Xe.prototype;
g.Ab=function(a,b){if(r(this.Ra)){var c=Te(this,b);0<=c&&(this.e[c]=this.e[this.ja-2],this.e[c+1]=this.e[this.ja-1],c=this.e,c.pop(),c.pop(),this.ja-=2);return this}throw Error("dissoc! after persistent!");};g.cb=function(a,b,c){if(r(this.Ra)){a=Te(this,b);if(-1===a)return this.ja+2<=2*Ze?(this.ja+=2,this.e.push(b),this.e.push(c),this):xd.c(bf.a?bf.a(this.ja,this.e):bf.call(null,this.ja,this.e),b,c);c!==this.e[a+1]&&(this.e[a+1]=c);return this}throw Error("assoc! after persistent!");};
g.Ka=function(a,b){if(r(this.Ra)){if(b?b.i&2048||b.dc||(b.i?0:s(Sa,b)):s(Sa,b))return Bb(this,cf.b?cf.b(b):cf.call(null,b),df.b?df.b(b):df.call(null,b));for(var c=E(b),d=this;;){var e=F(c);if(r(e))c=I(c),d=Bb(d,cf.b?cf.b(e):cf.call(null,e),df.b?df.b(e):df.call(null,e));else return d}}else throw Error("conj! after persistent!");};g.Oa=function(){if(r(this.Ra))return this.Ra=!1,new la(null,Yc(this.ja),this.e,null);throw Error("persistent! called twice");};g.u=function(a,b){return La.c(this,b,null)};
g.C=function(a,b,c){if(r(this.Ra))return a=Te(this,b),-1===a?c:this.e[a+1];throw Error("lookup after persistent!");};g.L=function(){if(r(this.Ra))return Yc(this.ja);throw Error("count after persistent!");};function bf(a,b){for(var c=yb($e),d=0;;)if(d<a)c=xd.c(c,b[d],b[d+1]),d+=2;else return c}function ef(){this.l=!1}function ff(a,b){return a===b?!0:hd(a,b)?!0:u?Wb.a(a,b):null}
var gf=function(){function a(a,b,c,h,k){a=va(a);a[b]=c;a[h]=k;return a}function b(a,b,c){a=va(a);a[b]=c;return a}var c=null,c=function(c,e,f,h,k){switch(arguments.length){case 3:return b.call(this,c,e,f);case 5:return a.call(this,c,e,f,h,k)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.s=a;return c}();function hf(a,b){var c=Array(a.length-2);Kc(a,0,c,0,2*b);Kc(a,2*(b+1),c,2*b,c.length-2*b);return c}
var jf=function(){function a(a,b,c,h,k,l){a=a.La(b);a.e[c]=h;a.e[k]=l;return a}function b(a,b,c,h){a=a.La(b);a.e[c]=h;return a}var c=null,c=function(c,e,f,h,k,l){switch(arguments.length){case 4:return b.call(this,c,e,f,h);case 6:return a.call(this,c,e,f,h,k,l)}throw Error("Invalid arity: "+arguments.length);};c.n=b;c.X=a;return c}();
function kf(a,b,c){for(var d=a.length,e=0;;)if(e<d){var f=a[e];null!=f?c=b.c?b.c(c,f,a[e+1]):b.call(null,c,f,a[e+1]):(f=a[e+1],c=null!=f?f.Ta(b,c):c);if(fc(c))return K.b?K.b(c):K.call(null,c);e+=2}else return c}function lf(a,b,c){this.t=a;this.A=b;this.e=c}g=lf.prototype;g.La=function(a){if(a===this.t)return this;var b=Zc(this.A),c=Array(0>b?4:2*(b+1));Kc(this.e,0,c,0,2*b);return new lf(a,this.A,c)};
g.gb=function(a,b,c,d,e){var f=1<<(c>>>b&31);if(0===(this.A&f))return this;var h=Zc(this.A&f-1),k=this.e[2*h],l=this.e[2*h+1];return null==k?(b=l.gb(a,b+5,c,d,e),b===l?this:null!=b?jf.n(this,a,2*h+1,b):this.A===f?null:u?mf(this,a,f,h):null):ff(d,k)?(e[0]=!0,mf(this,a,f,h)):u?this:null};function mf(a,b,c,d){if(a.A===c)return null;a=a.La(b);b=a.e;var e=b.length;a.A^=c;Kc(b,2*(d+1),b,2*d,e-2*(d+1));b[e-2]=null;b[e-1]=null;return a}g.eb=function(){return nf.b?nf.b(this.e):nf.call(null,this.e)};
g.Ta=function(a,b){return kf(this.e,a,b)};g.Ma=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.A&e))return d;var f=Zc(this.A&e-1),e=this.e[2*f],f=this.e[2*f+1];return null==e?f.Ma(a+5,b,c,d):ff(c,e)?f:u?d:null};
g.ia=function(a,b,c,d,e,f){var h=1<<(c>>>b&31),k=Zc(this.A&h-1);if(0===(this.A&h)){var l=Zc(this.A);if(2*l<this.e.length){a=this.La(a);b=a.e;f.l=!0;a:for(c=2*(l-k),f=2*k+(c-1),l=2*(k+1)+(c-1);;){if(0===c)break a;b[l]=b[f];l-=1;c-=1;f-=1}b[2*k]=d;b[2*k+1]=e;a.A|=h;return a}if(16<=l){k=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];k[c>>>b&31]=of.ia(a,b+5,c,d,e,f);for(e=d=0;;)if(32>d)0!==
(this.A>>>d&1)&&(k[d]=null!=this.e[e]?of.ia(a,b+5,Tb(this.e[e]),this.e[e],this.e[e+1],f):this.e[e+1],e+=2),d+=1;else break;return new pf(a,l+1,k)}return u?(b=Array(2*(l+4)),Kc(this.e,0,b,0,2*k),b[2*k]=d,b[2*k+1]=e,Kc(this.e,2*k,b,2*(k+1),2*(l-k)),f.l=!0,a=this.La(a),a.e=b,a.A|=h,a):null}l=this.e[2*k];h=this.e[2*k+1];return null==l?(l=h.ia(a,b+5,c,d,e,f),l===h?this:jf.n(this,a,2*k+1,l)):ff(d,l)?e===h?this:jf.n(this,a,2*k+1,e):u?(f.l=!0,jf.X(this,a,2*k,null,2*k+1,qf.ga?qf.ga(a,b+5,l,h,c,d,e):qf.call(null,
a,b+5,l,h,c,d,e))):null};
g.ha=function(a,b,c,d,e){var f=1<<(b>>>a&31),h=Zc(this.A&f-1);if(0===(this.A&f)){var k=Zc(this.A);if(16<=k){h=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];h[b>>>a&31]=of.ha(a+5,b,c,d,e);for(d=c=0;;)if(32>c)0!==(this.A>>>c&1)&&(h[c]=null!=this.e[d]?of.ha(a+5,Tb(this.e[d]),this.e[d],this.e[d+1],e):this.e[d+1],d+=2),c+=1;else break;return new pf(null,k+1,h)}a=Array(2*(k+1));Kc(this.e,
0,a,0,2*h);a[2*h]=c;a[2*h+1]=d;Kc(this.e,2*h,a,2*(h+1),2*(k-h));e.l=!0;return new lf(null,this.A|f,a)}k=this.e[2*h];f=this.e[2*h+1];return null==k?(k=f.ha(a+5,b,c,d,e),k===f?this:new lf(null,this.A,gf.c(this.e,2*h+1,k))):ff(c,k)?d===f?this:new lf(null,this.A,gf.c(this.e,2*h+1,d)):u?(e.l=!0,new lf(null,this.A,gf.s(this.e,2*h,null,2*h+1,qf.X?qf.X(a+5,k,f,b,c,d):qf.call(null,a+5,k,f,b,c,d)))):null};
g.fb=function(a,b,c){var d=1<<(b>>>a&31);if(0===(this.A&d))return this;var e=Zc(this.A&d-1),f=this.e[2*e],h=this.e[2*e+1];return null==f?(a=h.fb(a+5,b,c),a===h?this:null!=a?new lf(null,this.A,gf.c(this.e,2*e+1,a)):this.A===d?null:u?new lf(null,this.A^d,hf(this.e,e)):null):ff(c,f)?new lf(null,this.A^d,hf(this.e,e)):u?this:null};var of=new lf(null,0,[]);
function rf(a,b,c){var d=a.e;a=2*(a.g-1);for(var e=Array(a),f=0,h=1,k=0;;)if(f<a)f!==c&&null!=d[f]&&(e[h]=d[f],h+=2,k|=1<<f),f+=1;else return new lf(b,k,e)}function pf(a,b,c){this.t=a;this.g=b;this.e=c}g=pf.prototype;g.La=function(a){return a===this.t?this:new pf(a,this.g,va(this.e))};
g.gb=function(a,b,c,d,e){var f=c>>>b&31,h=this.e[f];if(null==h)return this;b=h.gb(a,b+5,c,d,e);if(b===h)return this;if(null==b){if(8>=this.g)return rf(this,a,f);a=jf.n(this,a,f,b);a.g-=1;return a}return u?jf.n(this,a,f,b):null};g.eb=function(){return sf.b?sf.b(this.e):sf.call(null,this.e)};g.Ta=function(a,b){for(var c=this.e.length,d=0,e=b;;)if(d<c){var f=this.e[d];if(null!=f&&(e=f.Ta(a,e),fc(e)))return K.b?K.b(e):K.call(null,e);d+=1}else return e};
g.Ma=function(a,b,c,d){var e=this.e[b>>>a&31];return null!=e?e.Ma(a+5,b,c,d):d};g.ia=function(a,b,c,d,e,f){var h=c>>>b&31,k=this.e[h];if(null==k)return a=jf.n(this,a,h,of.ia(a,b+5,c,d,e,f)),a.g+=1,a;b=k.ia(a,b+5,c,d,e,f);return b===k?this:jf.n(this,a,h,b)};g.ha=function(a,b,c,d,e){var f=b>>>a&31,h=this.e[f];if(null==h)return new pf(null,this.g+1,gf.c(this.e,f,of.ha(a+5,b,c,d,e)));a=h.ha(a+5,b,c,d,e);return a===h?this:new pf(null,this.g,gf.c(this.e,f,a))};
g.fb=function(a,b,c){var d=b>>>a&31,e=this.e[d];return null!=e?(a=e.fb(a+5,b,c),a===e?this:null==a?8>=this.g?rf(this,null,d):new pf(null,this.g-1,gf.c(this.e,d,a)):u?new pf(null,this.g,gf.c(this.e,d,a)):null):this};function tf(a,b,c){b*=2;for(var d=0;;)if(d<b){if(ff(c,a[d]))return d;d+=2}else return-1}function uf(a,b,c,d){this.t=a;this.ra=b;this.g=c;this.e=d}g=uf.prototype;
g.La=function(a){if(a===this.t)return this;var b=Array(2*(this.g+1));Kc(this.e,0,b,0,2*this.g);return new uf(a,this.ra,this.g,b)};g.gb=function(a,b,c,d,e){b=tf(this.e,this.g,d);if(-1===b)return this;e[0]=!0;if(1===this.g)return null;a=this.La(a);e=a.e;e[b]=e[2*this.g-2];e[b+1]=e[2*this.g-1];e[2*this.g-1]=null;e[2*this.g-2]=null;a.g-=1;return a};g.eb=function(){return nf.b?nf.b(this.e):nf.call(null,this.e)};g.Ta=function(a,b){return kf(this.e,a,b)};
g.Ma=function(a,b,c,d){a=tf(this.e,this.g,c);return 0>a?d:ff(c,this.e[a])?this.e[a+1]:u?d:null};
g.ia=function(a,b,c,d,e,f){if(c===this.ra){b=tf(this.e,this.g,d);if(-1===b){if(this.e.length>2*this.g)return a=jf.X(this,a,2*this.g,d,2*this.g+1,e),f.l=!0,a.g+=1,a;c=this.e.length;b=Array(c+2);Kc(this.e,0,b,0,c);b[c]=d;b[c+1]=e;f.l=!0;f=this.g+1;a===this.t?(this.e=b,this.g=f,a=this):a=new uf(this.t,this.ra,f,b);return a}return this.e[b+1]===e?this:jf.n(this,a,b+1,e)}return(new lf(a,1<<(this.ra>>>b&31),[null,this,null,null])).ia(a,b,c,d,e,f)};
g.ha=function(a,b,c,d,e){return b===this.ra?(a=tf(this.e,this.g,c),-1===a?(a=2*this.g,b=Array(a+2),Kc(this.e,0,b,0,a),b[a]=c,b[a+1]=d,e.l=!0,new uf(null,this.ra,this.g+1,b)):Wb.a(this.e[a],d)?this:new uf(null,this.ra,this.g,gf.c(this.e,a+1,d))):(new lf(null,1<<(this.ra>>>a&31),[null,this])).ha(a,b,c,d,e)};g.fb=function(a,b,c){a=tf(this.e,this.g,c);return-1===a?this:1===this.g?null:u?new uf(null,this.ra,this.g-1,hf(this.e,Yc(a))):null};
var qf=function(){function a(a,b,c,h,k,l,n){var q=Tb(c);if(q===k)return new uf(null,q,2,[c,h,l,n]);var t=new ef;return of.ia(a,b,q,c,h,t).ia(a,b,k,l,n,t)}function b(a,b,c,h,k,l){var n=Tb(b);if(n===h)return new uf(null,n,2,[b,c,k,l]);var q=new ef;return of.ha(a,n,b,c,q).ha(a,h,k,l,q)}var c=null,c=function(c,e,f,h,k,l,n){switch(arguments.length){case 6:return b.call(this,c,e,f,h,k,l);case 7:return a.call(this,c,e,f,h,k,l,n)}throw Error("Invalid arity: "+arguments.length);};c.X=b;c.ga=a;return c}();
function vf(a,b,c,d,e){this.j=a;this.ka=b;this.p=c;this.r=d;this.m=e;this.q=0;this.i=32374860}g=vf.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.j)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return null==this.r?new W(null,2,5,X,[this.ka[this.p],this.ka[this.p+1]],null):F(this.r)};
g.S=function(){return null==this.r?nf.c?nf.c(this.ka,this.p+2,null):nf.call(null,this.ka,this.p+2,null):nf.c?nf.c(this.ka,this.p,I(this.r)):nf.call(null,this.ka,this.p,I(this.r))};g.H=function(){return this};g.F=function(a,b){return new vf(b,this.ka,this.p,this.r,this.m)};g.G=function(a,b){return M(b,this)};
var nf=function(){function a(a,b,c){if(null==c)for(c=a.length;;)if(b<c){if(null!=a[b])return new vf(null,a,b,null,null);var h=a[b+1];if(r(h)&&(h=h.eb(),r(h)))return new vf(null,a,b+2,h,null);b+=2}else return null;else return new vf(null,a,b,c,null)}function b(a){return c.c(a,0,null)}var c=null,c=function(c,e,f){switch(arguments.length){case 1:return b.call(this,c);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.c=a;return c}();
function wf(a,b,c,d,e){this.j=a;this.ka=b;this.p=c;this.r=d;this.m=e;this.q=0;this.i=32374860}g=wf.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.j)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return F(this.r)};
g.S=function(){return sf.n?sf.n(null,this.ka,this.p,I(this.r)):sf.call(null,null,this.ka,this.p,I(this.r))};g.H=function(){return this};g.F=function(a,b){return new wf(b,this.ka,this.p,this.r,this.m)};g.G=function(a,b){return M(b,this)};
var sf=function(){function a(a,b,c,h){if(null==h)for(h=b.length;;)if(c<h){var k=b[c];if(r(k)&&(k=k.eb(),r(k)))return new wf(a,b,c+1,k,null);c+=1}else return null;else return new wf(a,b,c,h,null)}function b(a){return c.n(null,a,0,null)}var c=null,c=function(c,e,f,h){switch(arguments.length){case 1:return b.call(this,c);case 4:return a.call(this,c,e,f,h)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.n=a;return c}();
function xf(a,b,c,d,e,f){this.j=a;this.g=b;this.root=c;this.T=d;this.Y=e;this.m=f;this.i=16123663;this.q=8196}g=xf.prototype;g.toString=function(){return Lb(this)};g.keys=function(){return Oe(Ve.b?Ve.b(this):Ve.call(null,this))};g.entries=function(){return Qe(E(this))};g.values=function(){return Oe(We.b?We.b(this):We.call(null,this))};g.has=function(a){return Oc(this,a)};g.get=function(a){return this.u(null,a)};
g.forEach=function(a){for(var b=E(this),c=null,d=0,e=0;;)if(e<d){var f=c.J(null,e),h=P.c(f,0,null),f=P.c(f,1,null);a.a?a.a(f,h):a.call(null,f,h);e+=1}else if(b=E(b))Ic(b)?(c=Hb(b),b=Ib(b),h=c,d=O(c),c=h):(c=F(b),h=P.c(c,0,null),f=P.c(c,1,null),a.a?a.a(f,h):a.call(null,f,h),b=I(b),c=null,d=0),e=0;else return null};g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){return null==b?this.T?this.Y:c:null==this.root?c:u?this.root.Ma(0,Tb(b),b,c):null};
g.Za=function(a,b,c){a=this.T?b.c?b.c(c,null,this.Y):b.call(null,c,null,this.Y):c;return fc(a)?K.b?K.b(a):K.call(null,a):null!=this.root?this.root.Ta(b,a):u?a:null};g.D=function(){return this.j};g.L=function(){return this.g};g.B=function(){var a=this.m;return null!=a?a:this.m=a=dc(this)};g.v=function(a,b){return Me(this,b)};g.Wa=function(){return new yf({},this.root,this.g,this.T,this.Y)};g.I=function(){return eb($e,this.j)};
g.nb=function(a,b){if(null==b)return this.T?new xf(this.j,this.g-1,this.root,!1,null,null):this;if(null==this.root)return this;if(u){var c=this.root.fb(0,Tb(b),b);return c===this.root?this:new xf(this.j,this.g-1,c,this.T,this.Y,null)}return null};
g.ua=function(a,b,c){if(null==b)return this.T&&c===this.Y?this:new xf(this.j,this.T?this.g:this.g+1,this.root,!0,c,null);a=new ef;b=(null==this.root?of:this.root).ha(0,Tb(b),b,c,a);return b===this.root?this:new xf(this.j,a.l?this.g+1:this.g,b,this.T,this.Y,null)};g.kb=function(a,b){return null==b?this.T:null==this.root?!1:u?this.root.Ma(0,Tb(b),b,Lc)!==Lc:null};g.H=function(){if(0<this.g){var a=null!=this.root?this.root.eb():null;return this.T?M(new W(null,2,5,X,[null,this.Y],null),a):a}return null};
g.F=function(a,b){return new xf(b,this.g,this.root,this.T,this.Y,this.m)};g.G=function(a,b){if(Hc(b))return Oa(this,D.a(b,0),D.a(b,1));for(var c=this,d=E(b);;){if(null==d)return c;var e=F(d);if(Hc(e))c=Oa(c,D.a(e,0),D.a(e,1)),d=I(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};var $e=new xf(null,0,null,!1,null,0);function sc(a,b){for(var c=a.length,d=0,e=yb($e);;)if(d<c)var f=d+1,e=e.cb(null,a[d],b[d]),d=f;else return Ab(e)}
function yf(a,b,c,d,e){this.t=a;this.root=b;this.count=c;this.T=d;this.Y=e;this.q=56;this.i=258}g=yf.prototype;g.Ab=function(a,b){if(this.t)if(null==b)this.T&&(this.T=!1,this.Y=null,this.count-=1);else{if(null!=this.root){var c=new ef,d=this.root.gb(this.t,0,Tb(b),b,c);d!==this.root&&(this.root=d);r(c[0])&&(this.count-=1)}}else throw Error("dissoc! after persistent!");return this};g.cb=function(a,b,c){return zf(this,b,c)};
g.Ka=function(a,b){var c;a:{if(this.t){if(b?b.i&2048||b.dc||(b.i?0:s(Sa,b)):s(Sa,b)){c=zf(this,cf.b?cf.b(b):cf.call(null,b),df.b?df.b(b):df.call(null,b));break a}c=E(b);for(var d=this;;){var e=F(c);if(r(e))c=I(c),d=zf(d,cf.b?cf.b(e):cf.call(null,e),df.b?df.b(e):df.call(null,e));else{c=d;break a}}}else throw Error("conj! after persistent");c=void 0}return c};
g.Oa=function(){var a;if(this.t)this.t=null,a=new xf(null,this.count,this.root,this.T,this.Y,null);else throw Error("persistent! called twice");return a};g.u=function(a,b){return null==b?this.T?this.Y:null:null==this.root?null:this.root.Ma(0,Tb(b),b)};g.C=function(a,b,c){return null==b?this.T?this.Y:c:null==this.root?c:this.root.Ma(0,Tb(b),b,c)};g.L=function(){if(this.t)return this.count;throw Error("count after persistent!");};
function zf(a,b,c){if(a.t){if(null==b)a.Y!==c&&(a.Y=c),a.T||(a.count+=1,a.T=!0);else{var d=new ef;b=(null==a.root?of:a.root).ia(a.t,0,Tb(b),b,c,d);b!==a.root&&(a.root=b);d.l&&(a.count+=1)}return a}throw Error("assoc! after persistent!");}function Af(a,b,c){for(var d=b;;)if(null!=a)b=c?a.left:a.right,d=pc.a(d,a),a=b;else return d}function Bf(a,b,c,d,e){this.j=a;this.stack=b;this.ib=c;this.g=d;this.m=e;this.q=0;this.i=32374862}g=Bf.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.j};
g.L=function(){return 0>this.g?O(I(this))+1:this.g};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.j)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return yc(this.stack)};g.S=function(){var a=F(this.stack),a=Af(this.ib?a.right:a.left,I(this.stack),this.ib);return null!=a?new Bf(null,a,this.ib,this.g-1,null):H};g.H=function(){return this};
g.F=function(a,b){return new Bf(b,this.stack,this.ib,this.g,this.m)};g.G=function(a,b){return M(b,this)};function Cf(a,b,c){return new Bf(null,Af(a,null,b),b,c,null)}function Df(a,b,c,d){return c instanceof Y?c.left instanceof Y?new Y(c.key,c.l,c.left.qa(),new $(a,b,c.right,d,null),null):c.right instanceof Y?new Y(c.right.key,c.right.l,new $(c.key,c.l,c.left,c.right.left,null),new $(a,b,c.right.right,d,null),null):u?new $(a,b,c,d,null):null:new $(a,b,c,d,null)}
function Ef(a,b,c,d){return d instanceof Y?d.right instanceof Y?new Y(d.key,d.l,new $(a,b,c,d.left,null),d.right.qa(),null):d.left instanceof Y?new Y(d.left.key,d.left.l,new $(a,b,c,d.left.left,null),new $(d.key,d.l,d.left.right,d.right,null),null):u?new $(a,b,c,d,null):null:new $(a,b,c,d,null)}
function Ff(a,b,c,d){if(c instanceof Y)return new Y(a,b,c.qa(),d,null);if(d instanceof $)return Ef(a,b,c,d.hb());if(d instanceof Y&&d.left instanceof $)return new Y(d.left.key,d.left.l,new $(a,b,c,d.left.left,null),Ef(d.key,d.l,d.left.right,d.right.hb()),null);if(u)throw Error("red-black tree invariant violation");return null}
var Hf=function Gf(b,c,d){d=null!=b.left?Gf(b.left,c,d):d;if(fc(d))return K.b?K.b(d):K.call(null,d);d=c.c?c.c(d,b.key,b.l):c.call(null,d,b.key,b.l);if(fc(d))return K.b?K.b(d):K.call(null,d);b=null!=b.right?Gf(b.right,c,d):d;return fc(b)?K.b?K.b(b):K.call(null,b):b};function $(a,b,c,d,e){this.key=a;this.l=b;this.left=c;this.right=d;this.m=e;this.q=0;this.i=32402207}g=$.prototype;g.Hb=function(a){return a.Jb(this)};g.hb=function(){return new Y(this.key,this.l,this.left,this.right,null)};g.qa=function(){return this};
g.Gb=function(a){return a.Ib(this)};g.replace=function(a,b,c,d){return new $(a,b,c,d,null)};g.Ib=function(a){return new $(a.key,a.l,this,a.right,null)};g.Jb=function(a){return new $(a.key,a.l,a.left,this,null)};g.Ta=function(a,b){return Hf(this,a,b)};g.u=function(a,b){return D.c(this,b,null)};g.C=function(a,b,c){return D.c(this,b,c)};g.J=function(a,b){return 0===b?this.key:1===b?this.l:null};g.aa=function(a,b,c){return 0===b?this.key:1===b?this.l:u?c:null};
g.Pa=function(a,b,c){return(new W(null,2,5,X,[this.key,this.l],null)).Pa(null,b,c)};g.D=function(){return null};g.L=function(){return 2};g.$a=function(){return this.key};g.ab=function(){return this.l};g.Ia=function(){return this.l};g.Ja=function(){return new W(null,1,5,X,[this.key],null)};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return qe};g.N=function(a,b){return gc.a(this,b)};g.M=function(a,b,c){return gc.c(this,b,c)};
g.ua=function(a,b,c){return R.c(new W(null,2,5,X,[this.key,this.l],null),b,c)};g.H=function(){return Da(Da(H,this.l),this.key)};g.F=function(a,b){return N(new W(null,2,5,X,[this.key,this.l],null),b)};g.G=function(a,b){return new W(null,3,5,X,[this.key,this.l,b],null)};g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();
g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};function Y(a,b,c,d,e){this.key=a;this.l=b;this.left=c;this.right=d;this.m=e;this.q=0;this.i=32402207}g=Y.prototype;g.Hb=function(a){return new Y(this.key,this.l,this.left,a,null)};g.hb=function(){throw Error("red-black tree invariant violation");};g.qa=function(){return new $(this.key,this.l,this.left,this.right,null)};
g.Gb=function(a){return new Y(this.key,this.l,a,this.right,null)};g.replace=function(a,b,c,d){return new Y(a,b,c,d,null)};g.Ib=function(a){return this.left instanceof Y?new Y(this.key,this.l,this.left.qa(),new $(a.key,a.l,this.right,a.right,null),null):this.right instanceof Y?new Y(this.right.key,this.right.l,new $(this.key,this.l,this.left,this.right.left,null),new $(a.key,a.l,this.right.right,a.right,null),null):u?new $(a.key,a.l,this,a.right,null):null};
g.Jb=function(a){return this.right instanceof Y?new Y(this.key,this.l,new $(a.key,a.l,a.left,this.left,null),this.right.qa(),null):this.left instanceof Y?new Y(this.left.key,this.left.l,new $(a.key,a.l,a.left,this.left.left,null),new $(this.key,this.l,this.left.right,this.right,null),null):u?new $(a.key,a.l,a.left,this,null):null};g.Ta=function(a,b){return Hf(this,a,b)};g.u=function(a,b){return D.c(this,b,null)};g.C=function(a,b,c){return D.c(this,b,c)};
g.J=function(a,b){return 0===b?this.key:1===b?this.l:null};g.aa=function(a,b,c){return 0===b?this.key:1===b?this.l:u?c:null};g.Pa=function(a,b,c){return(new W(null,2,5,X,[this.key,this.l],null)).Pa(null,b,c)};g.D=function(){return null};g.L=function(){return 2};g.$a=function(){return this.key};g.ab=function(){return this.l};g.Ia=function(){return this.l};g.Ja=function(){return new W(null,1,5,X,[this.key],null)};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};
g.v=function(a,b){return lc(this,b)};g.I=function(){return qe};g.N=function(a,b){return gc.a(this,b)};g.M=function(a,b,c){return gc.c(this,b,c)};g.ua=function(a,b,c){return R.c(new W(null,2,5,X,[this.key,this.l],null),b,c)};g.H=function(){return Da(Da(H,this.l),this.key)};g.F=function(a,b){return N(new W(null,2,5,X,[this.key,this.l],null),b)};g.G=function(a,b){return new W(null,3,5,X,[this.key,this.l,b],null)};
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};
var Jf=function If(b,c,d,e,f){if(null==c)return new Y(d,e,null,null,null);var h=b.a?b.a(d,c.key):b.call(null,d,c.key);return 0===h?(f[0]=c,null):0>h?(b=If(b,c.left,d,e,f),null!=b?c.Gb(b):null):u?(b=If(b,c.right,d,e,f),null!=b?c.Hb(b):null):null},Lf=function Kf(b,c){if(null==b)return c;if(null==c)return b;if(b instanceof Y){if(c instanceof Y){var d=Kf(b.right,c.left);return d instanceof Y?new Y(d.key,d.l,new Y(b.key,b.l,b.left,d.left,null),new Y(c.key,c.l,d.right,c.right,null),null):new Y(b.key,b.l,
b.left,new Y(c.key,c.l,d,c.right,null),null)}return new Y(b.key,b.l,b.left,Kf(b.right,c),null)}return c instanceof Y?new Y(c.key,c.l,Kf(b,c.left),c.right,null):u?(d=Kf(b.right,c.left),d instanceof Y?new Y(d.key,d.l,new $(b.key,b.l,b.left,d.left,null),new $(c.key,c.l,d.right,c.right,null),null):Ff(b.key,b.l,b.left,new $(c.key,c.l,d,c.right,null))):null},Nf=function Mf(b,c,d,e){if(null!=c){var f=b.a?b.a(d,c.key):b.call(null,d,c.key);if(0===f)return e[0]=c,Lf(c.left,c.right);if(0>f)return b=Mf(b,c.left,
d,e),null!=b||null!=e[0]?c.left instanceof $?Ff(c.key,c.l,b,c.right):new Y(c.key,c.l,b,c.right,null):null;if(u){b=Mf(b,c.right,d,e);if(null!=b||null!=e[0])if(c.right instanceof $)if(e=c.key,d=c.l,c=c.left,b instanceof Y)c=new Y(e,d,c,b.qa(),null);else if(c instanceof $)c=Df(e,d,c.hb(),b);else if(c instanceof Y&&c.right instanceof $)c=new Y(c.right.key,c.right.l,Df(c.key,c.l,c.left.hb(),c.right.left),new $(e,d,c.right.right,b,null),null);else{if(u)throw Error("red-black tree invariant violation");
c=null}else c=new Y(c.key,c.l,c.left,b,null);else c=null;return c}}return null},Pf=function Of(b,c,d,e){var f=c.key,h=b.a?b.a(d,f):b.call(null,d,f);return 0===h?c.replace(f,e,c.left,c.right):0>h?c.replace(f,c.l,Of(b,c.left,d,e),c.right):u?c.replace(f,c.l,c.left,Of(b,c.right,d,e)):null};function Qf(a,b,c,d,e){this.Z=a;this.ma=b;this.g=c;this.j=d;this.m=e;this.i=418776847;this.q=8192}g=Qf.prototype;g.toString=function(){return Lb(this)};g.keys=function(){return Oe(Ve.b?Ve.b(this):Ve.call(null,this))};
g.entries=function(){return Qe(E(this))};g.values=function(){return Oe(We.b?We.b(this):We.call(null,this))};g.has=function(a){return Oc(this,a)};g.get=function(a){return this.u(null,a)};g.forEach=function(a){for(var b=E(this),c=null,d=0,e=0;;)if(e<d){var f=c.J(null,e),h=P.c(f,0,null),f=P.c(f,1,null);a.a?a.a(f,h):a.call(null,f,h);e+=1}else if(b=E(b))Ic(b)?(c=Hb(b),b=Ib(b),h=c,d=O(c),c=h):(c=F(b),h=P.c(c,0,null),f=P.c(c,1,null),a.a?a.a(f,h):a.call(null,f,h),b=I(b),c=null,d=0),e=0;else return null};
function Rf(a,b){for(var c=a.ma;;)if(null!=c){var d=a.Z.a?a.Z.a(b,c.key):a.Z.call(null,b,c.key);if(0===d)return c;if(0>d)c=c.left;else if(u)c=c.right;else return null}else return null}g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){a=Rf(this,b);return null!=a?a.l:c};g.Za=function(a,b,c){return null!=this.ma?Hf(this.ma,b,c):c};g.D=function(){return this.j};g.L=function(){return this.g};g.Xa=function(){return 0<this.g?Cf(this.ma,!1,this.g):null};
g.B=function(){var a=this.m;return null!=a?a:this.m=a=dc(this)};g.v=function(a,b){return Me(this,b)};g.I=function(){return N(Sf,this.j)};g.nb=function(a,b){var c=[null],d=Nf(this.Z,this.ma,b,c);return null==d?null==P.a(c,0)?this:new Qf(this.Z,null,0,this.j,null):new Qf(this.Z,d.qa(),this.g-1,this.j,null)};
g.ua=function(a,b,c){a=[null];var d=Jf(this.Z,this.ma,b,c,a);return null==d?(a=P.a(a,0),Wb.a(c,a.l)?this:new Qf(this.Z,Pf(this.Z,this.ma,b,c),this.g,this.j,null)):new Qf(this.Z,d.qa(),this.g+1,this.j,null)};g.kb=function(a,b){return null!=Rf(this,b)};g.H=function(){return 0<this.g?Cf(this.ma,!0,this.g):null};g.F=function(a,b){return new Qf(this.Z,this.ma,this.g,b,this.m)};
g.G=function(a,b){if(Hc(b))return Oa(this,D.a(b,0),D.a(b,1));for(var c=this,d=E(b);;){if(null==d)return c;var e=F(d);if(Hc(e))c=Oa(c,D.a(e,0),D.a(e,1)),d=I(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};
g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};g.yb=function(a,b){return 0<this.g?Cf(this.ma,b,this.g):null};g.zb=function(a,b,c){if(0<this.g){a=null;for(var d=this.ma;;)if(null!=d){var e=this.Z.a?this.Z.a(b,d.key):this.Z.call(null,b,d.key);if(0===e)return new Bf(null,pc.a(a,d),c,-1,null);if(r(c))0>e?(a=pc.a(a,d),d=d.left):d=d.right;else if(u)0<e?(a=pc.a(a,d),d=d.right):d=d.left;else return null}else return null==a?null:new Bf(null,a,c,-1,null)}else return null};
g.xb=function(a,b){return cf.b?cf.b(b):cf.call(null,b)};g.wb=function(){return this.Z};
var Sf=new Qf(Xb,null,0,null,0),Tf=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){a=E(a);for(var b=yb($e);;)if(a){var e=I(I(a)),b=xd.c(b,F(a),F(I(a)));a=e}else return Ab(b)}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}(),Uf=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return new la(null,Yc(O(a)),S.a(wa,
a),null)}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}(),Vf=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){a=E(a);for(var b=Sf;;)if(a){var e=I(I(a)),b=R.c(b,F(a),F(I(a)));a=e}else return b}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}(),Wf=function(){function a(a,d){var e=null;1<arguments.length&&(e=J(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,
b){for(var e=E(b),f=new Qf(Qc(a),null,0,null,0);;)if(e)var h=I(I(e)),f=R.c(f,F(e),F(I(e))),e=h;else return f}a.k=1;a.f=function(a){var d=F(a);a=G(a);return b(d,a)};a.d=b;return a}();function Xf(a,b){this.V=a;this.W=b;this.q=0;this.i=32374988}g=Xf.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.W};g.U=function(){var a=this.V,a=(a?a.i&128||a.ob||(a.i?0:s(Ja,a)):s(Ja,a))?this.V.U(null):I(this.V);return null==a?null:new Xf(a,this.W)};g.B=function(){return cc(this)};
g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.W)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return this.V.Q(null).$a(null)};g.S=function(){var a=this.V,a=(a?a.i&128||a.ob||(a.i?0:s(Ja,a)):s(Ja,a))?this.V.U(null):I(this.V);return null!=a?new Xf(a,this.W):H};g.H=function(){return this};g.F=function(a,b){return new Xf(this.V,b)};g.G=function(a,b){return M(b,this)};function Ve(a){return(a=E(a))?new Xf(a,null):null}
function cf(a){return Ta(a)}function Yf(a,b){this.V=a;this.W=b;this.q=0;this.i=32374988}g=Yf.prototype;g.toString=function(){return Lb(this)};g.D=function(){return this.W};g.U=function(){var a=this.V,a=(a?a.i&128||a.ob||(a.i?0:s(Ja,a)):s(Ja,a))?this.V.U(null):I(this.V);return null==a?null:new Yf(a,this.W)};g.B=function(){return cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.W)};g.N=function(a,b){return nc.a(b,this)};g.M=function(a,b,c){return nc.c(b,c,this)};g.Q=function(){return this.V.Q(null).ab(null)};
g.S=function(){var a=this.V,a=(a?a.i&128||a.ob||(a.i?0:s(Ja,a)):s(Ja,a))?this.V.U(null):I(this.V);return null!=a?new Yf(a,this.W):H};g.H=function(){return this};g.F=function(a,b){return new Yf(this.V,b)};g.G=function(a,b){return M(b,this)};function We(a){return(a=E(a))?new Yf(a,null):null}function df(a){return Ua(a)}
var Zf=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return r(Ed(Fd,a))?C.a(function(a,b){return pc.a(r(a)?a:Ye,b)},a):null}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}();function $f(a,b,c){this.j=a;this.Sa=b;this.m=c;this.i=15077647;this.q=8196}g=$f.prototype;g.toString=function(){return Lb(this)};g.keys=function(){return Oe(E(this))};g.entries=function(){return Se(E(this))};g.values=function(){return Oe(E(this))};
g.has=function(a){return Oc(this,a)};g.forEach=function(a){for(var b=E(this),c=null,d=0,e=0;;)if(e<d){var f=c.J(null,e),h=P.c(f,0,null),f=P.c(f,1,null);a.a?a.a(f,h):a.call(null,f,h);e+=1}else if(b=E(b))Ic(b)?(c=Hb(b),b=Ib(b),h=c,d=O(c),c=h):(c=F(b),h=P.c(c,0,null),f=P.c(c,1,null),a.a?a.a(f,h):a.call(null,f,h),b=I(b),c=null,d=0),e=0;else return null};g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){return Na(this.Sa,b)?b:c};g.D=function(){return this.j};g.L=function(){return Aa(this.Sa)};
g.B=function(){var a=this.m;return null!=a?a:this.m=a=dc(this)};g.v=function(a,b){return Dc(b)&&O(this)===O(b)&&Dd(function(a){return function(b){return Oc(a,b)}}(this),b)};g.Wa=function(){return new ag(yb(this.Sa))};g.I=function(){return N(bg,this.j)};g.vb=function(a,b){return new $f(this.j,Qa(this.Sa,b),null)};g.H=function(){return Ve(this.Sa)};g.F=function(a,b){return new $f(b,this.Sa,this.m)};g.G=function(a,b){return new $f(this.j,R.c(this.Sa,b,null),null)};
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};var bg=new $f(null,Ye,0);function ag(a){this.la=a;this.i=259;this.q=136}g=ag.prototype;
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return La.c(this.la,c,Lc)===Lc?null:c;case 3:return La.c(this.la,c,Lc)===Lc?d:c}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return La.c(this.la,a,Lc)===Lc?null:a};g.a=function(a,b){return La.c(this.la,a,Lc)===Lc?b:a};g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){return La.c(this.la,b,Lc)===Lc?c:b};
g.L=function(){return O(this.la)};g.Ob=function(a,b){this.la=yd.a(this.la,b);return this};g.Ka=function(a,b){this.la=xd.c(this.la,b,null);return this};g.Oa=function(){return new $f(null,Ab(this.la),null)};function cg(a,b,c){this.j=a;this.na=b;this.m=c;this.i=417730831;this.q=8192}g=cg.prototype;g.toString=function(){return Lb(this)};g.keys=function(){return Oe(E(this))};g.entries=function(){return Se(E(this))};g.values=function(){return Oe(E(this))};g.has=function(a){return Oc(this,a)};
g.forEach=function(a){for(var b=E(this),c=null,d=0,e=0;;)if(e<d){var f=c.J(null,e),h=P.c(f,0,null),f=P.c(f,1,null);a.a?a.a(f,h):a.call(null,f,h);e+=1}else if(b=E(b))Ic(b)?(c=Hb(b),b=Ib(b),h=c,d=O(c),c=h):(c=F(b),h=P.c(c,0,null),f=P.c(c,1,null),a.a?a.a(f,h):a.call(null,f,h),b=I(b),c=null,d=0),e=0;else return null};g.u=function(a,b){return La.c(this,b,null)};g.C=function(a,b,c){a=Rf(this.na,b);return null!=a?a.key:c};g.D=function(){return this.j};g.L=function(){return O(this.na)};
g.Xa=function(){return 0<O(this.na)?Kd.a(cf,pb(this.na)):null};g.B=function(){var a=this.m;return null!=a?a:this.m=a=dc(this)};g.v=function(a,b){return Dc(b)&&O(this)===O(b)&&Dd(function(a){return function(b){return Oc(a,b)}}(this),b)};g.I=function(){return N(dg,this.j)};g.vb=function(a,b){return new cg(this.j,tc.a(this.na,b),null)};g.H=function(){return Ve(this.na)};g.F=function(a,b){return new cg(b,this.na,this.m)};g.G=function(a,b){return new cg(this.j,R.c(this.na,b,null),null)};
g.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.u(null,c);case 3:return this.C(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();g.apply=function(a,b){return this.call.apply(this,[this].concat(va(b)))};g.b=function(a){return this.u(null,a)};g.a=function(a,b){return this.C(null,a,b)};g.yb=function(a,b){return Kd.a(cf,qb(this.na,b))};g.zb=function(a,b,c){return Kd.a(cf,rb(this.na,b,c))};g.xb=function(a,b){return b};g.wb=function(){return tb(this.na)};
var dg=new cg(null,Sf,0);function eg(a){a=E(a);if(null==a)return bg;if(a instanceof ac&&0===a.p){a=a.e;a:{for(var b=0,c=yb(bg);;)if(b<a.length)var d=b+1,c=c.Ka(null,a[b]),b=d;else{a=c;break a}a=void 0}return a.Oa(null)}if(u)for(d=yb(bg);;)if(null!=a)b=a.U(null),d=d.Ka(null,a.Q(null)),a=b;else return d.Oa(null);else return null}
var fg=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return C.c(Da,dg,a)}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}(),gg=function(){function a(a,d){var e=null;1<arguments.length&&(e=J(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return C.c(Da,new cg(null,Wf(a),0),b)}a.k=1;a.f=function(a){var d=F(a);a=G(a);return b(d,a)};a.d=b;return a}();
function hg(a){for(var b=qe;;)if(I(a))b=pc.a(b,F(a)),a=I(a);else return E(b)}function id(a){if(a&&(a.q&4096||a.fc))return a.name;if("string"===typeof a)return a;throw Error("Doesn't support name: "+A.b(a));}
var ig=function(){function a(a,b,c){return(a.b?a.b(b):a.call(null,b))>(a.b?a.b(c):a.call(null,c))?b:c}var b=null,c=function(){function a(b,d,k,l){var n=null;3<arguments.length&&(n=J(Array.prototype.slice.call(arguments,3),0));return c.call(this,b,d,k,n)}function c(a,d,e,l){return C.c(function(c,d){return b.c(a,c,d)},b.c(a,d,e),l)}a.k=3;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=I(a);var l=F(a);a=G(a);return c(b,d,l,a)};a.d=c;return a}(),b=function(b,e,f,h){switch(arguments.length){case 2:return e;
case 3:return a.call(this,b,e,f);default:return c.d(b,e,f,J(arguments,3))}throw Error("Invalid arity: "+arguments.length);};b.k=3;b.f=c.f;b.a=function(a,b){return b};b.c=a;b.d=c.d;return b}(),jg=function(){function a(a,b,f){return new V(null,function(){var h=E(f);return h?M(Md(a,h),c.c(a,b,Nd(b,h))):null},null,null)}function b(a,b){return c.c(a,a,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);
};c.a=b;c.c=a;return c}(),lg=function kg(b,c){return new V(null,function(){var d=E(c);return d?r(b.b?b.b(F(d)):b.call(null,F(d)))?M(F(d),kg(b,G(d))):null:null},null,null)};function mg(a,b,c){return function(d){var e=tb(a);return b.a?b.a(e.a?e.a(sb(a,d),c):e.call(null,sb(a,d),c),0):b.call(null,e.a?e.a(sb(a,d),c):e.call(null,sb(a,d),c),0)}}
var ng=function(){function a(a,b,c,h,k){var l=rb(a,c,!0);if(r(l)){var n=P.c(l,0,null);return lg(mg(a,h,k),r(mg(a,b,c).call(null,n))?l:I(l))}return null}function b(a,b,c){var h=mg(a,b,c),k;a:{k=[Uc,Vc];var l=k.length;if(l<=Ze)for(var n=0,q=yb(Ye);;)if(n<l)var t=n+1,q=Bb(q,k[n],null),n=t;else{k=new $f(null,Ab(q),null);break a}else for(n=0,q=yb(bg);;)if(n<l)t=n+1,q=zb(q,k[n]),n=t;else{k=Ab(q);break a}k=void 0}return r(k.call(null,b))?(a=rb(a,c,!0),r(a)?(b=P.c(a,0,null),r(h.b?h.b(b):h.call(null,b))?a:
I(a)):null):lg(h,qb(a,!0))}var c=null,c=function(c,e,f,h,k){switch(arguments.length){case 3:return b.call(this,c,e,f);case 5:return a.call(this,c,e,f,h,k)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.s=a;return c}();function og(a,b,c,d,e){this.j=a;this.start=b;this.end=c;this.step=d;this.m=e;this.i=32375006;this.q=8192}g=og.prototype;g.toString=function(){return Lb(this)};
g.J=function(a,b){if(b<Aa(this))return this.start+b*this.step;if(this.start>this.end&&0===this.step)return this.start;throw Error("Index out of bounds");};g.aa=function(a,b,c){return b<Aa(this)?this.start+b*this.step:this.start>this.end&&0===this.step?this.start:c};g.D=function(){return this.j};
g.U=function(){return 0<this.step?this.start+this.step<this.end?new og(this.j,this.start+this.step,this.end,this.step,null):null:this.start+this.step>this.end?new og(this.j,this.start+this.step,this.end,this.step,null):null};g.L=function(){return sa(lb(this))?0:Math.ceil((this.end-this.start)/this.step)};g.B=function(){var a=this.m;return null!=a?a:this.m=a=cc(this)};g.v=function(a,b){return lc(this,b)};g.I=function(){return N(H,this.j)};g.N=function(a,b){return gc.a(this,b)};
g.M=function(a,b,c){return gc.c(this,b,c)};g.Q=function(){return null==lb(this)?null:this.start};g.S=function(){return null!=lb(this)?new og(this.j,this.start+this.step,this.end,this.step,null):H};g.H=function(){return 0<this.step?this.start<this.end?this:null:this.start>this.end?this:null};g.F=function(a,b){return new og(b,this.start,this.end,this.step,this.m)};g.G=function(a,b){return M(b,this)};
var pg=function(){function a(a,b,c){return new og(null,a,b,c,null)}function b(a,b){return e.c(a,b,1)}function c(a){return e.c(0,a,1)}function d(){return e.c(0,Number.MAX_VALUE,1)}var e=null,e=function(e,h,k){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,e);case 2:return b.call(this,e,h);case 3:return a.call(this,e,h,k)}throw Error("Invalid arity: "+arguments.length);};e.o=d;e.b=c;e.a=b;e.c=a;return e}(),qg=function(){function a(a,b){for(;;)if(E(b)&&0<a){var c=a-1,h=
I(b);a=c;b=h}else return null}function b(a){for(;;)if(E(a))a=I(a);else return null}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),rg=function(){function a(a,b){qg.a(a,b);return b}function b(a){qg.b(a);return a}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);
};c.b=b;c.a=a;return c}();function sg(a,b){if("string"===typeof b){var c=a.exec(b);return Wb.a(F(c),b)?1===O(c)?F(c):we(c):null}throw new TypeError("re-matches must match against a string.");}function tg(a){var b;b=/^(?:\(\?([idmsux]*)\))?(.*)/;if("string"===typeof a)a=b.exec(a),b=null==a?null:1===O(a)?F(a):we(a);else throw new TypeError("re-find must match against a string.");P.c(b,0,null);a=P.c(b,1,null);b=P.c(b,2,null);return new RegExp(b,a)}
function ug(a,b,c,d,e,f,h){var k=ja;try{ja=null==ja?null:ja-1;if(null!=ja&&0>ja)return ub(a,"#");ub(a,c);E(h)&&(b.c?b.c(F(h),a,f):b.call(null,F(h),a,f));for(var l=I(h),n=ra.b(f)-1;;)if(!l||null!=n&&0===n){E(l)&&0===n&&(ub(a,d),ub(a,"..."));break}else{ub(a,d);b.c?b.c(F(l),a,f):b.call(null,F(l),a,f);var q=I(l);c=n-1;l=q;n=c}return ub(a,e)}finally{ja=k}}
var vg=function(){function a(a,d){var e=null;1<arguments.length&&(e=J(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){for(var e=E(b),f=null,h=0,k=0;;)if(k<h){var l=f.J(null,k);ub(a,l);k+=1}else if(e=E(e))f=e,Ic(f)?(e=Hb(f),h=Ib(f),f=e,l=O(e),e=h,h=l):(l=F(f),ub(a,l),e=I(f),f=null,h=0),k=0;else return null}a.k=1;a.f=function(a){var d=F(a);a=G(a);return b(d,a)};a.d=b;return a}(),wg={'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"};
function xg(a){return'"'+A.b(a.replace(RegExp('[\\\\"\b\f\n\r\t]',"g"),function(a){return wg[a]}))+'"'}
var Ag=function yg(b,c,d){if(null==b)return ub(c,"nil");if(void 0===b)return ub(c,"#\x3cundefined\x3e");if(u){r(function(){var c=Q.a(d,pa);return r(c)?(c=b?b.i&131072||b.ec?!0:b.i?!1:s(bb,b):s(bb,b))?xc(b):c:c}())&&(ub(c,"^"),yg(xc(b),c,d),ub(c," "));if(null==b)return ub(c,"nil");if(b.Db)return b.Tb(b,c,d);if(b&&(b.i&2147483648||b.K))return b.w(null,c,d);if(ta(b)===Boolean||"number"===typeof b)return ub(c,""+A.b(b));if(null!=b&&b.constructor===Object)return ub(c,"#js "),zg.n?zg.n(Kd.a(function(c){return new W(null,
2,5,X,[jd.b(c),b[c]],null)},Jc(b)),yg,c,d):zg.call(null,Kd.a(function(c){return new W(null,2,5,X,[jd.b(c),b[c]],null)},Jc(b)),yg,c,d);if(b instanceof Array)return ug(c,yg,"#js ["," ","]",d,b);if("string"==typeof b)return r(oa.b(d))?ub(c,xg(b)):ub(c,b);if(uc(b))return vg.d(c,J(["#\x3c",""+A.b(b),"\x3e"],0));if(b instanceof Date){var e=function(b,c){for(var d=""+A.b(b);;)if(O(d)<c)d="0"+A.b(d);else return d};return vg.d(c,J(['#inst "',""+A.b(b.getUTCFullYear()),"-",e(b.getUTCMonth()+1,2),"-",e(b.getUTCDate(),
2),"T",e(b.getUTCHours(),2),":",e(b.getUTCMinutes(),2),":",e(b.getUTCSeconds(),2),".",e(b.getUTCMilliseconds(),3),"-",'00:00"'],0))}return b instanceof RegExp?vg.d(c,J(['#"',b.source,'"'],0)):(b?b.i&2147483648||b.K||(b.i?0:s(vb,b)):s(vb,b))?wb(b,c,d):u?vg.d(c,J(["#\x3c",""+A.b(b),"\x3e"],0)):null}return null};
function Bg(a,b){var c=new ea;a:{var d=new Kb(c);Ag(F(a),d,b);for(var e=E(I(a)),f=null,h=0,k=0;;)if(k<h){var l=f.J(null,k);ub(d," ");Ag(l,d,b);k+=1}else if(e=E(e))f=e,Ic(f)?(e=Hb(f),h=Ib(f),f=e,l=O(e),e=h,h=l):(l=F(f),ub(d," "),Ag(l,d,b),e=I(f),f=null,h=0),k=0;else break a}return c}
var Cg=function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){var b=ka();return Bc(a)?"":""+A.b(Bg(a,b))}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}();function zg(a,b,c,d){return ug(c,function(a,c,d){b.c?b.c(Ta(a),c,d):b.call(null,Ta(a),c,d);ub(c," ");return b.c?b.c(Ua(a),c,d):b.call(null,Ua(a),c,d)},"{",", ","}",d,E(a))}ac.prototype.K=!0;
ac.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};V.prototype.K=!0;V.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};Bf.prototype.K=!0;Bf.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};vf.prototype.K=!0;vf.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};$.prototype.K=!0;$.prototype.w=function(a,b,c){return ug(b,Ag,"["," ","]",c,this)};Ue.prototype.K=!0;Ue.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};
cg.prototype.K=!0;cg.prototype.w=function(a,b,c){return ug(b,Ag,"#{"," ","}",c,this)};ye.prototype.K=!0;ye.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};gd.prototype.K=!0;gd.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};kc.prototype.K=!0;kc.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};xf.prototype.K=!0;xf.prototype.w=function(a,b,c){return zg(this,Ag,b,c)};wf.prototype.K=!0;wf.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};
Ae.prototype.K=!0;Ae.prototype.w=function(a,b,c){return ug(b,Ag,"["," ","]",c,this)};Qf.prototype.K=!0;Qf.prototype.w=function(a,b,c){return zg(this,Ag,b,c)};$f.prototype.K=!0;$f.prototype.w=function(a,b,c){return ug(b,Ag,"#{"," ","}",c,this)};od.prototype.K=!0;od.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};Yf.prototype.K=!0;Yf.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};Y.prototype.K=!0;Y.prototype.w=function(a,b,c){return ug(b,Ag,"["," ","]",c,this)};
W.prototype.K=!0;W.prototype.w=function(a,b,c){return ug(b,Ag,"["," ","]",c,this)};He.prototype.K=!0;He.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};cd.prototype.K=!0;cd.prototype.w=function(a,b){return ub(b,"()")};Ie.prototype.K=!0;Ie.prototype.w=function(a,b,c){return ug(b,Ag,"#queue ["," ","]",c,E(this))};la.prototype.K=!0;la.prototype.w=function(a,b,c){return zg(this,Ag,b,c)};og.prototype.K=!0;og.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};
Xf.prototype.K=!0;Xf.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};bd.prototype.K=!0;bd.prototype.w=function(a,b,c){return ug(b,Ag,"("," ",")",c,this)};W.prototype.lb=!0;W.prototype.mb=function(a,b){return Pc.a(this,b)};Ae.prototype.lb=!0;Ae.prototype.mb=function(a,b){return Pc.a(this,b)};T.prototype.lb=!0;T.prototype.mb=function(a,b){return Vb(this,b)};Zb.prototype.lb=!0;Zb.prototype.mb=function(a,b){return Vb(this,b)};
function Dg(a,b){if(a?a.gc:a)return a.gc(a,b);var c;c=Dg[m(null==a?null:a)];if(!c&&(c=Dg._,!c))throw x("IReset.-reset!",a);return c.call(null,a,b)}
var Eg=function(){function a(a,b,c,d,e){if(a?a.nc:a)return a.nc(a,b,c,d,e);var q;q=Eg[m(null==a?null:a)];if(!q&&(q=Eg._,!q))throw x("ISwap.-swap!",a);return q.call(null,a,b,c,d,e)}function b(a,b,c,d){if(a?a.mc:a)return a.mc(a,b,c,d);var e;e=Eg[m(null==a?null:a)];if(!e&&(e=Eg._,!e))throw x("ISwap.-swap!",a);return e.call(null,a,b,c,d)}function c(a,b,c){if(a?a.lc:a)return a.lc(a,b,c);var d;d=Eg[m(null==a?null:a)];if(!d&&(d=Eg._,!d))throw x("ISwap.-swap!",a);return d.call(null,a,b,c)}function d(a,b){if(a?
a.kc:a)return a.kc(a,b);var c;c=Eg[m(null==a?null:a)];if(!c&&(c=Eg._,!c))throw x("ISwap.-swap!",a);return c.call(null,a,b)}var e=null,e=function(e,h,k,l,n){switch(arguments.length){case 2:return d.call(this,e,h);case 3:return c.call(this,e,h,k);case 4:return b.call(this,e,h,k,l);case 5:return a.call(this,e,h,k,l,n)}throw Error("Invalid arity: "+arguments.length);};e.a=d;e.c=c;e.n=b;e.s=a;return e}();function Fg(a,b,c,d){this.state=a;this.j=b;this.wc=c;this.Wb=d;this.i=2153938944;this.q=16386}g=Fg.prototype;
g.B=function(){return this[ba]||(this[ba]=++ca)};g.Rb=function(a,b,c){a=E(this.Wb);for(var d=null,e=0,f=0;;)if(f<e){var h=d.J(null,f),k=P.c(h,0,null),h=P.c(h,1,null);h.n?h.n(k,this,b,c):h.call(null,k,this,b,c);f+=1}else if(a=E(a))Ic(a)?(d=Hb(a),a=Ib(a),k=d,e=O(d),d=k):(d=F(a),k=P.c(d,0,null),h=P.c(d,1,null),h.n?h.n(k,this,b,c):h.call(null,k,this,b,c),a=I(a),d=null,e=0),f=0;else return null};g.w=function(a,b,c){ub(b,"#\x3cAtom: ");Ag(this.state,b,c);return ub(b,"\x3e")};g.D=function(){return this.j};
g.ub=function(){return this.state};g.v=function(a,b){return this===b};
var Hg=function(){function a(a){return new Fg(a,null,null,null)}var b=null,c=function(){function a(c,d){var k=null;1<arguments.length&&(k=J(Array.prototype.slice.call(arguments,1),0));return b.call(this,c,k)}function b(a,c){var d=Mc(c)?S.a(Tf,c):c,e=Q.a(d,Gg),d=Q.a(d,pa);return new Fg(a,d,e,null)}a.k=1;a.f=function(a){var c=F(a);a=G(a);return b(c,a)};a.d=b;return a}(),b=function(b,e){switch(arguments.length){case 1:return a.call(this,b);default:return c.d(b,J(arguments,1))}throw Error("Invalid arity: "+
arguments.length);};b.k=1;b.f=c.f;b.b=a;b.d=c.d;return b}();function Ig(a,b){if(a instanceof Fg){var c=a.wc;if(null!=c&&!r(c.b?c.b(b):c.call(null,b)))throw Error("Assert failed: Validator rejected reference state\n"+A.b(Cg.d(J([fd(new Zb(null,"validate","validate",1439230700,null),new Zb(null,"new-value","new-value",-1567397401,null))],0))));c=a.state;a.state=b;null!=a.Wb&&xb(a,c,b);return b}return Dg(a,b)}function K(a){return ab(a)}
var Jg=function(){function a(a,b,c,d){return a instanceof Fg?Ig(a,b.c?b.c(a.state,c,d):b.call(null,a.state,c,d)):Eg.n(a,b,c,d)}function b(a,b,c){return a instanceof Fg?Ig(a,b.a?b.a(a.state,c):b.call(null,a.state,c)):Eg.c(a,b,c)}function c(a,b){return a instanceof Fg?Ig(a,b.b?b.b(a.state):b.call(null,a.state)):Eg.a(a,b)}var d=null,e=function(){function a(c,d,e,f,t){var v=null;4<arguments.length&&(v=J(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,f,v)}function b(a,c,d,e,f){return a instanceof
Fg?Ig(a,S.s(c,a.state,d,e,f)):Eg.s(a,c,d,e,f)}a.k=4;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=I(a);var e=F(a);a=I(a);var f=F(a);a=G(a);return b(c,d,e,f,a)};a.d=b;return a}(),d=function(d,h,k,l,n){switch(arguments.length){case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.d(d,h,k,l,J(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.k=4;d.f=e.f;d.a=c;d.c=b;d.n=a;d.d=e.d;return d}(),Kg={};
function Lg(a){if(a?a.ac:a)return a.ac(a);var b;b=Lg[m(null==a?null:a)];if(!b&&(b=Lg._,!b))throw x("IEncodeJS.-clj-\x3ejs",a);return b.call(null,a)}function Mg(a){return(a?r(r(null)?null:a.$b)||(a.Cb?0:s(Kg,a)):s(Kg,a))?Lg(a):"string"===typeof a||"number"===typeof a||a instanceof T||a instanceof Zb?Ng.b?Ng.b(a):Ng.call(null,a):Cg.d(J([a],0))}
var Ng=function Og(b){if(null==b)return null;if(b?r(r(null)?null:b.$b)||(b.Cb?0:s(Kg,b)):s(Kg,b))return Lg(b);if(b instanceof T)return id(b);if(b instanceof Zb)return""+A.b(b);if(Gc(b)){var c={};b=E(b);for(var d=null,e=0,f=0;;)if(f<e){var h=d.J(null,f),k=P.c(h,0,null),h=P.c(h,1,null);c[Mg(k)]=Og(h);f+=1}else if(b=E(b))Ic(b)?(e=Hb(b),b=Ib(b),d=e,e=O(e)):(e=F(b),d=P.c(e,0,null),e=P.c(e,1,null),c[Mg(d)]=Og(e),b=I(b),d=null,e=0),f=0;else break;return c}if(Cc(b)){c=[];b=E(Kd.a(Og,b));d=null;for(f=e=0;;)if(f<
e)k=d.J(null,f),c.push(k),f+=1;else if(b=E(b))d=b,Ic(d)?(b=Hb(d),f=Ib(d),d=b,e=O(b),b=f):(b=F(d),c.push(b),b=I(d),d=null,e=0),f=0;else break;return c}return u?b:null},Pg={};function Qg(a,b){if(a?a.Zb:a)return a.Zb(a,b);var c;c=Qg[m(null==a?null:a)];if(!c&&(c=Qg._,!c))throw x("IEncodeClojure.-js-\x3eclj",a);return c.call(null,a,b)}
var Sg=function(){function a(a){return b.d(a,J([new la(null,1,[Rg,!1],null)],0))}var b=null,c=function(){function a(c,d){var k=null;1<arguments.length&&(k=J(Array.prototype.slice.call(arguments,1),0));return b.call(this,c,k)}function b(a,c){if(a?r(r(null)?null:a.Cc)||(a.Cb?0:s(Pg,a)):s(Pg,a))return Qg(a,S.a(Uf,c));if(E(c)){var d=Mc(c)?S.a(Tf,c):c,e=Q.a(d,Rg);return function(a,b,c,d){return function y(e){return Mc(e)?rg.b(Kd.a(y,e)):Cc(e)?Yd(qc(e),Kd.a(y,e)):e instanceof Array?we(Kd.a(y,e)):ta(e)===
Object?Yd(Ye,function(){return function(a,b,c,d){return function Ra(f){return new V(null,function(a,b,c,d){return function(){for(;;){var a=E(f);if(a){if(Ic(a)){var b=Hb(a),c=O(b),h=new ld(Array(c),0);a:{for(var k=0;;)if(k<c){var l=D.a(b,k),l=new W(null,2,5,X,[d.b?d.b(l):d.call(null,l),y(e[l])],null);h.add(l);k+=1}else{b=!0;break a}b=void 0}return b?pd(h.da(),Ra(Ib(a))):pd(h.da(),null)}h=F(a);return M(new W(null,2,5,X,[d.b?d.b(h):d.call(null,h),y(e[h])],null),Ra(G(a)))}return null}}}(a,b,c,d),null,
null)}}(a,b,c,d)(Jc(e))}()):u?e:null}}(c,d,e,r(e)?jd:A)(a)}return null}a.k=1;a.f=function(a){var c=F(a);a=G(a);return b(c,a)};a.d=b;return a}(),b=function(b,e){switch(arguments.length){case 1:return a.call(this,b);default:return c.d(b,J(arguments,1))}throw Error("Invalid arity: "+arguments.length);};b.k=1;b.f=c.f;b.b=a;b.d=c.d;return b}();function Tg(a){this.pb=a;this.q=0;this.i=2153775104}
Tg.prototype.B=function(){for(var a=Cg.d(J([this],0)),b=0,c=0;c<a.length;++c)b=31*b+a.charCodeAt(c),b%=4294967296;return b};Tg.prototype.w=function(a,b){return ub(b,'#uuid "'+A.b(this.pb)+'"')};Tg.prototype.v=function(a,b){return b instanceof Tg&&this.pb===b.pb};Tg.prototype.toString=function(){return this.pb};var Ug=new T(null,"ppath","ppath"),Vg=new T("zip","branch?","zip/branch?"),Wg=new T(null,"r","r"),Xg=new T("zip","children","zip/children"),pa=new T(null,"meta","meta"),qa=new T(null,"dup","dup"),u=new T(null,"else","else"),Gg=new T(null,"validator","validator"),Yb=new T(null,"default","default"),Yg=new T(null,"sequential","sequential"),ma=new T(null,"flush-on-newline","flush-on-newline"),Zg=new T(null,"l","l"),$g=new T("zip","make-node","zip/make-node"),oa=new T(null,"readably","readably"),ra=new T(null,
"print-length","print-length"),ah=new T(null,"pnodes","pnodes"),bh=new T(null,"changed?","changed?"),ch=new T(null,"tag","tag"),dh=new T(null,"set","set"),eh=new T(null,"end","end"),fh=new T(null,"atom","atom"),Rg=new T(null,"keywordize-keys","keywordize-keys"),gh=new T(null,"map","map"),hh=new T("mori","not-found","mori/not-found"),ih=new T("cljs.core","not-found","cljs.core/not-found");var jh,kh;function lh(a){return a.o?a.o():a.call(null)}function mh(a){return a.o?a.o():a.call(null)}var nh=function(){function a(a,b,c){return Gc(c)?hb(c,a,b):null==c?b:c instanceof Array?hc.c(c,a,b):u?gb.c(c,a,b):null}function b(a,b){return c.c(a,a.o?a.o():a.call(null),b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();
function oh(a,b,c,d){if(a?a.Eb:a)return a.Eb(a,b,c,d);var e;e=oh[m(null==a?null:a)];if(!e&&(e=oh._,!e))throw x("CollFold.coll-fold",a);return e.call(null,a,b,c,d)}
var qh=function ph(b,c){"undefined"===typeof jh&&(jh=function(b,c,f,h){this.$=b;this.Qa=c;this.uc=f;this.sc=h;this.q=0;this.i=917504},jh.Db=!0,jh.Bb="clojure.core.reducers/t6322",jh.Tb=function(b,c){return ub(c,"clojure.core.reducers/t6322")},jh.prototype.N=function(b,c){return gb.c(this,c,c.o?c.o():c.call(null))},jh.prototype.M=function(b,c,f){return gb.c(this.Qa,this.$.b?this.$.b(c):this.$.call(null,c),f)},jh.prototype.D=function(){return this.sc},jh.prototype.F=function(b,c){return new jh(this.$,
this.Qa,this.uc,c)});return new jh(c,b,ph,null)},sh=function rh(b,c){"undefined"===typeof kh&&(kh=function(b,c,f,h){this.$=b;this.Qa=c;this.rc=f;this.tc=h;this.q=0;this.i=917504},kh.Db=!0,kh.Bb="clojure.core.reducers/t6328",kh.Tb=function(b,c){return ub(c,"clojure.core.reducers/t6328")},kh.prototype.Eb=function(b,c,f,h){return oh(this.Qa,c,f,this.$.b?this.$.b(h):this.$.call(null,h))},kh.prototype.N=function(b,c){return gb.c(this.Qa,this.$.b?this.$.b(c):this.$.call(null,c),c.o?c.o():c.call(null))},
kh.prototype.M=function(b,c,f){return gb.c(this.Qa,this.$.b?this.$.b(c):this.$.call(null,c),f)},kh.prototype.D=function(){return this.tc},kh.prototype.F=function(b,c){return new kh(this.$,this.Qa,this.rc,c)});return new kh(c,b,rh,null)},th=function(){function a(a,b){return sh(b,function(b){return function(){var c=null;return c=function(c,e,h){switch(arguments.length){case 0:return b.o?b.o():b.call(null);case 2:return b.a?b.a(c,a.b?a.b(e):a.call(null,e)):b.call(null,c,a.b?a.b(e):a.call(null,e));case 3:return b.a?
b.a(c,a.a?a.a(e,h):a.call(null,e,h)):b.call(null,c,a.a?a.a(e,h):a.call(null,e,h))}throw Error("Invalid arity: "+arguments.length);}}()})}function b(a){return function(b){return c.a(a,b)}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),uh=function(){function a(a,b){return sh(b,function(b){return function(){var c=null;return c=function(c,e,h){switch(arguments.length){case 0:return b.o?
b.o():b.call(null);case 2:return r(a.b?a.b(e):a.call(null,e))?b.a?b.a(c,e):b.call(null,c,e):c;case 3:return r(a.a?a.a(e,h):a.call(null,e,h))?b.c?b.c(c,e,h):b.call(null,c,e,h):c}throw Error("Invalid arity: "+arguments.length);}}()})}function b(a){return function(b){return c.a(a,b)}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),vh=function(){function a(a){return sh(a,
function(a){return function(){var b=null;return b=function(b,d){switch(arguments.length){case 0:return a.o?a.o():a.call(null);case 2:return Fc(d)?c.b(d).M(null,a,b):a.a?a.a(b,d):a.call(null,b,d)}throw Error("Invalid arity: "+arguments.length);}}()})}function b(){return function(a){return c.b(a)}}var c=null,c=function(c){switch(arguments.length){case 0:return b.call(this);case 1:return a.call(this,c)}throw Error("Invalid arity: "+arguments.length);};c.o=b;c.b=a;return c}(),wh=function(){function a(a,
b){return uh.a(Gd(a),b)}function b(a){return function(b){return c.a(a,b)}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),xh=function(){function a(a,b){return qh(b,function(b){return function(){var c=null;return c=function(c,e,h){switch(arguments.length){case 0:return b.o?b.o():b.call(null);case 2:return r(a.b?a.b(e):a.call(null,e))?b.a?b.a(c,e):b.call(null,c,e):
new ec(c);case 3:return r(a.a?a.a(e,h):a.call(null,e,h))?b.c?b.c(c,e,h):b.call(null,c,e,h):new ec(c)}throw Error("Invalid arity: "+arguments.length);}}()})}function b(a){return function(b){return c.a(a,b)}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),yh=function(){function a(a,b){return qh(b,function(b){return function(a){return function(){var c=null;return c=
function(c,d,e){switch(arguments.length){case 0:return b.o?b.o():b.call(null);case 2:return Jg.a(a,Wc),0>ab(a)?new ec(c):b.a?b.a(c,d):b.call(null,c,d);case 3:return Jg.a(a,Wc),0>ab(a)?new ec(c):b.c?b.c(c,d,e):b.call(null,c,d,e)}throw Error("Invalid arity: "+arguments.length);}}()}(Hg.b(a))})}function b(a){return function(b){return c.a(a,b)}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);
};c.b=b;c.a=a;return c}(),zh=function(){function a(a,b){return qh(b,function(b){return function(a){return function(){var c=null;return c=function(c,d,e){switch(arguments.length){case 0:return b.o?b.o():b.call(null);case 2:return Jg.a(a,Wc),0>ab(a)?b.a?b.a(c,d):b.call(null,c,d):c;case 3:return Jg.a(a,Wc),0>ab(a)?b.c?b.c(c,d,e):b.call(null,c,d,e):c}throw Error("Invalid arity: "+arguments.length);}}()}(Hg.b(a))})}function b(a){return function(b){return c.a(a,b)}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Bh=function Ah(b,c,d,e){if(Bc(b))return d.o?d.o():d.call(null);if(O(b)<=c)return nh.c(e,d.o?d.o():d.call(null),b);if(u){var f=Yc(O(b)),h=ze.c(b,0,f);b=ze.c(b,f,O(b));return lh(function(b,c,e,f){return function(){var b=f(c),h;h=f(e);return d.a?d.a(b.o?b.o():b.call(null),mh(h)):d.call(null,b.o?b.o():b.call(null),mh(h))}}(f,h,b,function(b,f,h){return function(q){return function(){return function(){return Ah(q,
c,d,e)}}(b,f,h)}}(f,h,b)))}return null};W.prototype.Eb=function(a,b,c,d){return Bh(this,b,c,d)};oh.object=function(a,b,c,d){return nh.c(d,c.o?c.o():c.call(null),a)};oh["null"]=function(a,b,c){return c.o?c.o():c.call(null)};function Ch(a,b){var c=S.c(ig,a,b);return M(c,Vd(function(a){return function(b){return a===b}}(c),b))}
var Dh=function(){function a(a,b){return O(a)<O(b)?C.c(pc,b,a):C.c(pc,a,b)}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){a=Ch(O,pc.d(d,c,J([a],0)));return C.c(Yd,F(a),G(a))}a.k=2;a.f=function(a){var c=F(a);a=I(a);var d=F(a);a=G(a);return b(c,d,a)};a.d=b;return a}(),b=function(b,e,f){switch(arguments.length){case 0:return bg;case 1:return b;case 2:return a.call(this,b,e);default:return c.d(b,
e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.o=function(){return bg};b.b=function(a){return a};b.a=a;b.d=c.d;return b}(),Eh=function(){function a(a,b){for(;;)if(O(b)<O(a)){var c=a;a=b;b=c}else return C.c(function(a,b){return function(a,c){return Oc(b,c)?a:Ac.a(a,c)}}(a,b),a,a)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){a=Ch(function(a){return-O(a)},
pc.d(e,d,J([a],0)));return C.c(b,F(a),G(a))}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}(),Fh=function(){function a(a,b){return O(a)<O(b)?C.c(function(a,c){return Oc(b,c)?Ac.a(a,c):a},a,a):C.c(Ac,a,b)}var b=null,
c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=J(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){return C.c(b,a,pc.a(e,d))}a.k=2;a.f=function(a){var b=F(a);a=I(a);var d=F(a);a=G(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.d(b,e,J(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.k=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=
c.d;return b}();function Gh(a,b){return Wb.a(a,b)?new W(null,3,5,X,[null,null,a],null):new W(null,3,5,X,[a,b,null],null)}function Hh(a){return E(a)?C.c(function(a,c){var d=P.c(c,0,null),e=P.c(c,1,null);return R.c(a,d,e)},we(Od.a(S.a(Xc,Ve(a)),null)),a):null}
function Ih(a,b,c){var d=Q.a(a,c),e=Q.a(b,c),f=Jh.a?Jh.a(d,e):Jh.call(null,d,e),h=P.c(f,0,null),k=P.c(f,1,null),f=P.c(f,2,null);a=Oc(a,c);b=Oc(b,c);d=a&&b&&(null!=f||null==d&&null==e);return new W(null,3,5,X,[!a||null==h&&d?null:new af([c,h]),!b||null==k&&d?null:new af([c,k]),d?new af([c,f]):null],null)}
var Kh=function(){function a(a,b,c){return C.c(function(a,b){return rg.b(Kd.c(Zf,a,b))},new W(null,3,5,X,[null,null,null],null),Kd.a(Id.c(Ih,a,b),c))}function b(a,b){return c.c(a,b,Dh.a(Ve(a),Ve(b)))}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();
function Lh(a,b){return we(Kd.a(Hh,Kh.c(Hc(a)?a:we(a),Hc(b)?b:we(b),pg.b(function(){var c=O(a),d=O(b);return c>d?c:d}()))))}function Mh(a,b){return new W(null,3,5,X,[Cd(Fh.a(a,b)),Cd(Fh.a(b,a)),Cd(Eh.a(a,b))],null)}function Nh(a){if(a?a.qc:a)return a.qc(a);var b;b=Nh[m(null==a?null:a)];if(!b&&(b=Nh._,!b))throw x("EqualityPartition.equality-partition",a);return b.call(null,a)}
function Oh(a,b){if(a?a.pc:a)return a.pc(a,b);var c;c=Oh[m(null==a?null:a)];if(!c&&(c=Oh._,!c))throw x("Diff.diff-similar",a);return c.call(null,a,b)}Nh._=function(a){return(a?a.i&1024||a.cc||(a.i?0:s(Pa,a)):s(Pa,a))?gh:(a?a.i&4096||a.jc||(a.i?0:s(Va,a)):s(Va,a))?dh:(a?a.i&16777216||a.ic||(a.i?0:s(mb,a)):s(mb,a))?Yg:Yb?fh:null};Nh["boolean"]=function(){return fh};Nh["function"]=function(){return fh};Nh.array=function(){return Yg};Nh.number=function(){return fh};Nh.string=function(){return fh};
Nh["null"]=function(){return fh};Oh._=function(a,b){return function(){switch(Nh(a)instanceof T?Nh(a).sa:null){case "map":return Kh;case "sequential":return Lh;case "set":return Mh;case "atom":return Gh;default:throw Error("No matching clause: "+A.b(Nh(a)));}}().call(null,a,b)};Oh["boolean"]=function(a,b){return Gh(a,b)};Oh["function"]=function(a,b){return Gh(a,b)};Oh.array=function(a,b){return Lh(a,b)};Oh.number=function(a,b){return Gh(a,b)};Oh.string=function(a,b){return Gh(a,b)};
Oh["null"]=function(a,b){return Gh(a,b)};function Jh(a,b){return Wb.a(a,b)?new W(null,3,5,X,[null,null,a],null):Wb.a(Nh(a),Nh(b))?Oh(a,b):Gh(a,b)};function Ph(a){if(a?a.Ub:a)return a.Ub();var b;b=Ph[m(null==a?null:a)];if(!b&&(b=Ph._,!b))throw x("PushbackReader.read-char",a);return b.call(null,a)}function Qh(a,b){if(a?a.Vb:a)return a.Vb(0,b);var c;c=Qh[m(null==a?null:a)];if(!c&&(c=Qh._,!c))throw x("PushbackReader.unread",a);return c.call(null,a,b)}function Rh(a,b,c){this.r=a;this.buffer=b;this.Fb=c}Rh.prototype.Ub=function(){return 0===this.buffer.length?(this.Fb+=1,this.r[this.Fb]):this.buffer.pop()};Rh.prototype.Vb=function(a,b){return this.buffer.push(b)};
function Sh(a){var b=!/[^\t\n\r ]/.test(a);return r(b)?b:","===a}var Th=function(){function a(a,d){var e=null;1<arguments.length&&(e=J(Array.prototype.slice.call(arguments,1),0));return b.call(this,0,e)}function b(a,b){throw Error(S.a(A,b));}a.k=1;a.f=function(a){F(a);a=G(a);return b(0,a)};a.d=b;return a}();
function Uh(a,b){for(var c=new ea(b),d=Ph(a);;){var e;if(!(e=null==d||Sh(d))){e=d;var f="#"!==e;e=f?(f="'"!==e)?(f=":"!==e)?Vh.b?Vh.b(e):Vh.call(null,e):f:f:f}if(e)return Qh(a,d),c.toString();c.append(d);d=Ph(a)}}function Wh(a){for(;;){var b=Ph(a);if("\n"===b||"\r"===b||null==b)return a}}var Xh=tg("^([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+))(N)?$"),Yh=tg("^([-+]?[0-9]+)/([0-9]+)$"),Zh=tg("^([-+]?[0-9]+(\\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?$"),$h=tg("^[:]?([^0-9/].*/)?([^0-9/][^/]*)$");
function ai(a,b){var c=a.exec(b);return null!=c&&c[0]===b?1===c.length?c[0]:c:null}var bi=tg("^[0-9A-Fa-f]{2}$"),ci=tg("^[0-9A-Fa-f]{4}$");function di(a,b,c,d){return r(sg(a,d))?d:Th.d(b,J(["Unexpected unicode escape \\",c,d],0))}function ei(a){return String.fromCharCode(parseInt(a,16))}
function fi(a){var b=Ph(a),c="t"===b?"\t":"r"===b?"\r":"n"===b?"\n":"\\"===b?"\\":'"'===b?'"':"b"===b?"\b":"f"===b?"\f":null;r(c)?a=c:"x"===b?(c=(new ea(Ph(a),Ph(a))).toString(),a=ei(di(bi,a,b,c))):"u"===b?(c=(new ea(Ph(a),Ph(a),Ph(a),Ph(a))).toString(),a=ei(di(ci,a,b,c))):a=/[^0-9]/.test(b)?u?Th.d(a,J(["Unexpected unicode escape \\",b],0)):null:String.fromCharCode(b);return a}
function gi(a,b){for(var c=yb(qe);;){var d;a:{d=Sh;for(var e=b,f=Ph(e);;)if(r(d.b?d.b(f):d.call(null,f)))f=Ph(e);else{d=f;break a}d=void 0}r(d)||Th.d(b,J(["EOF while reading"],0));if(a===d)return Ab(c);e=Vh.b?Vh.b(d):Vh.call(null,d);r(e)?d=e.a?e.a(b,d):e.call(null,b,d):(Qh(b,d),d=hi.n?hi.n(b,!0,null,!0):hi.call(null,b,!0,null));c=d===b?c:wd.a(c,d)}}function ii(a,b){return Th.d(a,J(["Reader for ",b," not implemented yet"],0))}
function ji(a,b){var c=Ph(a),d=ki.b?ki.b(c):ki.call(null,c);if(r(d))return d.a?d.a(a,b):d.call(null,a,b);d=li.a?li.a(a,c):li.call(null,a,c);return r(d)?d:Th.d(a,J(["No dispatch macro for ",c],0))}function mi(a,b){return Th.d(a,J(["Unmached delimiter ",b],0))}function ni(a){return S.a(fd,gi(")",a))}function oi(a){return gi("]",a)}
function pi(a){var b=gi("}",a),c=O(b);if("number"!==typeof c||isNaN(c)||Infinity===c||parseFloat(c)!==parseInt(c,10))throw Error("Argument must be an integer: "+A.b(c));0!==(c&1)&&Th.d(a,J(["Map literal must contain an even number of forms"],0));return S.a(Tf,b)}function qi(a){for(var b=new ea,c=Ph(a);;){if(null==c)return Th.d(a,J(["EOF while reading"],0));if("\\"===c)b.append(fi(a)),c=Ph(a);else{if('"'===c)return b.toString();if(Yb)b.append(c),c=Ph(a);else return null}}}
function ri(a){for(var b=new ea,c=Ph(a);;){if(null==c)return Th.d(a,J(["EOF while reading"],0));if("\\"===c){b.append(c);var d=Ph(a);if(null==d)return Th.d(a,J(["EOF while reading"],0));var e=function(){var a=b;a.append(d);return a}(),f=Ph(a),b=e,c=f}else{if('"'===c)return b.toString();if(u)e=function(){var a=b;a.append(c);return a}(),f=Ph(a),b=e,c=f;else return null}}}
function si(a,b){var c=Uh(a,b);if(r(-1!=c.indexOf("/")))c=$b.a(ad.c(c,0,c.indexOf("/")),ad.c(c,c.indexOf("/")+1,c.length));else var d=$b.b(c),c="nil"===c?null:"true"===c?!0:"false"===c?!1:u?d:null;return c}function ti(a){var b=Uh(a,Ph(a)),c=ai($h,b),b=c[0],d=c[1],c=c[2];return void 0!==d&&":/"===d.substring(d.length-2,d.length)||":"===c[c.length-1]||-1!==b.indexOf("::",1)?Th.d(a,J(["Invalid token: ",b],0)):null!=d&&0<d.length?jd.a(d.substring(0,d.indexOf("/")),c):jd.b(b)}
function ui(a){return function(b){return Da(Da(H,hi.n?hi.n(b,!0,null,!0):hi.call(null,b,!0,null)),a)}}function vi(){return function(a){return Th.d(a,J(["Unreadable form"],0))}}
function wi(a){var b;b=hi.n?hi.n(a,!0,null,!0):hi.call(null,a,!0,null);b=b instanceof Zb?new la(null,1,[ch,b],null):"string"===typeof b?new la(null,1,[ch,b],null):b instanceof T?new af([b,!0]):u?b:null;Gc(b)||Th.d(a,J(["Metadata must be Symbol,Keyword,String or Map"],0));var c=hi.n?hi.n(a,!0,null,!0):hi.call(null,a,!0,null);return(c?c.i&262144||c.oc||(c.i?0:s(db,c)):s(db,c))?N(c,Zf.d(J([xc(c),b],0))):Th.d(a,J(["Metadata can only be applied to IWithMetas"],0))}function xi(a){return eg(gi("}",a))}
function yi(a){return tg(ri(a))}function zi(a){hi.n?hi.n(a,!0,null,!0):hi.call(null,a,!0,null);return a}function Vh(a){return'"'===a?qi:":"===a?ti:";"===a?Wh:"'"===a?ui(new Zb(null,"quote","quote",1377916282,null)):"@"===a?ui(new Zb(null,"deref","deref",1494944732,null)):"^"===a?wi:"`"===a?ii:"~"===a?ii:"("===a?ni:")"===a?mi:"["===a?oi:"]"===a?mi:"{"===a?pi:"}"===a?mi:"\\"===a?Ph:"#"===a?ji:null}function ki(a){return"{"===a?xi:"\x3c"===a?vi():'"'===a?yi:"!"===a?Wh:"_"===a?zi:null}
function hi(a,b,c){for(;;){var d=Ph(a);if(null==d)return r(b)?Th.d(a,J(["EOF while reading"],0)):c;if(!Sh(d))if(";"===d)a=Wh.a?Wh.a(a,d):Wh.call(null,a);else if(u){var e=Vh(d);if(r(e))e=e.a?e.a(a,d):e.call(null,a,d);else{var e=a,f=void 0;!(f=!/[^0-9]/.test(d))&&(f=void 0,f="+"===d||"-"===d)&&(f=Ph(e),Qh(e,f),f=!/[^0-9]/.test(f));if(f)a:{e=a;d=new ea(d);for(f=Ph(e);;){var h;h=null==f;h||(h=(h=Sh(f))?h:Vh.b?Vh.b(f):Vh.call(null,f));if(r(h)){Qh(e,f);f=d=d.toString();h=void 0;if(r(ai(Xh,f)))if(f=ai(Xh,
f),null!=f[2])h=0;else{h=r(f[3])?[f[3],10]:r(f[4])?[f[4],16]:r(f[5])?[f[5],8]:r(f[6])?[f[7],parseInt(f[6],10)]:u?[null,null]:null;var k=h[0];null==k?h=null:(h=parseInt(k,h[1]),h="-"===f[1]?-h:h)}else h=void 0,r(ai(Yh,f))?(f=ai(Yh,f),h=parseInt(f[1],10)/parseInt(f[2],10)):h=r(ai(Zh,f))?parseFloat(f):null;f=h;e=r(f)?f:Th.d(e,J(["Invalid number format [",d,"]"],0));break a}d.append(f);f=Ph(e)}e=void 0}else e=u?si(a,d):null}if(e!==a)return e}else return null}}
function Ai(a){if(Wb.a(3,O(a)))return a;if(3<O(a))return ad.c(a,0,3);if(u)for(a=new ea(a);;)if(3>a.Va.length)a=a.append("0");else return a.toString();else return null}var Bi=function(a,b){return function(c,d){return Q.a(r(d)?b:a,c)}}(new W(null,13,5,X,[null,31,28,31,30,31,30,31,31,30,31,30,31],null),new W(null,13,5,X,[null,31,29,31,30,31,30,31,31,30,31,30,31],null)),Ci=/(\d\d\d\d)(?:-(\d\d)(?:-(\d\d)(?:[T](\d\d)(?::(\d\d)(?::(\d\d)(?:[.](\d+))?)?)?)?)?)?(?:[Z]|([-+])(\d\d):(\d\d))?/;
function Di(a){a=parseInt(a,10);return sa(isNaN(a))?a:null}function Ei(a,b,c,d){a<=b&&b<=c||Th.d(null,J([""+A.b(d)+" Failed:  "+A.b(a)+"\x3c\x3d"+A.b(b)+"\x3c\x3d"+A.b(c)],0));return b}
function Fi(a){var b=sg(Ci,a);P.c(b,0,null);var c=P.c(b,1,null),d=P.c(b,2,null),e=P.c(b,3,null),f=P.c(b,4,null),h=P.c(b,5,null),k=P.c(b,6,null),l=P.c(b,7,null),n=P.c(b,8,null),q=P.c(b,9,null),t=P.c(b,10,null);if(sa(b))return Th.d(null,J(["Unrecognized date/time syntax: "+A.b(a)],0));a=Di(c);var b=function(){var a=Di(d);return r(a)?a:1}(),c=function(){var a=Di(e);return r(a)?a:1}(),v=function(){var a=Di(f);return r(a)?a:0}(),w=function(){var a=Di(h);return r(a)?a:0}(),y=function(){var a=Di(k);return r(a)?
a:0}(),B=function(){var a=Di(Ai(l));return r(a)?a:0}(),n=(Wb.a(n,"-")?-1:1)*(60*function(){var a=Di(q);return r(a)?a:0}()+function(){var a=Di(t);return r(a)?a:0}());return new W(null,8,5,X,[a,Ei(1,b,12,"timestamp month field must be in range 1..12"),Ei(1,c,Bi.a?Bi.a(b,0===(a%4+4)%4&&(0!==(a%100+100)%100||0===(a%400+400)%400)):Bi.call(null,b,0===(a%4+4)%4&&(0!==(a%100+100)%100||0===(a%400+400)%400)),"timestamp day field must be in range 1..last day in month"),Ei(0,v,23,"timestamp hour field must be in range 0..23"),
Ei(0,w,59,"timestamp minute field must be in range 0..59"),Ei(0,y,Wb.a(w,59)?60:59,"timestamp second field must be in range 0..60"),Ei(0,B,999,"timestamp millisecond field must be in range 0..999"),n],null)}
var Gi=Hg.b(new la(null,4,["inst",function(a){var b;if("string"===typeof a)if(b=Fi(a),r(b)){a=P.c(b,0,null);var c=P.c(b,1,null),d=P.c(b,2,null),e=P.c(b,3,null),f=P.c(b,4,null),h=P.c(b,5,null),k=P.c(b,6,null);b=P.c(b,7,null);b=new Date(Date.UTC(a,c-1,d,e,f,h,k)-6E4*b)}else b=Th.d(null,J(["Unrecognized date/time syntax: "+A.b(a)],0));else b=Th.d(null,J(["Instance literal expects a string for its timestamp."],0));return b},"uuid",function(a){return"string"===typeof a?new Tg(a):Th.d(null,J(["UUID literal expects a string as its representation."],
0))},"queue",function(a){return Hc(a)?Yd(Je,a):Th.d(null,J(["Queue literal expects a vector for its elements."],0))},"js",function(a){if(Hc(a)){var b=[];a=E(a);for(var c=null,d=0,e=0;;)if(e<d){var f=c.J(null,e);b.push(f);e+=1}else if(a=E(a))c=a,Ic(c)?(a=Hb(c),e=Ib(c),c=a,d=O(a),a=e):(a=F(c),b.push(a),a=I(c),c=null,d=0),e=0;else break;return b}if(Gc(a)){b={};a=E(a);c=null;for(e=d=0;;)if(e<d){var h=c.J(null,e),f=P.c(h,0,null),h=P.c(h,1,null);b[id(f)]=h;e+=1}else if(a=E(a))Ic(a)?(d=Hb(a),a=Ib(a),c=d,
d=O(d)):(d=F(a),c=P.c(d,0,null),d=P.c(d,1,null),b[id(c)]=d,a=I(a),c=null,d=0),e=0;else break;return b}return u?Th.d(null,J(["JS literal expects a vector or map containing only string or unqualified keyword keys"],0)):null}],null)),Hi=Hg.b(null);
function li(a,b){var c=si(a,b),d=Q.a(ab(Gi),""+A.b(c)),e=ab(Hi);return r(d)?d.b?d.b(hi(a,!0,null)):d.call(null,hi(a,!0,null)):r(e)?e.a?e.a(c,hi(a,!0,null)):e.call(null,c,hi(a,!0,null)):u?Th.d(a,J(["Could not find tag parser for ",""+A.b(c)," in ",Cg.d(J([Ve(ab(Gi))],0))],0)):null};p("mori.apply",S);p("mori.count",O);p("mori.distinct",function(a){return function c(a,e){return new V(null,function(){return function(a,d){for(;;){var e=a,l=P.c(e,0,null);if(e=E(e))if(Oc(d,l))l=G(e),e=d,a=l,d=e;else return M(l,c(G(e),pc.a(d,l)));else return null}}.call(null,a,e)},null,null)}(a,bg)});p("mori.empty",qc);p("mori.first",F);p("mori.rest",G);p("mori.seq",E);p("mori.conj",pc);p("mori.cons",M);
p("mori.find",function(a,b){return null!=a&&Ec(a)&&Oc(a,b)?new W(null,2,5,X,[b,Q.a(a,b)],null):null});p("mori.nth",P);p("mori.last",oc);p("mori.assoc",R);p("mori.dissoc",tc);p("mori.get_in",$d);p("mori.update_in",ae);p("mori.assoc_in",function Ii(b,c,d){var e=P.c(c,0,null);return(c=$c(c))?R.c(b,e,Ii(Q.a(b,e),c,d)):R.c(b,e,d)});p("mori.fnil",Jd);p("mori.disj",Ac);p("mori.pop",zc);p("mori.peek",yc);p("mori.hash",Tb);p("mori.get",Q);p("mori.has_key",Oc);p("mori.is_empty",Bc);p("mori.reverse",ed);
p("mori.take",Md);p("mori.drop",Nd);p("mori.take_nth",function Ji(b,c){return new V(null,function(){var d=E(c);return d?M(F(d),Ji(b,Nd(b,d))):null},null,null)});p("mori.partition",Zd);p("mori.partition_all",jg);p("mori.partition_by",function Ki(b,c){return new V(null,function(){var d=E(c);if(d){var e=F(d),f=b.b?b.b(e):b.call(null,e),e=M(e,lg(function(c,d){return function(c){return Wb.a(d,b.b?b.b(c):b.call(null,c))}}(e,f,d,d),I(d)));return M(e,Ki(b,E(Nd(O(e),d))))}return null},null,null)});
p("mori.iterate",function Li(b,c){return M(c,new V(null,function(){return Li(b,b.b?b.b(c):b.call(null,c))},null,null))});p("mori.into",Yd);p("mori.merge",Zf);p("mori.subvec",ze);p("mori.take_while",lg);p("mori.drop_while",function(a,b){return new V(null,function(c){return function(){return c(a,b)}}(function(a,b){for(;;){var e=E(b),f;f=(f=e)?a.b?a.b(F(e)):a.call(null,F(e)):f;if(r(f))f=a,e=G(e),a=f,b=e;else return e}}),null,null)});
p("mori.group_by",function(a,b){return C.c(function(b,d){var e=a.b?a.b(d):a.call(null,d);return R.c(b,e,pc.a(Q.c(b,e,qe),d))},Ye,b)});p("mori.interpose",function(a,b){return Nd(1,Qd.a(Od.b(a),b))});p("mori.interleave",Qd);p("mori.concat",td);p("mori.conj1",function(a,b){return a.G(null,b)});function Xd(a){return a instanceof Array||Fc(a)}p("mori.flatten",function(a){return Ud(function(a){return!Xd(a)},G(Wd(a)))});p("mori.lazy_seq",function(a){return new V(null,a,null,null)});p("mori.keys",Ve);
p("mori.select_keys",function(a,b){for(var c=Ye,d=E(b);;)if(d)var e=F(d),f=Q.c(a,e,ih),c=Bd.a(f,ih)?R.c(c,e,f):c,d=I(d);else return c});p("mori.vals",We);p("mori.prim_seq",mc);p("mori.map",Kd);p("mori.mapcat",Sd);p("mori.reduce",C);p("mori.reduce_kv",function(a,b,c){return null!=c?hb(c,a,b):b});p("mori.filter",Ud);p("mori.remove",Vd);p("mori.some",Ed);p("mori.every",Dd);p("mori.equals",Wb);p("mori.range",pg);p("mori.repeat",Od);p("mori.repeatedly",Pd);p("mori.sort",Sc);p("mori.sort_by",Tc);
p("mori.into_array",xa);p("mori.subseq",ng);p("mori.rmap",th);p("mori.rfilter",uh);p("mori.rremove",wh);p("mori.rtake",yh);p("mori.rtake_while",xh);p("mori.rdrop",zh);p("mori.rflatten",vh);p("mori.list",fd);p("mori.vector",xe);p("mori.array_map",Uf);p("mori.hash_map",Tf);p("mori.set",eg);p("mori.sorted_set",fg);p("mori.sorted_set_by",gg);p("mori.sorted_map",Vf);p("mori.sorted_map_by",Wf);
p("mori.queue",function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return Yd.a?Yd.a(Je,a):Yd.call(null,Je,a)}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}());p("mori.keyword",jd);p("mori.symbol",$b);p("mori.zipmap",function(a,b){for(var c=yb(Ye),d=E(a),e=E(b);;)if(d&&e)c=xd.c(c,F(d),F(e)),d=I(d),e=I(e);else return Ab(c)});
p("mori.is_list",function(a){return a?a.i&33554432||a.Ec?!0:a.i?!1:s(nb,a):s(nb,a)});p("mori.is_seq",Mc);p("mori.is_vector",Hc);p("mori.is_map",Gc);p("mori.is_set",Dc);p("mori.is_keyword",function(a){return a instanceof T});p("mori.is_symbol",function(a){return a instanceof Zb});p("mori.is_collection",Cc);p("mori.is_sequential",Fc);p("mori.is_associative",Ec);p("mori.is_counted",ic);p("mori.is_indexed",jc);p("mori.is_reduceable",function(a){return a?a.i&524288||a.Nb?!0:a.i?!1:s(fb,a):s(fb,a)});
p("mori.is_seqable",function(a){return a?a.i&8388608||a.hc?!0:a.i?!1:s(kb,a):s(kb,a)});p("mori.is_reversible",dd);p("mori.union",Dh);p("mori.intersection",Eh);p("mori.difference",Fh);p("mori.is_subset",function(a,b){return O(a)<=O(b)&&Dd(function(a){return Oc(b,a)},a)});p("mori.is_superset",function(a,b){return O(a)>=O(b)&&Dd(function(b){return Oc(a,b)},b)});p("mori.partial",Id);p("mori.comp",Hd);
p("mori.pipeline",function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return C.a?C.a(function(a,b){return b.b?b.b(a):b.call(null,a)},a):C.call(null,function(a,b){return b.b?b.b(a):b.call(null,a)},a)}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}());
p("mori.curry",function(){function a(a,d){var e=null;1<arguments.length&&(e=J(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return function(e){return S.a(a,M.a?M.a(e,b):M.call(null,e,b))}}a.k=1;a.f=function(a){var d=F(a);a=G(a);return b(d,a)};a.d=b;return a}());
p("mori.juxt",function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return function(){function b(a){var c=null;0<arguments.length&&(c=J(Array.prototype.slice.call(arguments,0),0));return e.call(this,c)}function e(b){return xa.b?xa.b(Kd.a?Kd.a(function(a){return S.a(a,b)},a):Kd.call(null,function(a){return S.a(a,b)},a)):xa.call(null,Kd.a?Kd.a(function(a){return S.a(a,b)},a):Kd.call(null,function(a){return S.a(a,
b)},a))}b.k=0;b.f=function(a){a=E(a);return e(a)};b.d=e;return b}()}a.k=0;a.f=function(a){a=E(a);return b(a)};a.d=b;return a}());
p("mori.knit",function(){function a(a){var d=null;0<arguments.length&&(d=J(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return function(b){return xa.b?xa.b(Kd.c?Kd.c(function(a,b){return a.b?a.b(b):a.call(null,b)},a,b):Kd.call(null,function(a,b){return a.b?a.b(b):a.call(null,b)},a,b)):xa.call(null,Kd.c?Kd.c(function(a,b){return a.b?a.b(b):a.call(null,b)},a,b):Kd.call(null,function(a,b){return a.b?a.b(b):a.call(null,b)},a,b))}}a.k=0;a.f=function(a){a=E(a);return b(a)};
a.d=b;return a}());p("mori.diff",Jh);p("mori.sum",function(a,b){return a+b});p("mori.inc",function(a){return a+1});p("mori.dec",function(a){return a-1});p("mori.is_even",function(a){return 0===(a%2+2)%2});p("mori.is_odd",function(a){return 1===(a%2+2)%2});p("mori.each",function(a,b){for(var c=E(a),d=null,e=0,f=0;;)if(f<e){var h=d.J(null,f);b.b?b.b(h):b.call(null,h);f+=1}else if(c=E(c))d=c,Ic(d)?(c=Hb(d),e=Ib(d),d=c,h=O(c),c=e,e=h):(h=F(d),b.b?b.b(h):b.call(null,h),c=I(d),d=null,e=0),f=0;else return null});
p("mori.identity",Fd);p("mori.constantly",function(a){return function(){function b(b){0<arguments.length&&J(Array.prototype.slice.call(arguments,0),0);return a}b.k=0;b.f=function(b){E(b);return a};b.d=function(){return a};return b}()});p("mori.clj_to_js",Ng);
p("mori.js_to_clj",function(){function a(a,b){return Sg.d(a,J([Rg,b],0))}function b(a){return Sg.b(a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}());p("mori.parse",function(a){return hi(new Rh(a,[],-1),!1,null)});
p("mori.configure",function(a,b){switch(a){case "print-length":return ia=b;case "print-level":return ja=b;default:throw Error("No matching clause: "+A.b(a));}});
p("mori.proxy",function(a){if("undefined"!==typeof Proxy)return Proxy.create(function(){return{has:function(b){return Oc(a,b)},hasOwn:function(b){return Oc(a,b)},get:function(b,c){var d=Q.c?Q.c(a,c,hh):Q.call(null,a,c,hh);return hd(d,hh)?ic(a)&&"length"===c?O.b?O.b(a):O.call(null,a):null:u?d:null},set:function(){return null},enumerate:function(){return xa.b?xa.b(Ve.b?Ve.b(a):Ve.call(null,a)):xa.call(null,Ve.b?Ve.b(a):Ve.call(null,a))},keys:function(){return Gc(a)?xa.b?xa.b(Ve.b?Ve.b(a):Ve.call(null,
a)):xa.call(null,Ve.b?Ve.b(a):Ve.call(null,a)):Hc(a)?xa.b?xa.b(pg.b?pg.b(O.b?O.b(a):O.call(null,a)):pg.call(null,O.b?O.b(a):O.call(null,a))):xa.call(null,pg.b?pg.b(O.b?O.b(a):O.call(null,a)):pg.call(null,O.b?O.b(a):O.call(null,a))):null}}}());throw Error("ES6 Proxy not supported!");});V.prototype.inspect=function(){return this.toString()};ac.prototype.inspect=function(){return this.toString()};kc.prototype.inspect=function(){return this.toString()};Bf.prototype.inspect=function(){return this.toString()};
vf.prototype.inspect=function(){return this.toString()};wf.prototype.inspect=function(){return this.toString()};bd.prototype.inspect=function(){return this.toString()};gd.prototype.inspect=function(){return this.toString()};cd.prototype.inspect=function(){return this.toString()};W.prototype.inspect=function(){return this.toString()};od.prototype.inspect=function(){return this.toString()};ye.prototype.inspect=function(){return this.toString()};Ae.prototype.inspect=function(){return this.toString()};
$.prototype.inspect=function(){return this.toString()};Y.prototype.inspect=function(){return this.toString()};la.prototype.inspect=function(){return this.toString()};xf.prototype.inspect=function(){return this.toString()};Qf.prototype.inspect=function(){return this.toString()};$f.prototype.inspect=function(){return this.toString()};cg.prototype.inspect=function(){return this.toString()};og.prototype.inspect=function(){return this.toString()};T.prototype.inspect=function(){return this.toString()};
Zb.prototype.inspect=function(){return this.toString()};Ie.prototype.inspect=function(){return this.toString()};He.prototype.inspect=function(){return this.toString()};p("mori._equiv",function(a,b){return a.Hc(b)});p("mori._keys",function(a){return a.keys()});p("mori._values",function(a){return a.values()});p("mori._entries",function(a){return a.entries()});p("mori._has",function(a){return a.has()});p("mori._get",function(a){return a.get()});p("mori._forEach",function(a){return a.forEach()});
p("mori._next",function(a){return a.next()});p("mori.mutable.thaw",function(a){return yb(a)});p("mori.mutable.freeze",vd);p("mori.mutable.conj1",function(a,b){return a.Ka(null,b)});p("mori.mutable.conj",wd);p("mori.mutable.assoc",xd);p("mori.mutable.dissoc",yd);p("mori.mutable.pop",function(a){return Eb(a)});p("mori.mutable.disj",zd);function Mi(a,b,c,d){return N(new W(null,2,5,X,[d,null],null),new la(null,3,[$g,c,Xg,b,Vg,a],null))}function Ni(a){return a.b?a.b(0):a.call(null,0)}function Oi(a){return Vg.b(xc(a)).call(null,Ni(a))}function Pi(a){if(r(Oi(a)))return Xg.b(xc(a)).call(null,Ni(a));throw"called children on a leaf node";}function Qi(a,b,c){return $g.b(xc(a)).call(null,b,c)}
function Ri(a){if(r(Oi(a))){var b=P.c(a,0,null),c=P.c(a,1,null),d=Pi(a),e=P.c(d,0,null),f=$c(d);return r(d)?N(new W(null,2,5,X,[e,new la(null,4,[Zg,qe,ah,r(c)?pc.a(ah.b(c),b):new W(null,1,5,X,[b],null),Ug,c,Wg,f],null)],null),xc(a)):null}return null}
function Si(a){var b=P.c(a,0,null),c=P.c(a,1,null),d=Mc(c)?S.a(Tf,c):c,c=Q.a(d,Zg),e=Q.a(d,Ug),f=Q.a(d,ah),h=Q.a(d,Wg),d=Q.a(d,bh);return r(f)?(f=yc(f),N(r(d)?new W(null,2,5,X,[Qi(a,f,td.a(c,M(b,h))),r(e)?R.c(e,bh,!0):e],null):new W(null,2,5,X,[f,e],null),xc(a))):null}function Ti(a){var b=P.c(a,0,null),c=P.c(a,1,null),c=Mc(c)?S.a(Tf,c):c,d=Q.a(c,Zg),e=Q.a(c,Wg),f=P.c(e,0,null),h=$c(e);return r(r(c)?e:c)?N(new W(null,2,5,X,[f,R.d(c,Zg,pc.a(d,b),J([Wg,h],0))],null),xc(a)):null}
function Ui(a){var b=P.c(a,0,null),c=P.c(a,1,null),c=Mc(c)?S.a(Tf,c):c,d=Q.a(c,Zg),e=Q.a(c,Wg);return r(r(c)?e:c)?N(new W(null,2,5,X,[oc(e),R.d(c,Zg,S.n(pc,d,b,hg(e)),J([Wg,null],0))],null),xc(a)):a}function Vi(a){var b=P.c(a,0,null),c=P.c(a,1,null),c=Mc(c)?S.a(Tf,c):c,d=Q.a(c,Zg),e=Q.a(c,Wg);return r(r(c)?E(d):c)?N(new W(null,2,5,X,[yc(d),R.d(c,Zg,zc(d),J([Wg,M(b,e)],0))],null),xc(a)):null}
function Wi(a,b){P.c(a,0,null);var c=P.c(a,1,null);return N(new W(null,2,5,X,[b,R.c(c,bh,!0)],null),xc(a))}var Xi=function(){function a(a,d,e){var f=null;2<arguments.length&&(f=J(Array.prototype.slice.call(arguments,2),0));return b.call(this,a,d,f)}function b(a,b,e){return Wi(a,S.c(b,Ni(a),e))}a.k=2;a.f=function(a){var d=F(a);a=I(a);var e=F(a);a=G(a);return b(d,e,a)};a.d=b;return a}();p("mori.zip.zipper",Mi);p("mori.zip.seq_zip",function(a){return Mi(Mc,Fd,function(a,c){return N(c,xc(a))},a)});p("mori.zip.vector_zip",function(a){return Mi(Hc,E,function(a,c){return N(we(c),xc(a))},a)});p("mori.zip.node",Ni);p("mori.zip.is_branch",{}.xc);p("mori.zip.children",Pi);p("mori.zip.make_node",Qi);p("mori.zip.path",function(a){return ah.b(a.b?a.b(1):a.call(null,1))});p("mori.zip.lefts",function(a){return E(Zg.b(a.b?a.b(1):a.call(null,1)))});
p("mori.zip.rights",function(a){return Wg.b(a.b?a.b(1):a.call(null,1))});p("mori.zip.down",Ri);p("mori.zip.up",Si);p("mori.zip.root",function(a){for(;;){if(Wb.a(eh,a.b?a.b(1):a.call(null,1)))return Ni(a);var b=Si(a);if(r(b))a=b;else return Ni(a)}});p("mori.zip.right",Ti);p("mori.zip.rightmost",Ui);p("mori.zip.left",Vi);
p("mori.zip.leftmost",function(a){var b=P.c(a,0,null),c=P.c(a,1,null),c=Mc(c)?S.a(Tf,c):c,d=Q.a(c,Zg),e=Q.a(c,Wg);return r(r(c)?E(d):c)?N(new W(null,2,5,X,[F(d),R.d(c,Zg,qe,J([Wg,td.d(G(d),new W(null,1,5,X,[b],null),J([e],0))],0))],null),xc(a)):a});p("mori.zip.insert_left",function(a,b){var c=P.c(a,0,null),d=P.c(a,1,null),d=Mc(d)?S.a(Tf,d):d,e=Q.a(d,Zg);if(null==d)throw"Insert at top";return N(new W(null,2,5,X,[c,R.d(d,Zg,pc.a(e,b),J([bh,!0],0))],null),xc(a))});
p("mori.zip.insert_right",function(a,b){var c=P.c(a,0,null),d=P.c(a,1,null),d=Mc(d)?S.a(Tf,d):d,e=Q.a(d,Wg);if(null==d)throw"Insert at top";return N(new W(null,2,5,X,[c,R.d(d,Wg,M(b,e),J([bh,!0],0))],null),xc(a))});p("mori.zip.replace",Wi);p("mori.zip.edit",Xi);p("mori.zip.insert_child",function(a,b){return Wi(a,Qi(a,Ni(a),M(b,Pi(a))))});p("mori.zip.append_child",function(a,b){return Wi(a,Qi(a,Ni(a),td.a(Pi(a),new W(null,1,5,X,[b],null))))});
p("mori.zip.next",function(a){if(Wb.a(eh,a.b?a.b(1):a.call(null,1)))return a;var b;b=Oi(a);b=r(b)?Ri(a):b;if(r(b))return b;b=Ti(a);if(r(b))return b;for(;;)if(r(Si(a))){b=Ti(Si(a));if(r(b))return b;a=Si(a)}else return new W(null,2,5,X,[Ni(a),eh],null)});p("mori.zip.prev",function(a){var b=Vi(a);if(r(b))for(a=b;;)if(b=Oi(a),b=r(b)?Ri(a):b,r(b))a=Ui(b);else return a;else return Si(a)});p("mori.zip.is_end",function(a){return Wb.a(eh,a.b?a.b(1):a.call(null,1))});
p("mori.zip.remove",function(a){P.c(a,0,null);var b=P.c(a,1,null),b=Mc(b)?S.a(Tf,b):b,c=Q.a(b,Zg),d=Q.a(b,Ug),e=Q.a(b,ah),f=Q.a(b,Wg);if(null==b)throw"Remove at top";if(0<O(c))for(a=N(new W(null,2,5,X,[yc(c),R.d(b,Zg,zc(c),J([bh,!0],0))],null),xc(a));;)if(b=Oi(a),b=r(b)?Ri(a):b,r(b))a=Ui(b);else return a;else return N(new W(null,2,5,X,[Qi(a,yc(e),f),r(d)?R.c(d,bh,!0):d],null),xc(a))});;return this.mori;}.call({});});

},{}],13:[function(_dereq_,module,exports){
var m = _dereq_('mori');

function collectionEquals(a, b) {
  if (m.count(a) !== m.count(b)) {
    return false;
  }

  while (true) {
    var af = m.first(a);
    var bf = m.first(b);

    if (af === null && bf === null) {
      return true;
    }

    var e;
    if (m.is_collection(af)) {
      if (!m.is_collection(bf)) {
        return false;
      }
      e = collectionEquals(af, bf);
    } else {
      e = equals(af, bf);
    }

    if (!e) {
      return false;
    }

    a = m.rest(a);
    b = m.rest(b);
  }
  return true;
}

function equals(a, b) {
  // Has .equals() method.
  if (a && a.equals !== undefined) {
    return a.equals(b);
  }

  // m data structure
  if (m.is_collection(a) && m.is_collection(b)) {
    return collectionEquals(a, b);
  }

  return a === b;
};

module.exports = equals;

},{"mori":12}],14:[function(_dereq_,module,exports){
var Promise = _dereq_('es6-promise').Promise;
var mori = _dereq_('mori');

module.exports.fromString = function (text) {
  if (text && text.length > 0 && text[0] === ':') {
    var m = mori.hash_map('text', text);

    m.__type = 'Keyword';

    m.apply = function (_, seq) {
      var first = mori.first(seq);

      if (!mori.is_map(first)) {
        return Promise.resolve(null);
      }

      return Promise.resolve(mori.get(first, m));
    }

    m.toString = function () {
      return mori.get(m, 'text');
    }

    m.equals = function (other) {
      var thisText = mori.get(m, 'text');
      var otherText = mori.get(other, 'text');
      return thisText === otherText;
    }

    return m;
  } else {
    throw new Error('Invalid keyword: ' + text);
  }
};

module.exports.isInstance = function (o) {
  return mori.is_map(o) && o.__type === 'Keyword';
};

},{"es6-promise":2,"mori":12}],15:[function(_dereq_,module,exports){
function MethodName(name) {
  this.name = name;
}

MethodName.prototype.toString = function () {
  return '.' + this.name;
};

MethodName.isInstance = function (other) {
  return !!other && other.constructor === MethodName;
};

MethodName.prototype.equals = function (other) {
  if (!MethodName.isInstance(other)) {
    return false;
  }

  return this.name == other.name;
};

module.exports = MethodName;

},{}],16:[function(_dereq_,module,exports){
var mori = _dereq_('mori');
var printString = _dereq_('../lang/print-string.js');

function PkgName(segments) {
  this.segments = mori.seq(segments);

  if (!validateSegments(this.segments)) {
    throw new Error(
      'Invalid pkg name segments: ' +
      printString(this.segments));
  }
}

function validateSegments(segments) {
  return mori.count(segments) > 0 && mori.every(validateSegment, segments);
}

function validateSegment(segment) {
  return /^[a-zA-Z_-][\w\d_-]*$/.test(segment);
}

function joinWithDot(a, b) {
  return a + '.' + b;
}

PkgName.prototype.equals = function (other) {
  if (!other || other.constructor !== PkgName) {
    return false;
  }

  return mori.equals(this.segments, other.segments);
};

PkgName.prototype.segmentsAsArray = function () {
  return mori.clj_to_js(this.segments);
}

PkgName.prototype.toString = function () {
  return mori.reduce(joinWithDot, this.segments);
}

PkgName.withSegments = function () {
  var segments = Array.prototype.slice.apply(arguments);
  return new PkgName(segments);
}

PkgName.fromString = function (pkgNameString) {
  return new PkgName(pkgNameString.split('.'));
}

module.exports = PkgName;



},{"../lang/print-string.js":18,"mori":12}],17:[function(_dereq_,module,exports){
var Promise = _dereq_('es6-promise').Promise;
var mori = _dereq_('mori');
var Var = _dereq_('./var.js');
var printString = _dereq_('./print-string.js');

function Pkg(name) {
  this.name = name;
  this.vars = mori.hash_map();
}

Pkg.prototype.resolve = function (symbol) {
  if (mori.has_key(this.vars, symbol.name)) {
    return Promise.resolve(mori.get(this.vars, symbol.name));
  } else {
    return Promise.reject(new Error('Failed to resolve symbol ' + printString(symbol)));
  }
}

Pkg.prototype.def = function (symbol, value) {
  var v = new Var(this, symbol.name, value);

  if (symbol.__meta) {
    v = v.withMeta(symbol.__meta);
  }

  this.vars = mori.assoc(this.vars, symbol.name, v);
  return Promise.resolve(v);
}

module.exports = Pkg;

},{"./print-string.js":18,"./var.js":21,"es6-promise":2,"mori":12}],18:[function(_dereq_,module,exports){
var mori = _dereq_('mori');
var keyword = _dereq_('./keyword.js');

function joinWithSpace(a, b) {
  return a + ' ' + b;
}
function seqToString(seq, before, after) {
  var valueStrs = mori.map(printString, seq);
  var str = mori.reduce(joinWithSpace, valueStrs);
  return before + str + after;
}

function printSingle(arg) {
  if (arg === null || arg === undefined) {
    return 'nil';
  } else if (typeof arg === 'string') {
    return JSON.stringify(arg);
  } else if (keyword.isInstance(arg)) {
    return arg.toString();
  } else if (mori.is_vector(arg)) {
    return seqToString(arg, '[', ']');
  } else if (mori.is_map(arg)) {
    if (mori.is_empty(arg)) {
      return '{}';
    }
    var kvs = mori.flatten(mori.seq(arg));
    return seqToString(kvs, '{', '}');
  } else if (mori.is_collection(arg)) {
    return seqToString(arg, '(', ')');
  } else {
    return arg.toString();
  }
}

function printString() {
  var args = Array.prototype.slice.call(arguments, 0);
  return args.map(printSingle).join(' ');
}

module.exports = printString;

},{"./keyword.js":14,"mori":12}],19:[function(_dereq_,module,exports){
function PropertyName(name) {
  this.name = name;
}

PropertyName.prototype.toString = function () {
  return '.-' + this.name;
};

PropertyName.isInstance = function (other) {
  return !!other && other.constructor === PropertyName;
};

PropertyName.prototype.equals = function (other) {
  if (!PropertyName.isInstance(other)) {
    return false;
  }

  return this.name == other.name;
};

module.exports = PropertyName;

},{}],20:[function(_dereq_,module,exports){
var equals = _dereq_('./equals.js');
var PkgName = _dereq_('./pkg-name.js');

function Symbol(name, pkgName) {
  if (!name || name === '' || name.indexOf('.') !== -1) {
    throw new Error('Invalid name: ' + name);
  }

  this.name = name;
  this.pkgName = pkgName;
}

Symbol.prototype.toString = function () {
  if (this.pkgName) {
    return this.pkgName.toString() + '/' + this.name;
  } else {
    return this.name;
  }
};

Symbol.isInstance = function (other) {
  return !!other && other.constructor === Symbol;
};

Symbol.prototype.equals = function (other) {
  if (!Symbol.isInstance(other)) {
    return false;
  }

  var nameEq = this.name === other.name;

  if (!this.pkgName && !other.pkgName) {
    return nameEq;
  }

  if (this.pkgName && other.pkgName) {
    return nameEq && equals(this.pkgName, other.pkgName);
  }

  return false;
};

Symbol.prototype.withMeta = function (meta) {
  var s = new Symbol(this.name, this.pkgName);
  s.__meta = meta;
  return s;
};

Symbol.withoutPkg = function (name) {
  return new Symbol(name, null);
};

Symbol.inPkgString = function (name, pkgNameString) {
  return new Symbol(name, PkgName.fromString(pkgNameString));
};

Symbol.inPkg = function (name, pkgName) {
  return new Symbol(name, pkgName);
};

module.exports = Symbol;

},{"./equals.js":13,"./pkg-name.js":16}],21:[function(_dereq_,module,exports){
function Var(pkg, name, value) {
  this.pkg = pkg;
  this.name = name;
  this.value = value;
}

Var.prototype.deref = function () {
  return this.value;
};

Var.prototype.withMeta = function (meta) {
  var v = new Var(this.pkg, this.name, this.value);
  v.__meta = meta;
  return v;
};

Var.prototype.toString = function () {
  return '#\'' + this.name;
};

module.exports = Var;

},{}],22:[function(_dereq_,module,exports){
var validNonAlphaNumeric = [
  '_',
  '.',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '=',
  '?',
  '!',
  '&'
];
var character = {
  isWhitespace: function (c) {
    return character.isNewline(c) || c === '\t' || c === ' ';
  },
  isNewline: function (c) {
    return c === '\n';
  },
  isDigit: function (c) {
    return /^\d$/.test(c);
  },
  isHyphen: function (c) {
    return c === '-';
  },
  isAlphaNumeric: function (c) {
    return /^\w$/.test(c);
  },
  isValidNameCharacter: function (c) {
    return character.isAlphaNumeric(c) || validNonAlphaNumeric.indexOf(c) !== -1;
  },
  isColon: function (c) {
    return c === ':';
  },
  isQuote: function (c) {
    return c === '"';
  },
  isSemicolon: function (c) {
    return c === ';';
  }
};
module.exports = character;

},{}],23:[function(_dereq_,module,exports){
var character = _dereq_('./character.js');
var Token = _dereq_('./token.js');

exports.lexWhitespace = function lexWhitespace(lexer) {
  while (true) {
    var c = lexer.read();

    if (!character.isWhitespace(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.WHITESPACE);
        return lexer.eof();
      } else {
        lexer.backup();
      }

      lexer.emitIfNotBlank(Token.WHITESPACE);

      // TODO: Add lexer fns for newline and comment.
      return exports.lexName;
    }
  }
};

var enclosing = {
  '(': Token.LEFT_PARENTHESIS,
  ')': Token.RIGHT_PARENTHESIS,
  '[': Token.LEFT_BRACKET,
  ']': Token.RIGHT_BRACKET,
  '{': Token.LEFT_CURLY_BRACKET,
  '}': Token.RIGHT_CURLY_BRACKET
}

exports.lexEnclosing = function lexEnclosing(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      return lexer.eof();
    }

    if (enclosing.hasOwnProperty(c)) {
      lexer.emit(enclosing[c]);
    } else {
      lexer.backup();
      return exports.lexWhitespace;
    }
  }
};

var readerMacros = {
  '\'': Token.QUOTE
};

exports.lexReaderMacros = function lexReaderMacros(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      return lexer.eof();
    }

    if (readerMacros.hasOwnProperty(c)) {
      lexer.emit(readerMacros[c]);
    } else {
      lexer.backup();
      return exports.lexWhitespace;
    }
  }
};

function charactersShouldBeLexedAsNumber(c, c2) {
  if (c === '+' || c === '-') {
    return character.isDigit(c2);
  } else {
    return character.isDigit(c);
  }
}

exports.lexName = function lexName(lexer) {
  var first = true;

  while (true) {
    var c = lexer.read();

    if (first) {
      var c2 = lexer.peek();

      if (charactersShouldBeLexedAsNumber(c, c2)) {
        lexer.backup();
        return exports.lexNumberSignPrefix;
      } else if (character.isDigit(c)) {
        return lexer.unexpectedCharacter(c);
      }
    }
    if (!character.isValidNameCharacter(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.NAME);
        return lexer.eof();
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.NAME);

      // TODO: Add more lexer fns here...

      if (character.isWhitespace(c)) {
        return exports.lexWhitespace;
      } else if (enclosing.hasOwnProperty(c)) {
        return exports.lexEnclosing;
      } else if (readerMacros.hasOwnProperty(c)) {
        return exports.lexReaderMacros;
      } else if (character.isQuote(c)) {
        return exports.lexStringStart;
      } else if (character.isSemicolon(c)) {
        return exports.lexCommentStart;
      } else if (first && character.isColon(c)) {
        // If we haven't started reading this as a name and
        // a colon shows up, then it should be a keyword.
        return exports.lexKeyword;
      } else {
        return lexer.unexpectedCharacter(c);
      }
    }

    first = false;
  }
};

exports.lexKeyword = function lexKeyword(lexer) {
  var first = true;

  while (true) {
    var c = lexer.read();

    if (first && !character.isColon(c)) {
      return lexer.error('Keywords must begin with a colon');
    }

    if (!first && !character.isValidNameCharacter(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.KEYWORD);
        return lexer.eof();
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.KEYWORD);
      return exports.lexWhitespace;
    }

    first = false;
  }
};

exports.lexCommentStart = function lexCommentStart(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      lexer.emitIfNotBlank(Token.COMMENT_START);
      return lexer.eof();
    }

    if (!character.isSemicolon(c)) {
      lexer.backup()
      lexer.emitIfNotBlank(Token.COMMENT_START);

      return exports.lexCommentContent;
    }
  }
};

exports.lexCommentContent = function lexCommentContent(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      lexer.emit(Token.COMMENT_CONTENT);
      return lexer.eof();
    }

    // New line
    if (character.isNewline(c)) {
      lexer.backup()
      lexer.emit(Token.COMMENT_CONTENT);

      return exports.lexWhitespace;
    }
  }
};

exports.lexStringStart = function lexStringStart(lexer) {
  var c = lexer.read();

  // EOF
  if (c === null) {
    return lexer.eof();
  }

  if (character.isQuote(c)) {
    lexer.emit(Token.STRING_START);
    return exports.lexStringContent;
  } else {
    lexer.backup()
    return exports.lexWhitespace;
  }
};

exports.lexStringContent = function lexStringContent(lexer) {
  var last;
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      lexer.emit(Token.STRING_CONTENT);
      return lexer.eof();
    }

    var escaped = last === '\\';

    if (character.isQuote(c) && !escaped) {
      lexer.backup()
      lexer.emit(Token.STRING_CONTENT);

      return exports.lexStringEnd;
    }

    last = c;
  }
};

exports.lexStringEnd = function lexStringEnd(lexer) {
  var c = lexer.read();

  // EOF
  if (c === null) {
    return lexer.eof();
  }

  if (character.isQuote(c)) {
    lexer.emit(Token.STRING_END);
    return exports.lexWhitespace;
  } else {
    return lexer.unexpectedCharacter(c)
  }
};

exports.lexNumberSignPrefix = function lexNumberSignPrefix(lexer) {
  var c = lexer.read();

  if (c === null) {
    return lexer.eof();
  }

  if (c === '-' || c === '+') {
    lexer.emit(Token.NUMBER_SIGN_PREFIX);
    return exports.lexNumberInteger;
  } else if (character.isDigit(c)) {
    lexer.backup();
    return exports.lexNumberInteger;
  } else {
    lexer.backup();
    return exports.lexWhitespace;
  }
};

exports.lexNumberInteger = function lexNumberInteger(lexer) {
  while (true) {
    var c = lexer.read();

    if (c === null) {
      lexer.emitIfNotBlank(Token.NUMBER_INTEGER);
      return lexer.eof();
    }

    if (character.isDigit(c)) {
      continue;
    } else if (c === '.') {

      // First emit integer part.
      lexer.backup();
      lexer.emitIfNotBlank(Token.NUMBER_INTEGER);

      // Re-read dot and emit.
      lexer.read();
      lexer.emit(Token.DOT);

      return exports.lexNumberDecimals;
    } else if (character.isValidNameCharacter(c)) {
      return lexer.unexpectedCharacter(c);
    } else {
      lexer.backup();
      lexer.emitIfNotBlank(Token.NUMBER_INTEGER);
      return exports.lexWhitespace;
    }
  }
};

exports.lexNumberDecimals = function lexNumberDecimals(lexer) {
  while (true) {
    var c = lexer.read();

    if (c === null) {
      lexer.emitIfNotBlank(Token.NUMBER_DECIMALS);
      return lexer.eof();
    }

    if (character.isDigit(c)) {
      continue;
    } else {
      lexer.backup();
      lexer.emitIfNotBlank(Token.NUMBER_DECIMALS);
      return exports.lexWhitespace;
    }
  }
};

},{"./character.js":22,"./token.js":27}],24:[function(_dereq_,module,exports){
function LexerPosition(line, column) {
  this.line = line;
  this.column = column;
}

LexerPosition.prototype.addLine = function (position) {
  return new LexerPosition(this.line + 1, 1);
};

LexerPosition.prototype.addColumn = function (position) {
  return new LexerPosition(this.line, this.column + 1);
};

module.exports = LexerPosition;

},{}],25:[function(_dereq_,module,exports){
var LexerPosition = _dereq_('./lexer-position.js');
var Token = _dereq_('./token.js');
var character = _dereq_('./character.js');
var lexerFns = _dereq_('./lexer-fns.js');

function Lexer(input) {
  this.input = input;
  this.start = 0;
  this.end = 0;
  this.positions = [];
  this.lastWasNewLine = false;
  this.emitted = [];
  this.nextLexerFn = lexerFns.lexWhitespace;
}

Lexer.prototype._startPosition = function () {
  // We have read something before.
  if (this.positions.length > 0) {
    return this.positions[0];
  }

  // If we've never read, were at column 0.
  return new LexerPosition(1, 0);
};

Lexer.prototype._currentPosition = function () {
  var len = this.positions.length;

  if (len > 0) {
    return this.positions[len - 1]
  }

  return this._startPosition();
};

Lexer.prototype.read = function () {
  if (this.input.length <= this.end) {
    this.end += 1;
    return null;
  }

  var c = this.input[this.end];

  // Add a position based on the last read character.
  var current = this._currentPosition();
  var next = this.lastWasNewLine ? current.addLine() : current.addColumn();
  this.positions.push(next);

  // Remember if this was a new line.
  this.lastWasNewLine = character.isNewline(c);

  // Move end index to next character.
  this.end += 1;

  return c;
};

Lexer.prototype.backup = function () {
  if (this.end <= this.start) {
    throw new Error('Cannot backup more than have been read since last emit');
  }
  this.positions.pop();
  this.end -= 1;
};

Lexer.prototype.peek = function () {
  var c = this.read();
  this.backup();
  return c;
};

// Returns all that the lexer has read since
// the last call to emit().
Lexer.prototype._pendingText = function () {
  return this.input.slice(this.start, this.end);
};

Lexer.prototype.clear = function () {
  // Remove all positions expect the last one, that's where
  // the next token will start.
  this.positions = [this._currentPosition()];

  // Move start position of the pending token text to
  // the next character.
  this.start = this.end;
};

Lexer.prototype._emitWithText = function (tokenType, text) {
  var position = this._currentPosition();
  var token = new Token(tokenType, text, position.line, position.column);

  this.emitted = this.emitted.concat(token);
};

// Emits with all the pending text except the last N characters, specified
// by count. The excluded characters becomes the new pending characters for
// the next emit.
Lexer.prototype.emitExceptLast = function (tokenType, count) {
  // TODO!
}

Lexer.prototype.emit = function (tokenType) {
  var text = this._pendingText();
  this._emitWithText(tokenType, text);
  this.clear();
}

Lexer.prototype.emitIfNotBlank = function (tokenType) {
  var text = this._pendingText();
  if (text !== '') {
    this._emitWithText(tokenType, text);
  }
  this.clear();
}

Lexer.prototype.eof = function () {
  this._emitWithText(Token.EOF, '');
  return null;
}

Lexer.prototype.error = function () {
  var s = Array.prototype.join.call(arguments, ' ');
  this._emitWithText(Token.ERROR, s);
  return null;
}

Lexer.prototype.unexpectedCharacter = function (c) {
  this.error('Unexpected character: ' + c);
  return null;
}

Lexer.prototype._emitMore = function () {
  // Run the fn to let it emit tokens and store the fn it
  // returns.
  var nextFn = this.nextLexerFn.call(null, this);

  if (nextFn && typeof(nextFn) !== 'function') {
    var msg =
      this.nextLexerFn.name +
      ' should have returned function, but was ' +
      typeof(nextFn) +
      ': ' +
      JSON.stringify(nextFn);

    throw new Error(msg);
  }

  this.nextLexerFn = nextFn;

  // If the lexer fn did not emit any tokens but returned
  // a new lexer fn, let's run that right away.
  if (this.emitted.length === 0 && this.nextLexerFn) {
    this._emitMore();
  }
};

// Gets the next token or null if the lexer has no more.
Lexer.prototype.next = function () {

  // If there are no emitted tokens left to return we
  // try to get more from the lexer fn.
  if (this.emitted.length === 0) {

    if (this.nextLexerFn) {
      this._emitMore();
    }
  }

  // Either there was no lexer fn to run or it did not emot
  // any tokens, so let's stop right here with null.
  if (this.emitted.length === 0) {
    return null;
  }

  // Drain the tokens emitted by the last lexer fn, one token
  // at a time.
  return this.emitted.shift();
}

module.exports = Lexer;

},{"./character.js":22,"./lexer-fns.js":23,"./lexer-position.js":24,"./token.js":27}],26:[function(_dereq_,module,exports){
function TokenPosition(line, column) {
  this.line = line;
  this.column = column;
}

TokenPosition.prototype.plus = function (lines, columns) {
  return new TokenPosition(this.line + lines, this.column + columns);
};

TokenPosition.prototype.toString = function () {
  return this.line + ':' + this.column;
};

module.exports = TokenPosition;

},{}],27:[function(_dereq_,module,exports){
var TokenPosition = _dereq_('./token-position.js');

function Token(type, text, line, column) {
  this.type = type;
  this.text = text;
  this.position = new TokenPosition(line, column);
}

Token.NAME = "Name";
Token.KEYWORD = "Keyword";

Token.DOT = "Dot";
Token.HYPHEN = "Hyphen";
Token.SLASH = "Slash";
Token.QUOTE = "Quote";

Token.COMMENT_START = "CommentStart";
Token.COMMENT_CONTENT = "CommentContent";

Token.STRING_START = "StringStart";
Token.STRING_CONTENT = "StringContent";
Token.STRING_END = "StringEnd";

Token.LEFT_PARENTHESIS = "LeftParenthesis";
Token.RIGHT_PARENTHESIS = "RightParenthesis";

Token.LEFT_BRACKET = "LeftBracket";
Token.RIGHT_BRACKET = "RightBracket";

Token.LEFT_CURLY_BRACKET = "LeftCurlyBracket";
Token.RIGHT_CURLY_BRACKET = "RightCurlyBracket";

Token.NUMBER_SIGN_PREFIX = "NumberSignPrefix";
Token.NUMBER_INTEGER = "NumberInteger";
Token.NUMBER_DECIMALS = "NumberDecimals";

Token.WHITESPACE = "Whitespace";
Token.EOF = "EOF";
Token.ERROR = "Error";

module.exports = Token;

},{"./token-position.js":26}],28:[function(_dereq_,module,exports){
var Promise = _dereq_('es6-promise').Promise;

exports.get = function (url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var o = {
          data: xhr.responseText,
          status: xhr.status
        }
        if (xhr.status === 200) {
          return resolve(o);
        } else {
          return reject(o);
        }
      }
    };
    xhr.open('GET', url, true);
    xhr.send(null);
  });
};

},{"es6-promise":2}],29:[function(_dereq_,module,exports){
var Lexer = _dereq_('../lex/lexer.js');
var Token = _dereq_('../lex/token.js');
var TokenScanner = _dereq_('./token-scanner.js');
var Symbol = _dereq_('../lang/symbol.js');
var keyword = _dereq_('../lang/keyword.js');
var PkgName = _dereq_('../lang/pkg-name.js');
var MethodName = _dereq_('../lang/method-name.js');
var PropertyName = _dereq_('../lang/property-name.js');
var m = _dereq_('mori');

var readerFns = {};

function readOne(reader, type) {
  var token = reader.scanner.next();

  if (token.type !== type) {
    reader.scanner.backup()
    reader.unexpectedToken(token)
  }

  return token;
}

function readSimple(type, construct) {
  return function (reader) {
    return construct(readOne(reader, type));
  };
}

function symbolOrLiteral(text) {
  switch (text) {
    case 'nil':
      return null;
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return Symbol.withoutPkg(text)
  }
}

function readSymbol(reader) {
  var token = readOne(reader, Token.NAME);

  if (token === null) {
    return reader.eof();
  }

  var splitBySlash = token.text.split('/');

  if (token.text === '/') {
    return Symbol.withoutPkg('/');
  } else if (splitBySlash.length === 1) {
    if (token.text.indexOf('.-') === 0) {
      return new PropertyName(token.text.slice(2));
    } else if (token.text.indexOf('.') === 0) {
      return new MethodName(token.text.slice(1));
    }
    var splitByDot = token.text.split('.');
    if (splitByDot.length === 1) {
      return symbolOrLiteral(token.text);
    } else {
      return new PkgName(splitByDot);
    }
  } else if (splitBySlash.length === 2) {
    var pkgName = new PkgName.fromString(splitBySlash[0]);
    return Symbol.inPkg(splitBySlash[1], pkgName);
  }
}
readerFns[Token.NAME] = readSymbol;

function makeReadEnclosed(before, after, construct) {
  return function readEnclosed(reader) {
    var inner = [];

    var first = readOne(reader, before);

    if (first === null) {
      return reader.unexpectedToken(first)
    }

    while (true) {
      var token = reader.scanner.next();

      if (token === null) {
        return reader.unexpectedToken(first)
      }

      // The enclosed structure got closed, we're done!
      if (token.type === after) {
        return construct(inner);
      }

      // Try to get a reader fn.
      if (readerFns.hasOwnProperty(token.type)) {
        var readFn = readerFns[token.type];

        // Ignored tokens.
        if (readFn === null) {
          continue
        }

        reader.scanner.backup();
        var read = readFn.call(null, reader);

        inner.push(read);
      } else {
        // Throw error if no matching reader fn is found.
        reader.unexpectedToken(token);
      }
    }
  };
}

// List
readerFns[Token.LEFT_PARENTHESIS] = makeReadEnclosed(
  Token.LEFT_PARENTHESIS,
  Token.RIGHT_PARENTHESIS,
  function (elements) {
    return m.list.apply(null, elements);
  });

// Vector
readerFns[Token.LEFT_BRACKET] = makeReadEnclosed(
  Token.LEFT_BRACKET,
  Token.RIGHT_BRACKET,
  function (elements) {
    return m.vector.apply(null, elements);
  });

// Map
readerFns[Token.LEFT_CURLY_BRACKET] = makeReadEnclosed(
  Token.LEFT_CURLY_BRACKET,
  Token.RIGHT_CURLY_BRACKET,
  function (elements) {
    return m.hash_map.apply(null, elements);
  });

function readString(reader) {
  readOne(reader, Token.STRING_START);
  var content = readOne(reader, Token.STRING_CONTENT);
  readOne(reader, Token.STRING_END);

  // TODO: Is there a better way to parse string literals? I hope so...
  return JSON.parse('"' + content.text + '"');
};
readerFns[Token.STRING_START] = readString;

function readNumber(reader) {
  var prefix, integer, decimals, last;

  while (true) {
    var t = reader.scanner.next();

    if (t === null || t.type === Token.EOF || t.type === Token.WHITESPACE) {
      break;
    } else {
      if (t.type === Token.NUMBER_SIGN_PREFIX) {
        prefix = t;
      } else if (t.type === Token.NUMBER_INTEGER) {
        integer = t;
      } else if (t.type === Token.NUMBER_DECIMALS) {
        decimals = t;
      } else if (t.type !== Token.DOT) {
        reader.scanner.backup();
        break;
      }
      // Store this to be able to report correct location of unexpected token.
      last = t;
    }

  }

  var s = '';

  if (prefix) {
    s += prefix.text;
  }

  if (integer) {
    s += integer.text;
  }

  if (decimals) {
    return parseFloat(s + '.' + decimals.text);
  } else {
    return parseInt(s);
  }
};
readerFns[Token.NUMBER_SIGN_PREFIX] = readNumber;
readerFns[Token.NUMBER_INTEGER] = readNumber;

readerFns[Token.KEYWORD] = readSimple(Token.KEYWORD, function (token) {
  return keyword.fromString(token.text);
});

// Ignored tokens.
readerFns[Token.COMMENT_START] = null;
readerFns[Token.COMMENT_CONTENT] = null;
readerFns[Token.WHITESPACE] = null;

function makeReaderMacro(before, construct) {
  return function readReaderMacro(reader) {
    var first = readOne(reader, before);

    if (first === null) {
      return reader.unexpectedToken(first);
    }

    var token = reader.scanner.next();

    if (token === null) {
      return reader.unexpectedToken(first);
    }

    // Try to get a reader fn.
    if (readerFns.hasOwnProperty(token.type)) {
      var readFn = readerFns[token.type];

      reader.scanner.backup();
      var read = readFn.call(null, reader);

      return construct(read);
    } else {
      // Throw error if no matching reader fn is found.
      reader.unexpectedToken(token);
    }
  };
}

readerFns[Token.QUOTE] = makeReaderMacro(Token.QUOTE, function (inner) {
  return m.list(Symbol.withoutPkg('quote'), inner);
});

function Reader(scanner) {
  this.scanner = scanner;
}

Reader.prototype.unexpectedToken = function (token) {
  // TODO: Better error message with line/column etc.
  throw new Error(
    'Unexpected token ' +
    token.type +
    ' "' +
    token.text +
    '" at ' +
    token.position.toString());
};

Reader.prototype.missing = function (type, position) {
  throw new Error('Missing ' + type + ' at ' + position.toString());
};

Reader.prototype.read = function () {
  var token = this.scanner.peek();

  if (readerFns.hasOwnProperty(token.type)) {
    var readFn = readerFns[token.type];

    if (readFn === null) {
      return null
    }

    var result = readFn.call(null, this);
    return result;
  } else {
    // Throw error if no matching reader fn is found.
    this.unexpectedToken(token);
  }
};

Reader.prototype.readTopLevelForms = function () {
  var forms = m.vector();

  while (true) {
    var token = this.scanner.next();

    if (!token || token.type === Token.EOF) {
      break;
    }

    var isIgnored = token.type === Token.COMMENT_START ||
               token.type === Token.COMMENT_CONTENT ||
               token.type === Token.EOF ||
              token.type === Token.WHITESPACE;

    if (token.type === Token.LEFT_PARENTHESIS) {
      var readFn = readerFns[token.type];

      this.scanner.backup();
      var result = readFn.call(null, this);
      forms = m.conj(forms, result);
    } else if (isIgnored) {
      continue;
    } else {
      this.unexpectedToken(token);
    }
  }

  return forms;
};

Reader.readString = function (s) {
  var lexer = new Lexer(s);
  var scanner = new TokenScanner(lexer);
  var reader = new Reader(scanner)
  return reader.read();
};

Reader.readTopLevelFormsString = function (s) {
  var lexer = new Lexer(s);
  var scanner = new TokenScanner(lexer);
  var reader = new Reader(scanner)
  return reader.readTopLevelForms();
};

module.exports = Reader;

},{"../lang/keyword.js":14,"../lang/method-name.js":15,"../lang/pkg-name.js":16,"../lang/property-name.js":19,"../lang/symbol.js":20,"../lex/lexer.js":25,"../lex/token.js":27,"./token-scanner.js":30,"mori":12}],30:[function(_dereq_,module,exports){
function TokenScanner(source) {
  this.source = source;

  this.current = null;
  this.stored = null;
}

TokenScanner.prototype.next = function () {
  if (this.stored !== null) {

    // backup() has been called, use the stored token.
    var token = this.stored;

    // And reset the state as if the stored token had just been read.
    this.current = token;
    this.stored = null;

    return token;

  } else {

    // Get a new token from the source.
    var token = this.source.next();

    if (token === null) {
      return null;
    }

    this.current = token;
    this.stored = null;

    return token;
  }
};

TokenScanner.prototype.backup = function () {
  if (this.current === null) {
    throw new Error('Cannot backup token scanner');
  }

  this.stored = this.current;
  this.current = null;
};

TokenScanner.prototype.peek = function () {
  var token = this.next();
  this.backup();
  return token;
};

module.exports = TokenScanner;

},{}],31:[function(_dereq_,module,exports){
var isInterop = _dereq_('./is-interop.js');
var Promise = _dereq_('es6-promise').Promise;

function BrowserInterop() {
}

BrowserInterop.prototype.resolve = function (symbol) {
  return new Promise(function (resolve, reject) {
    if (!isInterop(symbol)) {
      return reject(new Error('Could not resolve: ' + symbol.toString()));
    }

    var prop = symbol.name;
    return resolve(window[prop]);
  });
};

module.exports = BrowserInterop;

},{"./is-interop.js":34,"es6-promise":2}],32:[function(_dereq_,module,exports){
var http = _dereq_('../net/http.js');

function BrowserLoader(base) {
  this._base = base;
}

BrowserLoader.prototype.readZapSource = function (pkgName) {
  var self = this;
  var segments = pkgName.segmentsAsArray();
  var relPath = segments.join('/') + '.zap';
  var url = self._base + '/' + relPath;

  return http.get(url).then(function (result) {
    return result.data;
  });
}

module.exports = BrowserLoader;

},{"../net/http.js":28}],33:[function(_dereq_,module,exports){
var m = _dereq_('mori');
var printString = _dereq_('../lang/print-string.js');
var Symbol = _dereq_('../lang/symbol.js');
var keyword = _dereq_('../lang/keyword.js');
var equals = _dereq_('../lang/equals.js');
var Promise = _dereq_('es6-promise').Promise;

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
  var expressionPairs = expressions;

  // If it is not an overloaded function, wrap the args and body anyway so it
  // can be handled the same as overloaded ones.
  if (!m.is_list(m.first(expressions))) {
    if (m.count(expressions) % 2 !== 0) {
      throw new Error('Invalid fn: ' + printString(expressions));
    }
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

  var first = m.first(expressions);
  var firstIsName = Symbol.isInstance(first);
  var name = firstIsName ? first.name : null;

  var overloads = expressionsToOverloads(
    firstIsName ? m.rest(expressions) : expressions);

  var fn = function () {
    var params = m.prim_seq(arguments);
    var overload = overloads.getMatching(params);

    if (!overload) {
      return Promise.reject(new Error('Invalid number of parameters'));
    }

    var bindings = createBindings(overload.args, params, overload.isVariadic);

    return scope.wrap(bindings, false).then(function (scope) {
      return scope.eval(overload.body);
    });
  };

  fn.clone = function () {
    var c = create(scope, expressions);
    c.__meta = fn.__meta;
    return c;
  };

  var macroKey = keyword.fromString(':macro');

  fn.setMacro = function () {
    fn.__meta = m.assoc(fn.__meta, macroKey, true);
    return fn;
  };

  fn.isMacro = function () {
    var macro = m.get(fn.__meta, macroKey);
    return macro === true;
  };

  fn.withMeta = function (metadata) {
    var clone = fn.clone();
    clone.__meta = metadata;
    return clone;
  };

  fn.toString = function () {
    if (name) {
      return '(fn ' + name  + ' ...)';
    }
    return '(fn ...)';
  };

  return fn;
}

module.exports = {
  create: create
};

},{"../lang/equals.js":13,"../lang/keyword.js":14,"../lang/print-string.js":18,"../lang/symbol.js":20,"es6-promise":2,"mori":12}],34:[function(_dereq_,module,exports){
var PkgName = _dereq_('../lang/pkg-name.js');

var jsPkgName = PkgName.withSegments('js');

module.exports = function isInterop(symbol) {
  if (!!symbol.pkgName && typeof symbol.pkgName.equals === 'function') {
    return symbol.pkgName.equals(jsPkgName);
  } else {
    return false;
  }
};

},{"../lang/pkg-name.js":16}],35:[function(_dereq_,module,exports){
var mori = _dereq_('mori');
var printString = _dereq_('../lang/print-string.js');

function create(methodName) {
  var fn = function (target) {
    if (!target) {
      throw new Error('Cannot call ' + printString(methodName) + ' on ' + target);
    }

    var args = Array.prototype.slice.call(arguments, 1);
    var method = target[methodName.name];

    return method.apply(target, args);
  };

  fn.toString = function () {
    return '(' + printString(methodName) + ' ...)';
  };

  return fn;
}

module.exports = {
  create: create
};

},{"../lang/print-string.js":18,"mori":12}],36:[function(_dereq_,module,exports){
var Promise = _dereq_('es6-promise').Promise;
var mori = _dereq_('mori');

function create(propertyName) {
  var fn = function (target) {
    if (!target) {
      Promise.reject(new Error('Cannot get property ' + propertyName.name + ' on ' + target));
    }

    try {
      return Promise.resolve(target[propertyName.name]);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  fn.toString = function () {
    return '(' + propertyName.toString() + ' ...)';
  };

  return fn;
}

module.exports = {
  create: create
};

},{"es6-promise":2,"mori":12}],37:[function(_dereq_,module,exports){
var Promise = _dereq_('es6-promise').Promise;
var mori = _dereq_('mori');
var Reader = _dereq_('../reader/reader.js');
var Scope = _dereq_('./scope.js');
var BrowserInterop = _dereq_('./browser-interop.js');
var isInterop = _dereq_('./is-interop.js');
var Symbol = _dereq_('../lang/symbol.js');
var Pkg = _dereq_('../lang/pkg.js');
var PkgName = _dereq_('../lang/pkg-name.js');
var http = _dereq_('../net/http.js');
var equals = _dereq_('../lang/equals.js');
var printString = _dereq_('../lang/print-string.js');

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

    wrapCore('*rt', self),
    wrapCore('*mori', mori),

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
    wrapMori('assoc', mori.assoc),
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
    }, reject);
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

},{"../lang/equals.js":13,"../lang/pkg-name.js":16,"../lang/pkg.js":17,"../lang/print-string.js":18,"../lang/symbol.js":20,"../net/http.js":28,"../reader/reader.js":29,"./browser-interop.js":31,"./is-interop.js":34,"./scope.js":38,"es6-promise":2,"mori":12}],38:[function(_dereq_,module,exports){
var Promise = _dereq_('es6-promise').Promise;
var mori = _dereq_('mori');
var equals = _dereq_('../lang/equals.js');
var printString = _dereq_('../lang/print-string.js');
var keyword = _dereq_('../lang/keyword.js');
var Symbol = _dereq_('../lang/symbol.js');
var closure = _dereq_('./closure.js');
var SpecialForms = _dereq_('./special-forms.js');
var MethodName = _dereq_('../lang/method-name.js');
var methodCall = _dereq_('./method-call.js');
var PropertyName = _dereq_('../lang/property-name.js');
var propertyGetter = _dereq_('./property-getter.js');

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

// def does not eval the first argument if it's a symbol,
// which is uses to create a new var in a pkg. If it is
// something other than a symbol, it will be evaled.
specialForms.add('def', function (scope, args) {
  var symbol = mori.first(args);
  var symbolPromise;
  if (Symbol.isInstance(symbol)) {
    symbolPromise = Promise.resolve(symbol);
  } else {
    symbolPromise = scope.eval(symbol);
  }

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
specialForms.add('*fn', function (scope, args) {
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
        if (!fn || !fn.apply) {
          return reject(new Error(printString(fn) + ' is not a fn'));
        }

        if (!!fn.isMacro && fn.isMacro()) {
          return self.macroexpand(seq).then(function (expanded) {
            return self.eval(expanded).then(resolve, reject);
          }, reject);

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
          return !!v && v.deref ? v.deref() : v;
        }).then(resolve, reject);
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

},{"../lang/equals.js":13,"../lang/keyword.js":14,"../lang/method-name.js":15,"../lang/print-string.js":18,"../lang/property-name.js":19,"../lang/symbol.js":20,"./closure.js":33,"./method-call.js":35,"./property-getter.js":36,"./special-forms.js":39,"es6-promise":2,"mori":12}],39:[function(_dereq_,module,exports){
var Promise = _dereq_('es6-promise').Promise;
var mori = _dereq_('mori');

function SpecialForms() {
  this._fns = mori.hash_map();
}

SpecialForms.prototype.add = function (name, fn) {
  this._fns = mori.assoc(this._fns, name, fn);
};

SpecialForms.prototype.has = function (symbol) {
  return !!symbol && mori.has_key(this._fns, symbol.name);
};

SpecialForms.prototype.eval = function (scope, symbol, seq) {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (!symbol) {
      return reject('symbol cannot be ' + symbol);
    }
    if (!seq) {
      return reject('symbol cannot be ' + seq);
    }

    var fn = mori.get(self._fns, symbol.name);

    if (fn) {
      return resolve(fn(scope, mori.rest(seq)));
    } else {
      return reject(symbol.name + ' is not a special form');
    }
  })
};

module.exports = SpecialForms;

},{"es6-promise":2,"mori":12}],40:[function(_dereq_,module,exports){
var Runtime = _dereq_('./runtime/runtime.js');
var BrowserLoader = _dereq_('./runtime/browser-loader.js');
var printString = _dereq_('./lang/print-string.js');

module.exports = {
  printString: printString,
  Runtime: Runtime,
  BrowserLoader: BrowserLoader
};

},{"./lang/print-string.js":18,"./runtime/browser-loader.js":32,"./runtime/runtime.js":37}]},{},[40])
(40)
});