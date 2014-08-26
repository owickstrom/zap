# Zap

## The Language

Some of the supported stuff right now...

```clojure
;; quote
(quote some-symbol)

;; eval
(eval (quote some-symbol))

;; def
(def my-string "hello")

;; let
(let [string "hello" sub "h"] (contains? string sub))

;; functions
((fn [a] (uppercase a)) "hello")

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

## Tests

    karma start



