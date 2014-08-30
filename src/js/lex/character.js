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
  isValidFirstTwoCharactersInNumber: function (c, c2) {
      return (character.isDigit(c) ||
      c === '-' ||
      c === '+') &&
      character.isDigit(c2);
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
