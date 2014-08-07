var Reader = require('./reader.js');
var equals = require('../lang/equals.js');
var Symbol = require('../lang/symbol.js');
var Keyword = require('../lang/keyword.js');
var PkgName = require('../lang/pkg-name.js');
var m = require('mori');

describe('reader', function () {
  describe('Reader', function () {

    it('reads lists', function () {
      var read = Reader.readString('()');
      var list = m.list();

      expect(equals(read, list)).to.be.true;
    });

    it('reads nested lists', function () {
      var read = Reader.readString('(() ())');
      var list = m.list(m.list(), m.list());

      expect(equals(read, list)).to.be.true;
    });

    it('reads vectors', function () {
      var read = Reader.readString('[]');
      var vector = m.vector();

      expect(equals(read, vector)).to.be.true;
    });

    it('reads nested vectors', function () {
      var read = Reader.readString('[[] []]');
      var vector = m.vector(m.vector(), m.vector());

      expect(equals(read, vector)).to.be.true;
    });

    it('reads maps', function () {
      var read = Reader.readString('{}');
      var vector = m.map({});

      expect(equals(read, vector)).to.be.true;
    });

    it('reads nested maps', function () {
      var read = Reader.readString('{"key" {}}');
      var map = m.hash_map('key', m.hash_map());

      expect(equals(read, map)).to.be.true;
    });

    it('reads maps with keywords', function () {
      var read = Reader.readString('{:key :a}');
      var map = m.hash_map(new Keyword(':key'), new Keyword(':a'));

      expect(equals(read, map)).to.be.true;
    });

    it('reads strings', function () {
      var read = Reader.readString('"hello"');

      expect(equals(read, "hello")).to.be.true;
    });

    it('reads strings with escaped characters', function () {
      var read = Reader.readString('"\\n"');

      expect(equals(read, "\n")).to.be.true;
    });

    it('reads keywords', function () {
      var read = Reader.readString(':hello');
      var keyword = new Keyword(':hello');

      expect(equals(read, keyword)).to.be.true;
    });

    it('reads symbols', function () {
      var read = Reader.readString('hello');
      var symbol = Symbol.withoutPkg('hello');

      expect(equals(read, symbol)).to.be.true;
    });

    it('reads symbols with pkg', function () {
      var read = Reader.readString('pkg1.pkg2/hello');
      var symbol = Symbol.inPkgString('hello', 'pkg1.pkg2');

      expect(equals(read, symbol)).to.be.true;
    });

    it('reads pkg names', function () {
      var read = Reader.readString('pkg1.pkg2');
      var name = PkgName.withSegments('pkg1', 'pkg2');

      expect(equals(read, name)).to.be.true;
    });

    it('throws an error on empty name', function () {
      expect(function () { Reader.readString('pkg1/'); }).throws();
    });

    it('throws an error on unordered pkg names and name', function () {
      expect(function () { Reader.readString('name/pkg1.pkg2'); }).throws();
    });

    it('throws an error on name ending with dot', function () {
      expect(function () { Reader.readString('pkg/name.'); }).throws();
    });

    it('throws an error on pkg name starting with dot', function () {
      expect(function () { Reader.readString('.pkg/name'); }).throws();
    });

    it('throws an error on pkg name ending with dot', function () {
      expect(function () { Reader.readString('pkg./name'); }).throws();
    });

    it('returns a method name if a single name starts with a dot', function () {
      var methodName = Reader.readString('.toString');
      expect(methodName.toString()).to.equal('.toString');
      expect(methodName.name).to.equal('toString');
    });

    it('returns a property name if a single name starts with a dot and hyphen', function () {
      var methodName = Reader.readString('.-length');
      expect(methodName.toString()).to.equal('.-length');
      expect(methodName.name).to.equal('length');
    });

  });
})
