var repl = new CodeMirrorREPL('repl', {
  mode: 'text/x-common-lisp',
  theme: 'tomorrow-night-eighties'
});

// Hacks to fix theming.
$('.CodeMirror').addClass('cm-s-tomorrow-night-eighties');
$('.CodeMirror-gutter').addClass('CodeMirror-gutters');

var loader = new zap.BrowserLoader('../src/zap');
var rt = new zap.Runtime(loader);

function printError(err) {
  console.error(err.message, err.stack);
  if (err instanceof Error) {
    repl.print( err.stack, 'error');
  } else {
    repl.print(JSON.stringify(err), 'error');
  }
}

rt.start().then(function () {
  repl.print(';; Welcome to the Zap REPL. To get up and running, go to "Help".', 'message');

  repl.eval = function (code) {
    rt.loadString(code).then(function (result) {
      repl.print(zap.printString(result), 'result');
    }, printError);
  };
}, printError);
