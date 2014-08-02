var Reader = require('./reader.js');
var equals = require('../lang/equals.js');
var List = require('../lang/list.js');

describe('reader', function () {
  describe('Reader', function () {

    it('reads lists', function () {
      var read = Reader.readString('()');
      var list = List.of();

      expect(equals(read, list));
    });

    it('reads nested lists', function () {
      var read = Reader.readString('(() ())');
      var list = List.of(List.of(), List.of());

      expect(equals(read, list));
    });

  });
})
