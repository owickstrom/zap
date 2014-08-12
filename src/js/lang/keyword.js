var Promise = require('es6-promise').Promise;
var mori = require('mori');

module.exports.fromString = function (text) {
  if (text && text.length > 0 && text[0] === ':') {
    var m = mori.hash_map('text', text);

    m.__type = 'Keyword';

    m.apply = function (seq) {
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
