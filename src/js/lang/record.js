var mori = require('mori');

function Record(name, fields) {
  this._name = name;
  this._fields = fields;
  this._fieldCount = mori.count(fields);
}

Record.prototype.toString = function () {
  var fields = mori.reduce(function (a, b) { return a + ' ' + b; }, this._fields);
  return '(' + this._name + ' [' +  fields + '])';
};

function createMap(fields, values) {
  if (mori.count(fields) === 0) {
    return mori.hash_map();
  }
  var key = mori.first(fields);
  var value = mori.first(values);

  return mori.assoc(
    createMap(mori.rest(fields), mori.rest(values)),
    key,
    value);
}

Record.prototype.apply = function (seq) {
  if (mori.count(seq) !== this._fieldCount) {
    throw new Error('Wrong number of args passed to ' + this.toString());
  }
  var m = createMap(this._fields, seq);

  return m;
};

module.exports = Record;

