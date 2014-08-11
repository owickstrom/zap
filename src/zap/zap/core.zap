(def defmacro
  (macro [name bindings body]
         (list (quote def)
               name
               (list (quote macro)
                     bindings
                     body))))

(def uppercase (fn [s] (.toUpperCase s)))

(def length (fn [s] (.-length s)))

(def constructor (fn [s] (.-constructor s)))

(def constructor-name (fn [s] (.-name (.-constructor s))))

(def string? (fn [v] (= (type-of v) "string")))

(def to-string (fn [v] (if (string? v) v (+ "" v))))

(def str (fn [a b] (+ (to-string a) (to-string b))))

(def meta (fn [v] (.-__meta v)))

(def doc (fn [v] (:doc (meta v))))
