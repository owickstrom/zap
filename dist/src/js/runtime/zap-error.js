var printStackTrace = require('stacktrace-js');
var mori = require('mori');
var Keyword = require('../lang/keyword.js');

function ZapError() {
  var wrapped = Error.apply(this, arguments);
  wrapped.name = 'ZapError';

  this.message = wrapped.message;
  this.stack = wrapped.stack;

  return this;
}

ZapError.prototype = Object.create(Error.prototype);

ZapError.prototype.addCallAt = function (symbol) {
  var meta = symbol.__meta;
  var line = mori.get(meta, Keyword.fromString(':line'));
  var column = mori.get(meta, Keyword.fromString(':column'));

  console.log('Adding call at ' + line + ':' + column);

  // TODO: Filename!
  var custom = '    at ' + symbol + ' (<no file>.zap:' + line + ':' + column + ')';
  var lines = this.stack.split('\n');
  lines = [lines[0], custom].concat(lines.slice(1));

  this.stack = lines.join('\n');
};

module.exports = ZapError;
