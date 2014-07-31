function Lexer() {
  this.positions = [];
}

Lexer.prototype._startPosition = function () {
  // We have read something before.
  if (this.positions.length > 0) {
    return this.positions[0];
  }

  // If we've never read, were at column 0.
  return new LexerPosition(1, 1);
};

Lexer.prototype._currentPosition = function () {
  var len = this.positions.length;

  if (len > 0) {
    return this.positions[len - 1]
  }

  return this._startPosition();
};

Lexer.prototype.read = function () {
  // TODO!
};

Lexer.prototype.backup = function () {
  // TODO!
};

Lexer.prototype.peek = function () {
  // TODO!
};

// Returns all that the lexer has read since
// the last call to emit().
Lexer.prototype.pendingText = function () {
  // TODO!
};

Lexer.prototype.clearPendingAndPositions = function () {
  // TODO!
};

Lexer.prototype.emitWithText = function () {
  // TODO!
};

// Emits with all the pending text except the last N characters, specified
// by count. The excluded characters becomes the new pending characters for
// the next emit.
Lexer.prototype.emitExceptLast = function (tokenType, count) {
  // TODO!
}

Lexer.prototype.emit = function (tokenType) {
  // TODO!
}

Lexer.prototype.emitIfNotBlank = function (tokenType) {
  // TODO!
}

Lexer.prototype.eof = function () {
  // TODO!
}

Lexer.prototype.endWith = function () {
  // TODO!
}

Lexer.prototype.error = function () {
  // Use first arg as format and rest as replacements.
  //
  // TODO!
}

Lexer.prototype.unexpectedCharacter = function () {
  // TODO!
}

// Gets the next token or null if the lexer has no more.
Lexer.prototype.next = function () {
  // TODO!
}

module.exports = Lexer;
