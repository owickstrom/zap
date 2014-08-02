function TokenScanner(source) {
  this.source = source;

  this.current = null;
  this.stored = null;
}

TokenScanner.prototype.next = function () {
  if (this.stored !== null) {

    // backup() has been called, use the stored token.
    var token = this.stored;

    // And reset the state as if the stored token had just been read.
    this.current = token;
    this.stored = null;

    return token;

  } else {

    // Get a new token from the source.
    var token = this.source.next();

    if (token === null) {
      return null;
    }

    this.current = token;
    this.stored = null;

    return token;
  }
};

TokenScanner.prototype.backup = function () {
  if (this.current === null) {
    throw new Error('Cannot backup token scanner');
  }

  this.stored = this.current;
  this.current = null;
};

TokenScanner.prototype.peek = function () {
  var token = this.next();
  this.backup();
  return token;
};

module.exports = TokenScanner;
