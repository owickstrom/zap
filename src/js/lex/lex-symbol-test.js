var Lexer = require('./lexer.js');
var Token = require('./token.js');

describe('lex', function () {
  describe('fns', function () {
    describe('lexSymbol', function () {

      it('emits symbol tokens', function () {
        var text = 'abc';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal(text);
      });

      it('emits symbols separated by spaces', function () {
        var text = 'abc def';
        var lexer = new Lexer(text);

        var abc = lexer.next();
        expect(abc.type).to.equal(Token.SYMBOL);
        expect(abc.text).to.equal('abc');

        expect(lexer.next().type).to.equal(Token.WHITESPACE);

        var def = lexer.next();
        expect(def.type).to.equal(Token.SYMBOL);
        expect(def.text).to.equal('def');
      });

      it('does not allow symbols starting with a digit', function () {
        var text = '1a';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.ERROR);
        expect(s.text).to.contain('Symbols must not begin with a digit');
      });

      it('allows ASCII alphanumeric characters', function () {
        var text = 'a123';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal('a123');
      });

      it('does not allow non-ASCII alphanumeric characters', function () {
        var text = 'aåäö';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal('a');

        var s = lexer.next();
        expect(s.type).to.equal(Token.ERROR);
        expect(s.text).to.contain('Unexpected character');
      });

      it('allows hyphens', function () {
        var text = 'a-b';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal('a-b');
      });

      it('allows underscores', function () {
        var text = 'a_b';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal('a_b');
      });

      it('allows stars', function () {
        var text = '*a*';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal('*a*');
      });

      it('allows question marks', function () {
        var text = 'a?';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal('a?');
      });

    });
  });
});
