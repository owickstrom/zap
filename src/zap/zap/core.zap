(def uppercase (fn [s] (.toUpperCase s)))

(def length (fn [s] (.-length s)))

(def constructor (fn [s] (.-constructor s)))

(def constructor-name (fn [s] (.-name (.-constructor s))))

(def string? [v] (= (constructor-name v) "String"))

(def to-string [v] (if (string? v) v (+ "" v)))

(def str (fn [a b] (+ (to-string a) (to-string b))))
