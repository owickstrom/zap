var character = require('../character.js');
var Token = require('../token.js');
var lexSymbol = require('./lex-symbol.js');

module.exports = function lexWhitespace(lexer) {
  while (true) {
    var c = lexer.read();

    if (!character.isWhitespace(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.WHITESPACE);
        return lexer.endWith(Token.EOF);
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.WHITESPACE);

      // TODO: Add lexer fns for newline and comment.

      if (character.isValidSymbolCharacter(c)) {
        return lexSymbol;
      } else {
        return lexer.unexpectedCharacter(c);
      }
    }
  }
};
