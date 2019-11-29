package main

import (
	"flag"
	"fmt"
	"net/http"
)

func main() {
	port := flag.Int("p", 8080, "port")
	flag.Parse()

	http.HandleFunc("/", helloWorld)

	http.ListenAndServe(fmt.Sprintf(":%d", *port), nil)
}

func helloWorld(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")
	w.Write([]byte("Hello, world!"))
}

