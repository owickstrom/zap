exports.get = function (url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var o = {
          data: xhr.responseText,
          status: xhr.status
        }
        if (xhr.status === 200) {
          return resolve(o);
        } else {
          return reject(o);
        }
      }
    };
    xhr.open('GET', url, true);
    xhr.send(null);
  });
};
