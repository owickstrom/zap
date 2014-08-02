var Reader = require('./reader.js');
var equals = require('../lang/equals.js');
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

  });
})
