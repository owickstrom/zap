var TokenPosition = require('./token-position.js');

function Token(type, text, line, column) {
  this.type = type;
  this.text = text;
  this.position = new TokenPosition(line, column);
}

Token.SYMBOL = "Symbol";
Token.WHITESPACE = "Whitespace";
Token.EOF = "EOF";
Token.ERROR = "Error";

module.exports = Token;
