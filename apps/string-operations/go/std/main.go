package main

import (
	"flag"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
)

const STATIC_STRING = "0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum";
const STATIC_STRING_TIME = "Current time $time";
var STATIC_REGEXP = regexp.MustCompile("-[1-9]\\d*");
var STATIC_REGEXP_TIME = regexp.MustCompile("\\$time");

func main() {
	port := flag.Int("p", 8080, "port")
	flag.Parse()

	http.HandleFunc("/static-regexp", staticRegexp)
	http.HandleFunc("/dynamic-regexp", dynamicRegexp)
	http.HandleFunc("/string-replace", stringReplace)
	http.HandleFunc("/regexp-replace", regexpReplace)
	http.HandleFunc("/", notFound)

	http.ListenAndServe(fmt.Sprintf(":%d", *port), nil)
}

func staticRegexp(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")

	res := STATIC_REGEXP.FindAllString(STATIC_STRING, -1)

	for _, match := range res {
		w.Write([]byte(match))
		w.Write([]byte("\n"))
	}
}

func dynamicRegexp(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")

	rg := regexp.MustCompile("-[1-9]\\d*")

	res := rg.FindAllString(STATIC_STRING, -1)

	for _, match := range res {
		w.Write([]byte(match))
		w.Write([]byte("\n"))
	}
}

func stringReplace(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")

	dateTime := time.Now()

	result := strings.ReplaceAll(STATIC_STRING_TIME, "$time", dateTime.Format("2006-01-02 15:04:05"))
	w.Write([]byte(result))
}

func regexpReplace(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")

	dateTime := time.Now()

	result := STATIC_REGEXP_TIME.ReplaceAllString(STATIC_STRING_TIME, dateTime.Format("2006-01-02 15:04:05"))
	w.Write([]byte(result))
}

func notFound(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Server", "Go")
	w.WriteHeader(404)
	w.Write([]byte("Not Found."))
}

