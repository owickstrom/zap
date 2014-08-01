var Lexer = require('../lexer.js');
var Token = require('../token.js');

describe('lex', function () {
  describe('fns', function () {
    describe('lexWhitespace', function () {

      it('emits whitespace tokens', function () {
        var text = ' \t\n';
        var lexer = new Lexer(text);

        var ws = lexer.next();
        expect(ws.type).to.equal(Token.WHITESPACE);
        expect(ws.text).to.equal(text);
      });

    });
  });
});
