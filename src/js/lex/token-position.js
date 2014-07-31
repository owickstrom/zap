function TokenPosition(line, column) {
  this.line = line;
  this.column = column;
}

TokenPosition.prototype.plus = function (lines, columns) {
  return new TokenPosition(this.line + lines, this.column + columns);
};

module.exports = TokenPosition;
