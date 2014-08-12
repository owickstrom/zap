(defn get-source [file-name]
  (http.get (str "../working/" file-name)))

(defn get-sources [sources]
  (let [f (first sources)
        r (rest sources)]
    (if (empty? r)
      f
      (+ (get-source (first sources)) (get-sources (rest sources))))))
