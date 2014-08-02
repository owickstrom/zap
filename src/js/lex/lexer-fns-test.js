var Lexer = require('./lexer.js');
var Token = require('./token.js');

describe('lex', function () {
  describe('lexerFns', function () {

    describe('lexWhitespace', function () {

      it('emits whitespace tokens', function () {
        var text = ' \t\n';
        var lexer = new Lexer(text);

        var ws = lexer.next();
        expect(ws.type).to.equal(Token.WHITESPACE);
        expect(ws.text).to.equal(text);
      });

    });

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

    describe('lexSingle', function () {

      it('emits one token per character', function () {
        var text = './/.';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.DOT);
        expect(lexer.next().type).to.equal(Token.SLASH);
        expect(lexer.next().type).to.equal(Token.SLASH);
        expect(lexer.next().type).to.equal(Token.DOT);
      });

    });

    describe('lexCommentStart', function () {

      it('emits comment start token', function () {
        var text = ';';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.COMMENT_START);
      });

      it('emits comment start token with all semicolons', function () {
        var text = ';;;';
        var lexer = new Lexer(text);

        var cs = lexer.next();
        expect(cs.type).to.equal(Token.COMMENT_START);
        expect(cs.text).to.equal(';;;');
      });

      it('emits comment content until EOF', function () {
        var text = ';;; hello';
        var lexer = new Lexer(text);

        var cs = lexer.next();
        expect(cs.type).to.equal(Token.COMMENT_START);
        expect(cs.text).to.equal(';;;');

        var cs = lexer.next();
        expect(cs.type).to.equal(Token.COMMENT_CONTENT);
        expect(cs.text).to.equal(' hello');

        var eof = lexer.next();
        expect(eof.type).to.equal(Token.EOF);
      });

      it('emits comment content until newline', function () {
        var text = ';;; hello\n';
        var lexer = new Lexer(text);

        var cs = lexer.next();
        expect(cs.type).to.equal(Token.COMMENT_START);
        expect(cs.text).to.equal(';;;');

        var cs = lexer.next();
        expect(cs.type).to.equal(Token.COMMENT_CONTENT);
        expect(cs.text).to.equal(' hello');

        var eof = lexer.next();
        expect(eof.type).to.equal(Token.WHITESPACE);

        var eof = lexer.next();
        expect(eof.type).to.equal(Token.EOF);
      });

    });

  });
});
