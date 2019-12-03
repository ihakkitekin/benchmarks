## String Operations
Tests an application for various string operations.

  - Static regexp evaluation
  - Dynamic regexp evaluation

### Requirements
- There must be an endpoint with `/static-regexp` where a pre initialized regexp object used to find negative numbers given in string `0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum`. Should return a string response with each number on a new line.
- There must be an endpoint with `/dynamic-regexp` where dynamically created regexp object used to find negative numbers given in string `0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum`. Should return a string response with each number on a new line.