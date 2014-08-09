var mori = require('mori');

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
  } else if (mori.is_list(arg)) {
    return seqToString(arg, '(', ')');
  } else if (mori.is_vector(arg)) {
    return seqToString(arg, '[', ']');
  } else if (mori.is_map(arg)) {
    if (mori.is_empty(arg)) {
      return '{}';
    }
    var kvs = mori.flatten(mori.seq(arg));
    return seqToString(kvs, '{', '}');
  } else {
    return arg.toString();
  }
}

function printString() {
  var args = Array.prototype.slice.call(arguments, 0);
  return args.map(printSingle).join(' ');
}

module.exports = printString;
