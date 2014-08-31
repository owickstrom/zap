var TokenPosition = require('./token-position.js');

function Token(type, text, line, column) {
  this.type = type;
  this.text = text;
  this.position = new TokenPosition(line, column);
}

Token.NAME = "Name";
Token.KEYWORD = "Keyword";

Token.DOT = "Dot";
Token.HYPHEN = "Hyphen";
Token.SLASH = "Slash";
Token.QUOTE = "Quote";

Token.COMMENT_START = "CommentStart";
Token.COMMENT_CONTENT = "CommentContent";

Token.STRING_START = "StringStart";
Token.STRING_CONTENT = "StringContent";
Token.STRING_END = "StringEnd";

Token.LEFT_PARENTHESIS = "LeftParenthesis";
Token.RIGHT_PARENTHESIS = "RightParenthesis";

Token.LEFT_BRACKET = "LeftBracket";
Token.RIGHT_BRACKET = "RightBracket";

Token.LEFT_CURLY_BRACKET = "LeftCurlyBracket";
Token.RIGHT_CURLY_BRACKET = "RightCurlyBracket";

Token.WHITESPACE = "Whitespace";
Token.EOF = "EOF";
Token.ERROR = "Error";

module.exports = Token;
