var Lexer = require('./lexer.js');
var Token = require('./token.js');

describe('lex.Lexer', function () {

  it('should read single characters', function () {
    var lexer = new Lexer('abc');

    expect(lexer.read()).to.equal('a');
    expect(lexer.read()).to.equal('b');
    expect(lexer.read()).to.equal('c');
    expect(lexer.read()).to.be.equal(null);
  });

  it('should backup', function () {
    var lexer = new Lexer('ab');

    expect(lexer.read()).to.equal('a');
    lexer.backup();
    expect(lexer.read()).to.equal('a');
    expect(lexer.read()).to.equal('b');
    expect(lexer.read()).to.be.null;
  });

  it('should peek', function () {
    var lexer = new Lexer('ab');

    expect(lexer.peek()).to.equal('a');
    expect(lexer.read()).to.equal('a');
    expect(lexer.read()).to.equal('b');
    expect(lexer.read()).to.be.null;
  });

  it('emits tokens', function () {
    var lexer = new Lexer('ab');

    lexer.read();
    lexer.read();
    lexer.emit(Token.SYMBOL);

    var token = lexer.next();
    expect(token.type).to.equal(Token.SYMBOL);
    expect(token.text).to.equal('ab');
  });

  it('emits non-blank tokens', function () {
    var lexer = new Lexer('ab');

    lexer.emitIfNotBlank(Token.SYMBOL);
    lexer.read();
    lexer.read();
    lexer.emitIfNotBlank(Token.SYMBOL);

    var token = lexer.next();
    expect(token.type).to.equal(Token.SYMBOL);
    expect(token.text).to.equal('ab');
  });

  it('emits multiple tokens', function () {
    var lexer = new Lexer('ab');

    lexer.read();
    lexer.emitIfNotBlank(Token.SYMBOL);
    lexer.read();
    lexer.emitIfNotBlank(Token.SYMBOL);

    expect(lexer.next().text).to.equal('a');
    expect(lexer.next().text).to.equal('b');
  });

  it('emits tokens with position', function () {
    var lexer = new Lexer('ab\nc');

    lexer.read();
    lexer.emit(Token.SYMBOL);
    lexer.read();
    lexer.emit(Token.SYMBOL);
    lexer.read();
    lexer.emit(Token.SYMBOL);
    lexer.read();
    lexer.emit(Token.SYMBOL);

    var a = lexer.next();
    expect(a.position.line).to.equal(1);
    expect(a.position.column).to.equal(1);

    var b = lexer.next();
    expect(b.position.line).to.equal(1);
    expect(b.position.column).to.equal(2);

    var w = lexer.next();
    expect(w.position.line).to.equal(1);
    expect(w.position.column).to.equal(3);

    var c = lexer.next();
    expect(c.position.line).to.equal(2);
    expect(c.position.column).to.equal(1);
  });

  it('emits whitespace tokens');

});
