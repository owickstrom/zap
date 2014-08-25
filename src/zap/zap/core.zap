;; defs

(def var (macro [symbol] (.resolve *rt symbol)))

(def symbol-with-meta
  (macro [meta symbol]
         (list 'with-meta meta (list 'quote symbol))))

(def
  (symbol-with-meta
    {:doc "Works like defn but creates a macro instead of a function"
     :macro true
     :added "0.1.0"}
    defmacro)
  (macro defmacro
    ([name & exprs]
     (list 'def
           name
           (cons 'macro (cons name exprs))))))

(defmacro fn [& exprs]
  (cons '*fn exprs))

(defmacro when [test & body]
  (list 'if test (cons 'do body)))

(defmacro defn [name bindings body]
  (list 'def
        name
        (list 'fn
              bindings
              body)))

(defn apply
  ([f args] (.apply f nil (zap->js args)))
  ([f obj args] (.apply f obj (zap->js args))))

;; meta and reflection

(defn meta [v] (when v (.-__meta v)))

(defn assoc-meta [k v obj] (with-meta (assoc (meta obj) k v) obj))

(def print-doc
  (fn [meta]
    (:doc meta)))

(defmacro doc [symbol]
  (list 'print-doc
        (list 'meta
              (list 'var
                    symbol))))

(defn constructor [s] (.-constructor s))

(defn constructor-name [s] (.-name (.-constructor s)))

;; strings

(defn string? [v] (= (type-of v) "string"))

(defn to-string [v] (if (string? v) v (+ "" v)))

(defn str
  ([] "")
  ([& strs]
   (+ (first strs) (apply str (rest strs)))))

(defn uppercase [s] (.toUpperCase s))

;; output

(defn println [& args] (apply (.-log js/console) js/console args))

;; convenience functions for Javascript types

(defn length [s] (.-length s))

(defn parse-int [s] (.parseInt js/Number s))

(defn parse-float [s] (.parseFloat js/Number s))
