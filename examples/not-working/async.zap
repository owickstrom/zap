(defn get-sources [& sources]
  (if (empty? sources)
    '()
    (cons (zap.http/get (first sources)) (get-sources (rest sources)))))

(get-sources "http://some.url.com" "http://some.other.url")
