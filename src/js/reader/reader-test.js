var Reader = require('./reader.js');
var equals = require('../lang/equals.js');
var Immutable = require('immutable');

describe('reader', function () {
  describe('Reader', function () {

    it('reads lists', function () {
      var read = Reader.readString('()');
      var list = Immutable.Sequence();

      expect(equals(read, list));
    });

    it('reads nested lists', function () {
      var read = Reader.readString('(() ())');
      var list = Immutable.Sequence(Immutable.Sequence(), Immutable.Sequence());

      expect(equals(read, list));
    });

  });
})
