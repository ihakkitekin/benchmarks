package main

import (
	"flag"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"time"
)

func main() {
	url, err := url.Parse(os.Getenv("PROXY_URL"))
	if err != nil {
		panic(err)
	}

	port := flag.Int("p", 8080, "port")
	flag.Parse()

	director := func(req *http.Request) {
		req.URL.Scheme = url.Scheme
		req.URL.Host = url.Host
	}

	tr := &http.Transport{
		IdleConnTimeout: 1500 * time.Millisecond,
	}

	reverseProxy := &httputil.ReverseProxy{Director: director, Transport: tr}
	handler := handler{proxy: reverseProxy}
	http.Handle("/", handler)

	http.ListenAndServe(fmt.Sprintf(":%d", *port), nil)
}

type handler struct {
	proxy *httputil.ReverseProxy
}

func (h handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("x-powered-by", "go")
	h.proxy.ServeHTTP(w, r)
}
