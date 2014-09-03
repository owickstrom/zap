;; defs

(def var (.setMacro (fn* [symbol] (.resolve *rt symbol))))

(def symbol-with-meta
  (.setMacro (fn* [meta symbol]
                  (list 'with-meta meta (list 'quote symbol)))))

(def
  (symbol-with-meta
    {:doc "Creates a function closure."}
    fn)
  (.setMacro (fn* [& exprs] (cons 'fn* exprs))))

(def
  (symbol-with-meta
    {:doc "Creates a macro."}
    macro)
  (.setMacro (fn [& exprs] (list '.setMacro (cons 'fn exprs)))))

(def
  (symbol-with-meta
    {:doc "Works like defn but creates a macro instead of a function"
     :macro true
     :added "0.1.0"}
    defmacro)
  (macro defmacro
         ([name & exprs]
          (if (= (type-of (first exprs)) "string")
            (list 'def
                  (with-meta {:doc (first exprs)} name)
                  (cons 'macro (cons name (rest exprs))))
            (list 'def
                  name
                  (cons 'macro (cons name exprs)))))))

(defmacro when
  "Evaluates bodies in a `do` if test evaluates to a truthy value."
  [test & bodies] (list 'if test (cons 'do bodies)))

(defmacro defn
  "A short-hand for `(def (fn ...))`."
  ([name & exprs]
   (if (= (type-of (first exprs)) "string")
     (list 'def
           (with-meta {:doc (first exprs)} name)
           (cons 'fn (cons name (rest exprs))))
     (list 'def
           name
           (cons 'fn (cons name exprs))))))

(defmacro throw
  "Returns a rejected ES6 Promise."
  [error] (list 'throw* error))

(defn apply
  "The same as `f.apply(obj, args)` in Javascript."
  ([f args] (.apply f nil (zap->js args)))
  ([f obj args] (.apply f obj (zap->js args))))

;; meta and reflection

(defn meta
  "Returns the metadata for the given value, `nil` if missing."
  [v] (when v (.-__meta v)))

(defn assoc-meta
  "Returns a new value with the key and value associated in the metadata."
  [k v obj] (with-meta (assoc (meta obj) k v) obj))

(defn print-doc
  "Prints the documentation given the metadata map."
  [meta] (:doc meta))

(defmacro doc
  "Returns the documentation for the symbol or nil if missing."
  [symbol] (list 'print-doc
                 (list 'meta
                       (list 'var
                             symbol))))

(defn constructor
  "Returns the constructor function for the given value."
  [s] (.-constructor s))

(defn constructor-name
  "Returns the constructor name for the given value."
  [s] (.-name (.-constructor s)))

;; strings

(defn string?
  "Returns whether the value is a string."
  [v] (= (type-of v) "string"))

(defn to-string
  "Converts the value to a string."
  [v] (if (string? v) v (+ "" v)))

(defn str
  "Concatenates all arguments to a string."
  ([] "")
  ([& strs]
   (+ (first strs) (apply str (rest strs)))))

(defn uppercase
  "Returns the string converted to uppercase."
  [s] (.toUpperCase s))

;; output

(defn println
  "Prints the arguments to the console."
  [& args] (apply (.-log js/console) js/console args))

;; convenience functions for Javascript types

(defn length
  "Returns the length of an Array."
  [s] (.-length s))

(defn parse-int
  "Parses a string as an integer Number."
  [s] (.parseInt js/Number s))

(defn parse-float
  "Parses a string as a float Number."
  [s] (.parseFloat js/Number s))

