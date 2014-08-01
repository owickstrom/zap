var util = require('../util.js');
var Token = require('../token.js');

module.exports = function (lexer) {
  while (true) {
    var c = lexer.read();

    if (!util.isWhitespace(c)) {

      // EOF
      if (c !== null) {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.WHITESPACE);

      // TODO: Add lexer fns for newline, comment and symbol.
      return null;
    }
  }
};
