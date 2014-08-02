module.exports = function equals(a, b) {
  // Has .equals() method.
  if (a && a.equals !== undefined) {
    return a.equals(b);
  }

  return a === b;
};
