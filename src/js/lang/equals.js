var m = require('mori');

module.exports = function equals(a, b) {
  // Has .equals() method.
  if (a && a.equals !== undefined) {
    return a.equals(b);
  }

  // Mori data structure
  if (m.is_collection(a) && m.is_collection(b)) {
    return m.equals(a, b);
  }

  return a === b;
};
