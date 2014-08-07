var mori = require('mori');

function PropertyGetter(propertyName) {
  this.propertyName = propertyName;
}

PropertyGetter.prototype.toString = function () {
  return '(' + this.propertyName.toString() + ' ...)';
};

PropertyGetter.prototype.apply = function (seq) {
  if (mori.count(seq) === 0) {
    throw new Error('Cannot get property ' + this.propertyName.name + ' on nothing');
  }

  var target = mori.first(seq);
  return target[this.propertyName.name];
};

module.exports = PropertyGetter;
