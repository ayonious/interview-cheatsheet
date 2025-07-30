# JavaScript

## Language Fundamentals

### What Kind of Language is JavaScript?

JavaScript is a **multi-paradigm**, **interpreted**, **dynamically-typed** programming language that supports:

- **Functional Programming**: First-class functions, closures, higher-order functions
- **Object-Oriented Programming**: Prototype-based inheritance, classes (ES6+)
- **Procedural Programming**: Sequential execution of statements
- **Event-driven Programming**: Asynchronous event handling

**Key Characteristics:**
- **Interpreted**: No compilation step required
- **Dynamic**: Variables can change types at runtime
- **Weakly typed**: Automatic type coercion
- **Single-threaded**: Uses event loop for concurrency
- **Just-in-time compiled**: Modern engines compile to bytecode

## Is JavaScript an OOP Language?

**Yes, but with unique characteristics:**

### Prototype-based OOP (Traditional)
```javascript
// Constructor function
function Person(name, age) {
    this.name = name;
    this.age = age;
}

// Adding method to prototype
Person.prototype.greet = function() {
    return `Hello, I'm ${this.name}`;
};

const john = new Person("John", 30);
```

### Class-based OOP (ES6+)
```javascript
class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    
    greet() {
        return `Hello, I'm ${this.name}`;
    }
    
    static species() {
        return "Homo sapiens";
    }
}

class Developer extends Person {
    constructor(name, age, language) {
        super(name, age);
        this.language = language;
    }
    
    code() {
        return `${this.name} codes in ${this.language}`;
    }
}
```

**OOP Features Supported:**
- ✅ Encapsulation (closures, private fields with #)
- ✅ Inheritance (prototype chain, extends)
- ✅ Polymorphism (method overriding)
- ⚠️ Abstraction (no native abstract classes, but achievable)

## Module Systems

### CommonJS
**Traditional Node.js module system**

```javascript
// Exporting
// math.js
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;

module.exports = { add, subtract };
// or
exports.add = add;
exports.subtract = subtract;

// Importing
const { add, subtract } = require('./math');
const math = require('./math');
```

**Characteristics:**
- Synchronous loading
- Dynamic imports at runtime
- `require()` function
- `module.exports` / `exports` object

### ES Modules (ESM)
**Modern JavaScript module system**

```javascript
// Exporting
// math.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// Default export
export default function multiply(a, b) {
    return a * b;
}

// Importing
import { add, subtract } from './math.js';
import multiply from './math.js';
import * as math from './math.js';

// Dynamic imports
const math = await import('./math.js');
```

**Characteristics:**
- Static analysis possible
- Tree shaking friendly
- `import`/`export` statements
- Asynchronous loading
- Browser native support

### Key Differences

| Feature | CommonJS | ES Modules |
|---------|----------|------------|
| **Loading** | Synchronous | Asynchronous |
| **Import time** | Runtime | Parse time |
| **Tree shaking** | Limited | Excellent |
| **Browser support** | No (needs bundler) | Native |
| **Top-level await** | No | Yes |
| **Conditional imports** | Easy | Difficult |

## ECMA Standards

### ECMAScript Timeline

**ES5 (2009)**
- `strict mode`
- `JSON` object
- Array methods (`forEach`, `map`, `filter`)
- Object methods (`Object.create`, `Object.defineProperty`)

**ES6/ES2015 (2015)**
- Classes
- Arrow functions
- Template literals
- Destructuring
- Modules (import/export)
- Promises
- `let`/`const`
- Spread operator

**ES2016**
- `Array.prototype.includes()`
- Exponentiation operator (`**`)

**ES2017**
- `async`/`await`
- `Object.entries()`/`Object.values()`
- String padding (`padStart`, `padEnd`)

**ES2018**
- Rest/Spread properties for objects
- Asynchronous iteration
- `Promise.finally()`

**ES2019**
- `Array.prototype.flat()`/`flatMap()`
- `Object.fromEntries()`
- Optional catch binding

**ES2020**
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- `BigInt`
- Dynamic imports

**ES2021**
- Logical assignment operators (`||=`, `&&=`, `??=`)
- `String.prototype.replaceAll()`
- Numeric separators (`1_000_000`)

**ES2022**
- Private class fields (`#private`)
- Top-level await
- `Array.prototype.at()`

## Tree Shaking

### Definition
Tree shaking is a dead code elimination technique that removes unused code from the final bundle.

### How It Works
```javascript
// utils.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b; // Not used
export const divide = (a, b) => a / b;   // Not used

// main.js
import { add, subtract } from './utils.js';

console.log(add(2, 3));
console.log(subtract(5, 2));

// Final bundle only includes add() and subtract()
// multiply() and divide() are "shaken" out
```

### Requirements for Effective Tree Shaking
1. **ES Modules**: Static import/export analysis
2. **Pure functions**: No side effects
3. **Named exports**: Avoid default exports for better granularity
4. **Static imports**: Avoid dynamic imports for tree-shakeable code

### Best Practices
```javascript
// ✅ Good - Named exports
export const utils = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b
};

// ❌ Avoid - Default export of object
export default {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b
};

// ✅ Good - Individual named exports
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
```

## Async/Await

### Evolution from Callbacks to Async/Await

```javascript
// 1. Callbacks (Callback Hell)
getData(function(a) {
    getMoreData(a, function(b) {
        getEvenMoreData(b, function(c) {
            // Nested callbacks
        });
    });
});

// 2. Promises
getData()
    .then(a => getMoreData(a))
    .then(b => getEvenMoreData(b))
    .then(c => {
        // Handle result
    })
    .catch(error => {
        // Handle error
    });

// 3. Async/Await
async function fetchData() {
    try {
        const a = await getData();
        const b = await getMoreData(a);
        const c = await getEvenMoreData(b);
        return c;
    } catch (error) {
        // Handle error
        console.error(error);
    }
}
```

### Benefits
- **Cleaner syntax**: Reads like synchronous code
- **Better error handling**: Try/catch blocks
- **Easier debugging**: Stack traces are clearer
- **Sequential operations**: Natural flow control

### Advanced Patterns
```javascript
// Parallel execution
async function parallelOperations() {
    const [result1, result2, result3] = await Promise.all([
        fetchData1(),
        fetchData2(),
        fetchData3()
    ]);
    return { result1, result2, result3 };
}

// Error handling with multiple operations
async function robustFetch() {
    try {
        const primary = await fetchPrimary();
        return primary;
    } catch (error) {
        console.warn('Primary failed, trying fallback');
        return await fetchFallback();
    }
}
```

## JavaScript vs Java for Backend

### JavaScript Backend Advantages

**1. Single Language Stack**
```javascript
// Same language for frontend and backend
// Shared utilities, validation logic, types
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// Can be used in both browser and Node.js
```

**2. Fast Development Cycle**
- No compilation step
- Hot reloading
- Rapid prototyping
- Dynamic typing flexibility

**3. JSON Native Support**
```javascript
// JavaScript handles JSON naturally
const user = { name: "John", age: 30 };
const jsonString = JSON.stringify(user); // Native
const parsed = JSON.parse(jsonString);   // Native
```

**4. Event-Driven Architecture**
```javascript
// Excellent for I/O intensive applications
const server = http.createServer((req, res) => {
    // Non-blocking I/O
    fs.readFile('data.json', (err, data) => {
        res.end(data);
    });
});
```

**5. NPM Ecosystem**
- Largest package repository
- Active community
- Quick dependency management

### JavaScript Backend Disadvantages

**1. Single-Threaded Limitations**
```javascript
// CPU-intensive tasks block the event loop
function fibonacci(n) {
    if (n < 2) return n;
    return fibonacci(n - 1) + fibonacci(n - 2); // Blocks everything
}

// Solution: Worker threads or clustering
const { Worker } = require('worker_threads');
```

**2. Type Safety**
```javascript
// Runtime errors due to dynamic typing
function calculateArea(length, width) {
    return length * width; // What if length is undefined?
}

calculateArea("5", 3); // Returns "555" instead of 15
```

**3. Memory Management**
- Garbage collection pauses
- Memory leaks in long-running processes
- Less predictable performance

**4. Error Handling Complexity**
```javascript
// Errors can be callbacks, promises, or thrown
fs.readFile('file.txt', (err, data) => {
    if (err) throw err; // Different error patterns
});

await fetch('/api').catch(err => {}); // Promise errors
```

**5. Security Concerns**
- `eval()` and code injection risks
- Prototype pollution
- Dependency vulnerabilities

### Java Backend Advantages Over JavaScript

**1. Strong Type System**
```java
public class User {
    private String name;
    private int age;
    
    // Compile-time type checking
    public void setAge(String age) { // Compiler error
        this.age = age;
    }
}
```

**2. Multi-threading**
```java
// True parallel processing
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(() -> {
    // CPU-intensive task won't block others
});
```

**3. Enterprise Features**
- JVM ecosystem (Kotlin, Scala)
- Mature frameworks (Spring, Hibernate)
- Enterprise integration patterns
- Better tooling and IDEs

**4. Performance**
- JIT compilation optimization
- Better memory management
- Predictable performance characteristics

## Event Loop

### How the Event Loop Works

```javascript
console.log('1'); // Synchronous

setTimeout(() => {
    console.log('2'); // Macro task
}, 0);

Promise.resolve().then(() => {
    console.log('3'); // Micro task
});

console.log('4'); // Synchronous

// Output: 1, 4, 3, 2
```

### Event Loop Components

**1. Call Stack**
- Execution context for functions
- LIFO (Last In, First Out)
- Synchronous operations

**2. Web APIs / Node.js APIs**
- setTimeout, setInterval
- DOM events
- HTTP requests
- File system operations

**3. Callback Queue (Task Queue)**
- **Macro tasks**: setTimeout, setInterval, I/O operations
- **Micro tasks**: Promises, queueMicrotask

**4. Event Loop Process**
```javascript
// Simplified event loop algorithm
while (eventLoop.waitForTask()) {
    // 1. Execute one macro task from queue
    const task = macroTaskQueue.pop();
    execute(task);
    
    // 2. Execute all available micro tasks
    while (microTaskQueue.hasTasks()) {
        const microTask = microTaskQueue.pop();
        execute(microTask);
    }
    
    // 3. Render if needed (in browsers)
    if (needsRendering()) {
        render();
    }
}
```

### Detailed Example
```javascript
console.log('Start'); // 1. Call stack

setTimeout(() => {
    console.log('Timeout 1'); // 5. Macro task
}, 0);

Promise.resolve()
    .then(() => {
        console.log('Promise 1'); // 3. Micro task
        return Promise.resolve();
    })
    .then(() => {
        console.log('Promise 2'); // 4. Micro task
    });

setTimeout(() => {
    console.log('Timeout 2'); // 6. Macro task
}, 0);

console.log('End'); // 2. Call stack

// Output: Start, End, Promise 1, Promise 2, Timeout 1, Timeout 2
```

### Performance Implications
```javascript
// ❌ Blocking the event loop
function blockingOperation() {
    const start = Date.now();
    while (Date.now() - start < 5000) {
        // Blocks for 5 seconds
    }
}

// ✅ Non-blocking alternative
async function nonBlockingOperation() {
    await new Promise(resolve => setTimeout(resolve, 5000));
}

// ✅ Using worker threads for CPU-intensive tasks
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
    const worker = new Worker(__filename);
    worker.postMessage(100000);
    worker.on('message', (result) => {
        console.log('Result:', result);
    });
} else {
    parentPort.on('message', (n) => {
        // CPU-intensive calculation in worker
        const result = fibonacci(n);
        parentPort.postMessage(result);
    });
}
```

## Interview Questions

### Language Fundamentals
1. **Is JavaScript compiled or interpreted?**
   - Traditionally interpreted, but modern engines use JIT compilation

2. **What makes JavaScript a multi-paradigm language?**
   - Supports functional, OOP, procedural, and event-driven programming

### Modules
3. **What's the difference between CommonJS and ES Modules?**
   - CommonJS: synchronous, runtime loading; ESM: static analysis, tree-shaking

4. **When would you use dynamic imports?**
   - Code splitting, conditional loading, lazy loading

### Modern JavaScript
5. **How does tree shaking work and why is it important?**
   - Dead code elimination using static analysis of ES modules

6. **What are the benefits of async/await over Promises?**
   - Cleaner syntax, better error handling, easier debugging

### Performance
7. **How does the event loop handle micro tasks vs macro tasks?**
   - Micro tasks have higher priority and run after each macro task

8. **When would you choose JavaScript over Java for backend development?**
   - I/O intensive applications, rapid development, same language stack