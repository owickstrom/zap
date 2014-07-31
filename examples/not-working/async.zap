(pkg async
  (:require [zap.http :as http]))

(defn friends-of [user]
  (http.get (str "https://acme.com/api/users/" (:id user) "/friends")))

; Promise-based crazy async stuff.
(defn friends-in-common-of [a b]
  (async
    (let [af (await friends-of-user a)
          bf (await friends-of-user b)]
    (intersection a b))))
