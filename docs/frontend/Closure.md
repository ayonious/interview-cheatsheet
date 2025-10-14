---
id: Closure
title: Closure
sidebar_label: Closure
---

## Basic

What is a closure and how does it look like?
Why is it useful?

A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has finished executing. This happens because the inner function "closes over" the variables it needs.

**Example:**

```javascript
function createCounter() {
  let count = 0;

  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

**Why is it useful?**
- **Data privacy**: The `count` variable is not accessible from outside, only through the returned function
- **State persistence**: The inner function remembers the `count` value between calls

## Related Concepts

### Lexical Scope
Variables are accessible based on where they are defined in the code structure, not where they are called from.

```javascript
function outer() {
  const message = "Hello";

  function inner() {
    console.log(message); // Can access 'message' due to lexical scope
  }

  inner();
}
```

### IIFE (Immediately Invoked Function Expression)
A function that runs as soon as it's defined, often used to create private scope.

```javascript
const result = (function() {
  const privateVar = "I'm private";
  return {
    getPrivateVar: () => privateVar
  };
})();

console.log(result.getPrivateVar()); // "I'm private"
// console.log(privateVar); // Error: privateVar is not defined
```

### Higher-Order Functions
Functions that take other functions as arguments or return functions. Closures are often used with higher-order functions.

```javascript
function multiplier(factor) {
  return function(number) {
    return number * factor;
  };
}

const double = multiplier(2);
const triple = multiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```
