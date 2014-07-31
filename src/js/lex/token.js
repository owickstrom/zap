var TokenPosition = require('./token-position.js');

function Token(type, text, line, column) {
  this.type = type;
  this.text = text;
  this.position = new TokenPosition(line, column);
}


Token.SYMBOL = "Symbol";

module.exports = Token;
