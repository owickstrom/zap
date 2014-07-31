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

});
