var character = require('../character.js');
var Token = require('../token.js');
var lexWhitespace = require('./lex-whitespace.js');

module.exports = function lexSymbol(lexer) {
  var first = true;

  while (true) {
    var c = lexer.read();

    if (first && character.isDigit(c)) {
      return lexer.error('Symbols must not begin with a digit');
    }

    if (!character.isValidSymbolCharacter(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.SYMBOL);
        return lexer.endWith(Token.EOF);
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.SYMBOL);

      // TODO: Add more lexer fns here...

      if (character.isWhitespace(c)) {
        return lexWhitespace;
      } else {
        return lexer.unexpectedCharacter(c);
      }
    }

    first = false;
  }
};
