var mori = require('mori');
var printString = require('./print-string.js');

function Keyword(text) {
  if (text && text.length > 0 && text[0] === ':') {
    this.text = text;
  } else {
    throw new Error('Invalid keyword: "' + text + '"');
  }
}

Keyword.prototype.equals = function (other) {
  if (!other) {
    return false;
  }
  return this.text === other.text;
}

Keyword.prototype.toString = function () {
  return this.text;
};

Keyword.prototype.apply = function (seq) {
  var first = mori.first(seq);

  if (!mori.is_map(first)) {
    return Promise.reject(printString(this, 'cannot be applied to', first))
  }

  return mori.get(first, this.name);
};

module.exports = Keyword;
