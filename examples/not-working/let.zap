(def a "hi")

(def b
  (let [a "hello" b "world" msg (str a b)]
    msg))

(println a b)
