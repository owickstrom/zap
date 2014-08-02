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
  isAlphaNumeric: function (c) {
    return /^\w$/.test(c);
  },
  isValidSymbolCharacter: function (c) {
    return character.isAlphaNumeric(c) ||
      c == '-' ||
      c == '_' ||
      c == '?' ||
      c == '!' ||
      c == '*';
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
