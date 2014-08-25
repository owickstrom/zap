;; defs

(def var (macro [symbol] (.resolve *rt symbol)))

(def symbol-with-meta
  (macro [meta symbol]
         (list (quote with-meta) meta (list (quote quote) symbol))))

(def
  (symbol-with-meta
    {:doc "Works like defn but creates a macro instead of a function"
     :macro true
     :added "0.1.0"}
    defmacro)
  (macro
    ([name & exprs]
     (list (quote def)
           name
           (cons (quote macro) exprs)))))

(defmacro defn [name bindings body]
  (list (quote def)
        name
        (list (quote fn)
              bindings
              body)))

(defn apply
  ([f args] (.apply f nil (zap->js args)))
  ([f obj args] (.apply f obj (zap->js args))))

;; meta and reflection

(defn meta [v] (if v (.-__meta v)))

(defn assoc-meta [k v obj] (with-meta (assoc (meta obj) k v) obj))

(def print-doc
  (fn [meta]
    (:doc meta)))

(defmacro doc [symbol]
  (list (quote print-doc)
        (list (quote meta)
              (list (quote var)
                    symbol))))

(defn constructor [s] (.-constructor s))

(defn constructor-name [s] (.-name (.-constructor s)))

;; strings

(defn string?  [v] (= (type-of v) "string"))

(defn to-string  [v] (if (string? v) v (+ "" v)))

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
