function LexerPosition(line, column) {
  this.line = line;
  this.column = column;
}

LexerPosition.prototype.addLine = function (position) {
  return new LexerPosition(position.line + 1, position.column);
};

LexerPosition.prototype.addColumn = function (position) {
  return new LexerPosition(position.line, position.column + 1);
};

module.exports = LexerPosition;
