var mori = require('mori');
var keyword = require('./keyword.js');

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
