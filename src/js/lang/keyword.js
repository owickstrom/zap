function Keyword(text) {
  if (text && text.length > 0 && text[0] === ':') {
    this.text = text;
  } else {
    throw new Error('Invalid keyword: "' + text + '"');
  }
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
