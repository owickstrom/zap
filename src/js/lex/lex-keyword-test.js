var Lexer = require('./lexer.js');
var Token = require('./token.js');

describe('lex', function () {
  describe('fns', function () {
    describe('lexKeyword', function () {

      it('emits keywords', function () {
        var text = ':keyword';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.KEYWORD);
        expect(s.text).to.equal(text);
      });

      it('does not emit keywords if not starting with colon', function () {
        var text = 'a:keyword';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.SYMBOL);
        expect(lexer.next().type).to.equal(Token.ERROR);
      });

      it('allows ASCII alphanumeric characters', function () {
        var text = ':a123';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.KEYWORD);
        expect(s.text).to.equal(':a123');
      });

      it('does not allow non-ASCII alphanumeric characters', function () {
        var text = ':aåäö';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.KEYWORD);
        expect(s.text).to.equal(':a');

        var s = lexer.next();
        expect(s.type).to.equal(Token.ERROR);
        expect(s.text).to.contain('Unexpected character');
      });

      it('allows hyphens', function () {
        var text = ':a-b';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.KEYWORD);
        expect(s.text).to.equal(':a-b');
      });

      it('allows underscores', function () {
        var text = 'a_b';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.SYMBOL);
        expect(s.text).to.equal('a_b');
      });

      it('allows stars', function () {
        var text = ':*a*';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.KEYWORD);
        expect(s.text).to.equal(':*a*');
      });

      it('allows question marks', function () {
        var text = ':a?';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.KEYWORD);
        expect(s.text).to.equal(':a?');
      });

    });
  });
});
