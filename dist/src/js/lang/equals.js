var m = require('mori');

function collectionEquals(a, b) {
  if (m.count(a) !== m.count(b)) {
    return false;
  }

  while (true) {
    var af = m.first(a);
    var bf = m.first(b);

    if (af === null && bf === null) {
      return true;
    }

    var e;
    if (m.is_collection(af)) {
      if (!m.is_collection(bf)) {
        return false;
      }
      e = collectionEquals(af, bf);
    } else {
      e = equals(af, bf);
    }

    if (!e) {
      return false;
    }

    a = m.rest(a);
    b = m.rest(b);
  }
  return true;
}

function equals(a, b) {
  // Has .equals() method.
  if (a && a.equals !== undefined) {
    return a.equals(b);
  }

  // m data structure
  if (m.is_collection(a) && m.is_collection(b)) {
    return collectionEquals(a, b);
  }

  return a === b;
};

module.exports = equals;
