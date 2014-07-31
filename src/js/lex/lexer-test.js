var Lexer = require('./lexer.js');

describe('lex.Lexer', function () {

  it('should read single characters', function () {
    var lexer = new Lexer('abc');

    expect(lexer.read()).to.equal('a');
    expect(lexer.read()).to.equal('b');
    expect(lexer.read()).to.equal('c');
  });

});
