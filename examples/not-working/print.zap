(def what "world")

;; Prints args concatenated
(print "Hello " what "\n")

;; Prints args separated with space and ending with a newline
(println "Hello" what)

;; Prints formatted (as in fmt.Sprintf in Go)
(print (sprintf "Hello %s\n" what))
