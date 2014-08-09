var mori = require('mori');

function PropertyGetter(propertyName) {
  this.propertyName = propertyName;
}

PropertyGetter.prototype.toString = function () {
  return '(' + this.propertyName.toString() + ' ...)';
};

PropertyGetter.prototype.apply = function (seq) {
  if (mori.count(seq) === 0) {
    Promise.reject(new Error('Cannot get property ' + this.propertyName.name + ' on nothing'));
  }

  try {
    var target = mori.first(seq);
    return Promise.resolve(target[this.propertyName.name]);
  } catch (e) {
    return Promise.reject(e);
  }
};

module.exports = PropertyGetter;
