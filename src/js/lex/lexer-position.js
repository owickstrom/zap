function LexerPosition(line, column) {
  this.line = line;
  this.column = column;
}

LexerPosition.prototype.addLine = function (position) {
  return new LexerPosition(this.line + 1, 1);
};

LexerPosition.prototype.addColumn = function (position) {
  return new LexerPosition(this.line, this.column + 1);
};

module.exports = LexerPosition;
