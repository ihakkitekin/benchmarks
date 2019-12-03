## String Operations
Tests an application for various string operations.

  - Static regexp evaluation
  - Dynamic regexp evaluation
  - String replace
  - Regexp replace

### Requirements
- There must be an endpoint with `/static-regexp` where a pre initialized regexp object used to find negative numbers given in string `0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum`. Should return a string response with each number on a new line.
- There must be an endpoint with `/dynamic-regexp` where dynamically created regexp object used to find negative numbers given in string `0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum`. Should return a string response with each number on a new line.
- There must ben an endpoint with `/string-replace` where a previously created string `Current time: $time` is replaced with current time in `Y-m-d H:M:S` format.
- There must ben an endpoint with `/regexp-replace` where a previously created string `Current time: $time` is replaced with current time in `Y-m-d H:M:S` format using a regexp.