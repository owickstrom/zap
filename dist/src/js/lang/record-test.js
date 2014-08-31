var mori = require('mori');
var Record = require('./record.js');
var keyword = require('./keyword.js');
var equals = require('./equals.js');

describe('lang', function () {
  describe('Record', function () {

    var stuff = keyword.fromString(':stuff');
    var things = keyword.fromString(':things');
    var Thing = new Record('Thing', mori.vector(stuff, things));

    it('can be represented as a string', function () {
      expect(Thing.toString()).to.equal('(Thing [:stuff :things])');
    });

    it('creates record instances when applied to values', function () {
      var values = mori.list('some stuff', mori.list(1, 2, 3));
      var instance = Thing.apply(values);

      expect(mori.get(instance, stuff)).to.equal('some stuff');
      expect(mori.count(mori.get(instance, things))).to.equal(3);
    });

    it('throws an error when applied to wrong number of values', function () {
      var values = mori.list('some stuff');
      expect(function () {
        var instance = Thing.apply(values);
      }).throws();
    });

    describe('instances', function () {

      it('equals as a map', function () {
        var one = Thing.apply(mori.list('some stuff', mori.list(1, 2, 3)));
        var another = Thing.apply(mori.list('some stuff', mori.list(1, 2, 3)));

        expect(equals(one, another)).to.be.true;
      });

      it('differs as a map', function () {
        var one = Thing.apply(mori.list('yeah', mori.list(1, 2, 3)));
        var another = Thing.apply(mori.list('some stuff', mori.list(1, 2, 3)));

        expect(equals(one, another)).to.be.false;
      });

    });

  });
});
