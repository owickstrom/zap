var Promise = require('es6-promise').Promise;
var mori = require('mori');

function create(propertyName) {
  var fn = function (target) {
    if (!target) {
      Promise.reject(new Error('Cannot get property ' + propertyName.name + ' on ' + target));
    }

    try {
      return Promise.resolve(target[propertyName.name]);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  fn.toString = function () {
    return '(' + propertyName.toString() + ' ...)';
  };

  return fn;
}

module.exports = {
  create: create
};
