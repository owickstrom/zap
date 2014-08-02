var List = require('./list.js');

describe('lang', function () {
  describe('List', function () {

    it('equals another list when all elements are equal', function () {
      var one = List.of(1, 2, 3);
      var another = List.of(1, 2, 3);

      expect(one.equals(another)).to.be.ok;
    });

    it('does not equal another list if any element differs', function () {
      var one = List.of(1, 2, 3);
      var another = List.of(1, 2, 4);

      expect(one.equals(another)).not.to.be.ok;
    });

    it('does not equal if the lengths differ', function () {
      var one = List.of(1, 2, 3);
      var another = List.of(1, 2, 3, 4);

      expect(one.equals(another)).not.to.be.ok;
    });

  });
});
