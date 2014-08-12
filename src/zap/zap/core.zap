(def defmacro
  (macro [name bindings body]
         (list (quote def)
               name
               (list (quote macro)
                     bindings
                     body))))

(defmacro defn [name bindings body]
  (list (quote def)
        name
        (list (quote fn)
              bindings
              body)))

(defn uppercase [s] (.toUpperCase s))

(defn length [s] (.-length s))

(defn string?  [v] (= (type-of v) "string"))

(defn to-string  [v] (if (string? v) v (+ "" v)))

;; TODO: Fix arity
(defn str [a b] (+ (to-string a) (to-string b)))

(defn meta [v] (if v (.-__meta v)))

(defn doc [v] (:doc (meta v)))

(defn constructor [s] (.-constructor s))

(defn constructor-name [s] (.-name (.-constructor s)))

