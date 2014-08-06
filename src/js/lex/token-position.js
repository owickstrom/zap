function TokenPosition(line, column) {
  this.line = line;
  this.column = column;
}

TokenPosition.prototype.plus = function (lines, columns) {
  return new TokenPosition(this.line + lines, this.column + columns);
};

TokenPosition.prototype.toString = function () {
  return this.line + ':' + this.column;
};

module.exports = TokenPosition;
