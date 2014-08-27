var express = require('express');
var path = require('path');

var app = express();

app.use(function(err, req, res, next){
    console.error(err.stack);
      res.send(500, 'Something broke!');
});

var root = __dirname;

app.use(express.static(root + '/public'));
app.use(express.static(root + '/dist'));

var server = app.listen(process.env.PORT || 3000, function() {
      console.log('Listening on port %d', server.address().port);
});
