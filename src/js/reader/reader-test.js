var Reader = require('./reader.js');
var equals = require('../lang/equals.js');
var Keyword = require('../lang/keyword.js');
var m = require('mori');

describe('reader', function () {
  describe('Reader', function () {

    it('reads lists', function () {
      var read = Reader.readString('()');
      var list = m.list();

      expect(equals(read, list));
    });

    it('reads nested lists', function () {
      var read = Reader.readString('(() ())');
      var list = m.list(m.list(), m.list());

      expect(equals(read, list));
    });

    it('reads vectors', function () {
      var read = Reader.readString('[]');
      var vector = m.vector();

      expect(equals(read, vector));
    });

    it('reads nested vectors', function () {
      var read = Reader.readString('[[] []]');
      var vector = m.vector(m.vector(), m.vector());

      expect(equals(read, vector));
    });

    it('reads maps', function () {
      var read = Reader.readString('{}');
      var vector = m.map({});

      expect(equals(read, vector));
    });

    it('reads nested maps', function () {
      var read = Reader.readString('{"key" {}}');
      var vector = m.map({'key': {}});

      expect(equals(read, vector));
    });

    it('reads strings', function () {
      var read = Reader.readString('"hello"');

      expect(equals(read, "hello"));
    });

    it('reads strings with escaped characters', function () {
      var read = Reader.readString('"\\n"');

      expect(equals(read, "\n"));
    });

    it('reads keywords', function () {
      var read = Reader.readString(':hello');
      var keyword = new Keyword(':hello');

      expect(equals(read, keyword));
    });

  });
})
