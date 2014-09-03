var printStackTrace = require('stacktrace-js');

function ZapError(e) {
  Error.call(this, e);
}

ZapError.prototype = Object.create(Error.prototype);

ZapError.prototype.addCall = function (f, file, line, column) {

};

module.exports = ZapError;
