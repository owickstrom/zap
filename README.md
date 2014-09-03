# Zap

Zap is a small functional LISP, inspired by Clojure and ClojureScript, that's
built primarily for running in a web browser. Due to the asynchronous nature
of Javascript programming Zap has continuations, using ES6 promises, built right
in at its core.

Zap interprets (reads and evaluates) the Zap code in the browser instead of
compiling to Javascript in a build step. Hopefully this will make it less complex
to set up a REPL connection between the browser and editor.

It should also be possible to run Zap in NodeJS although this is not something
that's tested regularly.

Also note that this is kind of a one man show right now - a small hobby project
spawned from my discomfort with the toolchain consisting of ClojureScript, Clojure,
Leiningen, nrepl, Cider, etc.

If you are interested in contributing to the project, please file bugs or feature
requests as issues here on Github and send pull requests if you have any fixes.

## The Language

Some of the supported stuff right now...

```clojure
;; strings
"hello"

;; basic numbers (extended syntax is planned)
123
345.546
+1
-5.9

;; keywords
:hey
:keywords-are-cool

;; quote
(quote some-symbol)

;; quote reader macro
'some-symbol

;; eval
(eval (quote some-symbol))

;; def
(def my-string "hello")

;; let
(let [string "hello" sub "h"] (contains? string sub))

;; functions
((fn [a] (uppercase a)) "hello")

;; errors and error handling
(throw "Some serious error!")
(try (conquer-the-world) (catch e (println e)))

;; metadata (on data structures, fns, symbols and vars so far...)
(def identity (with-meta {:doc "Returns its argument."} (fn [a] a)))

;; javascript interop
(defn render [] (render-stuff))
(js/requestAnimationFrame render)

;; property access
(def constructor-name (fn [v] (.-name (.-constructor v))))

;; method invocation
(def shout (fn [s] (str (.toUpperCase s) "!")))

;; defining functions
(defn shout [s] (str s "!!!"))

;; macros
(defmacro when
 "This is like an if expression without the else clause."
 [condition body] (list 'if condition (cons 'do body)))

;; async execution (any expression can return a promise)
(let [r (zap.http/get "http://some.url.net")
      title (get-title r)]
  (println "The title is" title))

;; docs for a symbol
(doc defn)
```

## Prerequisites

* Node (install with [nvm](https://github.com/creationix/nvm)).
* [Karma](http://karma-runner.github.io/0.12/index.html) installed globally.

## Build

    # Build zap
    make

## Server with "watch" build

    make watch

## Tests

    karma start
