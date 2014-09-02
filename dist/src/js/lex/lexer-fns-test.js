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

    describe('lexName', function () {

      it('emits name tokens', function () {
        var text = 'abc';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal(text);
      });

      it('emits names separated by spaces', function () {
        var text = 'abc def';
        var lexer = new Lexer(text);

        var abc = lexer.next();
        expect(abc.type).to.equal(Token.NAME);
        expect(abc.text).to.equal('abc');

        expect(lexer.next().type).to.equal(Token.WHITESPACE);

        var def = lexer.next();
        expect(def.type).to.equal(Token.NAME);
        expect(def.text).to.equal('def');
      });

      it('does not allow name starting with a digit', function () {
        var text = '1a';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.ERROR);
      });

      it('allows ASCII alphanumeric characters', function () {
        var text = 'a123';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('a123');
      });

      it('does not allow non-ASCII alphanumeric characters', function () {
        var text = 'aåäö';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('a');

        var s = lexer.next();
        expect(s.type).to.equal(Token.ERROR);
        expect(s.text).to.contain('Unexpected character');
      });

      it('allows hyphens', function () {
        var text = 'a-b';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('a-b');
      });

      it('allows underscores', function () {
        var text = 'a_b';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('a_b');
      });

      it('allows stars', function () {
        var text = '*a*';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('*a*');
      });

      it('allows question marks', function () {
        var text = 'a?';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('a?');
      });

      it('allows ampersands', function () {
        var text = '&';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('&');
      });

      it('allows a dot for method names', function () {
        var text = '.toString';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('.toString');
      });

      it('allows a dot and a hyphen for property access', function () {
        var text = '.-length';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('.-length');
      });

      it('allows math function characters', function () {
        var text = '/*-+';
        var lexer = new Lexer(text);

        var s = lexer.next();
        expect(s.type).to.equal(Token.NAME);
        expect(s.text).to.equal('/*-+');
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

        expect(lexer.next().type).to.equal(Token.NAME);
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
        expect(s.type).to.equal(Token.NAME);
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

    describe('lexStringStart', function () {

      it('emits string start token', function () {
        var text = '"';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.STRING_START);
      });

      it('emits string content token', function () {
        var text = '"abc';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.STRING_START);

        var content = lexer.next();
        expect(content.type).to.equal(Token.STRING_CONTENT);
        expect(content.text).to.equal('abc');
      });

      it('emits string end token', function () {
        var text = '"abc"';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.STRING_START);

        var content = lexer.next();
        expect(content.type).to.equal(Token.STRING_CONTENT);
        expect(content.text).to.equal('abc');

        expect(lexer.next().type).to.equal(Token.STRING_END);
      });

      it('supports escaped quotes', function () {
        var text = '"a\\"bc"';
        var lexer = new Lexer(text);

        expect(lexer.next().type).to.equal(Token.STRING_START);

        var content = lexer.next();
        expect(content.type).to.equal(Token.STRING_CONTENT);
        expect(content.text).to.equal('a\\"bc');

        expect(lexer.next().type).to.equal(Token.STRING_END);
      });

    });

    describe('lexNumber', function () {

      it('lexes negative number sign', function () {
        var lexer = new Lexer('-1');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_SIGN_PREFIX);
        expect(t.text).to.equal('-');
      });

      it('lexes positive number sign', function () {
        var lexer = new Lexer('+1');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_SIGN_PREFIX);
        expect(t.text).to.equal('+');
      });

      it('lexes positive number sign as name if not followed by integer', function () {
        var lexer = new Lexer('+ ');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NAME);
        expect(t.text).to.equal('+');
      });

      it('lexes negative number sign as name if not followed by integer', function () {
        var lexer = new Lexer('- ');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NAME);
        expect(t.text).to.equal('-');
      });

      it('lexes integer', function () {
        var lexer = new Lexer('123');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_INTEGER);
        expect(t.text).to.equal('123');
      });

      it('lexes integer with sign prefix', function () {
        var lexer = new Lexer('-123');

        var p = lexer.next();
        expect(p.type).to.equal(Token.NUMBER_SIGN_PREFIX);
        expect(p.text).to.equal('-');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_INTEGER);
        expect(t.text).to.equal('123');
      });

      it('lexes integer with sign prefix', function () {
        var lexer = new Lexer('-123');

        var p = lexer.next();
        expect(p.type).to.equal(Token.NUMBER_SIGN_PREFIX);
        expect(p.text).to.equal('-');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_INTEGER);
        expect(t.text).to.equal('123');
      });

      it('lexes integer and decimals', function () {
        var lexer = new Lexer('123.456');

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_INTEGER);
        expect(t.text).to.equal('123');

        expect(lexer.next().type).to.equal(Token.DOT);

        var d = lexer.next();
        expect(d.type).to.equal(Token.NUMBER_DECIMALS);
        expect(d.text).to.equal('456');
      });

      it('lexes integer in list', function () {
        var lexer = new Lexer('(123)');

        expect(lexer.next().type).to.equal(Token.LEFT_PARENTHESIS);

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_INTEGER);
        expect(t.text).to.equal('123');

        expect(lexer.next().type).to.equal(Token.RIGHT_PARENTHESIS);
      });

      it('lexes integers after plus name in list', function () {
        var lexer = new Lexer('(+ 1 2)');

        expect(lexer.next().type).to.equal(Token.LEFT_PARENTHESIS);

        expect(lexer.next().type).to.equal(Token.NAME);
        expect(lexer.next().type).to.equal(Token.WHITESPACE);

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_INTEGER);
        expect(t.text).to.equal('1');

        expect(lexer.next().type).to.equal(Token.WHITESPACE);

        var t = lexer.next();
        expect(t.type).to.equal(Token.NUMBER_INTEGER);
        expect(t.text).to.equal('2');

        expect(lexer.next().type).to.equal(Token.RIGHT_PARENTHESIS);
      });

    });

  });
});
