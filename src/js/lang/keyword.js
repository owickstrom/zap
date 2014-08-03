function Keyword(text) {
  this.text = text;
}

Keyword.prototype.equals = function (other) {
  if (!other) {
    return false;
  }
  return this.text === other.text;
}

Keyword.prototype.toString =  function () {
  return this.text;
};

module.exports = Keyword;
