var repl = new CodeMirrorREPL('repl', {
  mode: 'text/x-common-lisp',
  theme: 'tomorrow-night-eighties'
});

// Hacks to fix theming.
$('.CodeMirror').addClass('cm-s-tomorrow-night-eighties');
$('.CodeMirror-gutter').addClass('CodeMirror-gutters');

var loader = new zap.BrowserLoader('../../src/zap');
var rt = new zap.Runtime(loader);

rt.start().then(function () {
  repl.print(';; welcome to zap!', 'message');

  repl.eval = function (code) {
    rt.loadString(code).then(function (result) {
      repl.print(zap.printString(result), 'result');
    }, function (err) {
      repl.print(err, 'error');
    });
  };
});