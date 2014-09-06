var printStackTrace = require('stacktrace-js');
var mori = require('mori');
var Keyword = require('./keyword.js');

function ZapError() {
  var wrapped;

  if (arguments.length === 1 && arguments[0] instanceof Error) {
    Error.apply(this);
    wrapped = arguments[0];
  } else {
    wrapped = Error.apply(this, arguments);
    wrapped.name = 'ZapError';
  }

  this.message = wrapped.message;
  this.stack = wrapped.stack;

  return this;
}

ZapError.prototype = Object.create(Error.prototype);

ZapError.prototype.addCallAt = function (symbol) {
  var meta = symbol.__meta;
  var file = mori.get(meta, Keyword.fromString(':file')) || '<no-file>.zap';
  var line = mori.get(meta, Keyword.fromString(':line'));
  var column = mori.get(meta, Keyword.fromString(':column'));

  var custom = '    at ' + symbol + ' (' + file + ':' + line + ':' + column + ')';
  var lines = this.stack.split('\n');
  // TODO: Use splice
  lines = [lines[0], custom].concat(lines.slice(1));

  this.stack = lines.join('\n');
};

/*
 * Returns an array of objects that describe each line in the stack trace:
 * &lt;pre&gt;
 * [
 *   {
 *     text: '...',
 *     highlighted: true
 *   },
 *   ...
 * ]
 * &lt;/pre&gt;
 */
ZapError.prototype.getHighlightedLinesMarked = function () {
  var marked = [];
  var lines = this.stack.split('\n');

  // First line is always highlighted.
  marked.push({
    text: lines[0],
    highlighted: true
  });

  lines.slice(1).forEach(function (line) {
    // Lines containing .zap are highlighted.
    marked.push({
      text: line,
      highlighted: /\(.+?\.zap:/.test(line)
    })
  });

  return marked;
}

module.exports = ZapError;
