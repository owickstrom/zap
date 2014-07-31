;; Flip macro

(defmacro flip [a b] (list b a))

(flip "Flip works!" println)

(when true (println "When works!"))
(when false (println "When doesn't work..."))
