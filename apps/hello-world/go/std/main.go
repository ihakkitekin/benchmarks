package main

import (
	"flag"
	"fmt"
	"net/http"
)

func main() {
	port := flag.Int("p", 8080, "port")
	flag.Parse()

	http.HandleFunc("/hello-world", helloWorld)
	http.HandleFunc("/", notFound)

	http.ListenAndServe(fmt.Sprintf(":%d", *port), nil)
}

func helloWorld(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")
	w.Write([]byte("Hello, world!"))
}

func notFound(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")
	w.WriteHeader(404)
	w.Write([]byte("Not Found."))
}

