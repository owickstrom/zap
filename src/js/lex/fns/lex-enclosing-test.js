var Lexer = require('../lexer.js');
var Token = require('../token.js');

describe('lex', function () {
  describe('fns', function () {
    describe('lexEnclosing', function () {

      it('emits parenthesis', function () {
        var text = '(()())';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.LEFT_PARENTHESIS);
        expect(lexer.next().type).to.equal(Token.LEFT_PARENTHESIS);
        expect(lexer.next().type).to.equal(Token.RIGHT_PARENTHESIS);
        expect(lexer.next().type).to.equal(Token.LEFT_PARENTHESIS);
        expect(lexer.next().type).to.equal(Token.RIGHT_PARENTHESIS);
        expect(lexer.next().type).to.equal(Token.RIGHT_PARENTHESIS);
      });

      it('emits brackets', function () {
        var text = '[[][]]';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.LEFT_BRACKET);
        expect(lexer.next().type).to.equal(Token.LEFT_BRACKET);
        expect(lexer.next().type).to.equal(Token.RIGHT_BRACKET);
        expect(lexer.next().type).to.equal(Token.LEFT_BRACKET);
        expect(lexer.next().type).to.equal(Token.RIGHT_BRACKET);
        expect(lexer.next().type).to.equal(Token.RIGHT_BRACKET);
      });

      it('emits curly brackets', function () {
        var text = '{{}{}}';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.LEFT_CURLY_BRACKET);
        expect(lexer.next().type).to.equal(Token.LEFT_CURLY_BRACKET);
        expect(lexer.next().type).to.equal(Token.RIGHT_CURLY_BRACKET);
        expect(lexer.next().type).to.equal(Token.LEFT_CURLY_BRACKET);
        expect(lexer.next().type).to.equal(Token.RIGHT_CURLY_BRACKET);
        expect(lexer.next().type).to.equal(Token.RIGHT_CURLY_BRACKET);
      });

    });
  });
});
