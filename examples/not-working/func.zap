(pkg main)

(defn fst [a _] a)

(defn snd [_ b] b)

(def fstsnd (compose fst snd))
