(def a "hi")

(def b
  (let [a "hello" b "world" msg (sprintf "%s %s" a b)]
    msg))

(println a b)
