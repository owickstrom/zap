var LexerPosition = require('./lexer-position.js');
var Token = require('./token.js');
var lexWhitespace = require('./fns/lex-whitespace.js');

function Lexer(input) {
  this.input = input;
  this.start = 0;
  this.end = 0;
  this.positions = [];
  this.lastWasNewLine = false;
  this.emitted = [];
  this.nextLexerFn = lexWhitespace;
}

Lexer.prototype._startPosition = function () {
  // We have read something before.
  if (this.positions.length > 0) {
    return this.positions[0];
  }

  // If we've never read, were at column 0.
  return new LexerPosition(1, 0);
};

Lexer.prototype._currentPosition = function () {
  var len = this.positions.length;

  if (len > 0) {
    return this.positions[len - 1]
  }

  return this._startPosition();
};

Lexer.prototype.read = function () {
  if (this.input.length <= this.end) {
    return null;
  }

  var c = this.input[this.end];

  // Add a position based on the last read character.
  var current = this._currentPosition();
  var next = this.lastWasNewLine ? current.addLine() : current.addColumn();
  this.positions.push(next);

  // Remember if this was a new line.
  this.lastWasNewLine = c == '\n';

  // Move end index to next character.
  this.end += 1;

  return c;
};

Lexer.prototype.backup = function () {
  this.positions.pop();
  this.end -= 1;
};

Lexer.prototype.peek = function () {
  var c = this.read();
  this.backup();
  return c;
};

// Returns all that the lexer has read since
// the last call to emit().
Lexer.prototype._pendingText = function () {
  return this.input.slice(this.start, this.end);
};

Lexer.prototype.clear = function () {
  // Remove all positions expect the last one, that's where
  // the next token will start.
  this.positions = [this._currentPosition()];

  // Move start position of the pending token text to
  // the next character.
  this.start = this.end;
};

Lexer.prototype._emitWithText = function (tokenType, text) {
  var position = this._currentPosition();
  var token = new Token(tokenType, text, position.line, position.column);

  this.emitted = this.emitted.concat(token);
};

// Emits with all the pending text except the last N characters, specified
// by count. The excluded characters becomes the new pending characters for
// the next emit.
Lexer.prototype.emitExceptLast = function (tokenType, count) {
  // TODO!
}

Lexer.prototype.emit = function (tokenType) {
  var text = this._pendingText();
  this._emitWithText(tokenType, text);
  this.clear();
}

Lexer.prototype.emitIfNotBlank = function (tokenType) {
  var text = this._pendingText();
  if (text !== '') {
    this._emitWithText(tokenType, text);
  }
  this.clear();
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

Lexer.prototype._emitMore = function () {
  // Run the fn to let it emit tokens and store the fn it
  // returns.
  this.nextLexerFn = this.nextLexerFn(this);
};

// Gets the next token or null if the lexer has no more.
Lexer.prototype.next = function () {

  // If there are no emitted tokens left to return we
  // try to get more from the lexer fn.
  if (this.emitted.length === 0) {

    if (this.nextLexerFn) {
      this._emitMore();
    }
  }

  // Either there was no lexer fn to run or it did not emot
  // any tokens, so let's stop right here with null.
  if (this.emitted.length === 0) {
    return null;
  }

  // Drain the tokens emitted by the last lexer fn, one token
  // at a time.
  return this.emitted.shift();
}

module.exports = Lexer;
