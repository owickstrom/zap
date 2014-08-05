var Lexer = require('./lex/lexer.js');
var Runtime = require('./runtime/runtime.js');

module.exports = {
  lex: function (code) {

    var lexer = new Lexer(code);
    while (true) {
      var token = lexer.next();

      if (token === null) {
        break;
      }

      console.log(token.type + ': ' + token.text);
    }
  },
  Runtime: Runtime
};
