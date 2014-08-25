;; defs

(def defmacro
  (macro
    [name bindings body]
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

(defn apply
  ([f args] (.apply f nil (zap->js args)))
  ([f obj args] (.apply f obj (zap->js args))))

;; meta and reflection

(defn meta [v] (if v (.-__meta v)))

(defn doc [v] (:doc (meta v)))

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
