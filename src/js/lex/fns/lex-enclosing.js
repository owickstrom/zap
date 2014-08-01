var Token = require('../token.js');
var lexWhitespace = require('./lex-whitespace.js');

module.exports = function (types) {
  return function lexEnclosing(lexer) {
    while (true) {
      var c = lexer.read();

      // EOF
      if (c === null) {
        return lexer.endWith(Token.EOF);
      }

      if (types.hasOwnProperty(c)) {
        lexer.emit(types[c]);
      } else {
        lexer.backup();
        return lexWhitespace;
      }
    }
  };
};
