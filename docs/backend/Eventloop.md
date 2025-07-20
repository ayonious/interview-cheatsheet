---
id: Eventloop
title: Event Loop
sidebar_label: Event Loop
---

# The Event Loop

## What is the Event Loop?

The **Event Loop** is a programming construct that waits for and dispatches events or messages in a program. It's the core mechanism that enables asynchronous, non-blocking operations in single-threaded environments like JavaScript.

**Reference**: Philip Roberts' excellent explanation at JSConf EU provides one of the best visual demonstrations of how the event loop works.

## Core Components

### 1. **Call Stack**
- Where function calls are stored
- LIFO (Last In, First Out) structure
- Single-threaded execution context
- Where synchronous code runs

### 2. **Web APIs / Node.js APIs**
- Browser: `setTimeout`, `DOM events`, `HTTP requests`
- Node.js: `fs`, `http`, `timers`, `process.nextTick`
- Handle asynchronous operations
- Run outside the main JavaScript thread

### 3. **Callback Queue (Task Queue)**
- Where callbacks from completed async operations wait
- FIFO (First In, First Out) structure
- Includes callbacks from `setTimeout`, `setInterval`, DOM events

### 4. **Microtask Queue**
- Higher priority than callback queue
- Contains Promise callbacks, `queueMicrotask`, `process.nextTick` (Node.js)
- Always processed before callback queue

## How the Event Loop Works

```javascript
// Visual representation of the process
console.log('1'); // → Call Stack

setTimeout(() => {
  console.log('2'); // → Web API → Callback Queue → Call Stack
}, 0);

Promise.resolve().then(() => {
  console.log('3'); // → Microtask Queue → Call Stack
});

console.log('4'); // → Call Stack

// Output: 1, 4, 3, 2
```

## Event Loop Algorithm

1. **Execute all synchronous code** (fill and empty call stack)
2. **Process all microtasks** (Promise callbacks, queueMicrotask)
3. **Process one macrotask** (setTimeout, setInterval, I/O)
4. **Process all microtasks** again (if any were added)
5. **Repeat** from step 3

## Detailed Examples

### Example 1: Basic Event Loop
```javascript
console.log('Start');

setTimeout(() => console.log('Timeout 1'), 0);
setTimeout(() => console.log('Timeout 2'), 0);

Promise.resolve().then(() => console.log('Promise 1'));
Promise.resolve().then(() => console.log('Promise 2'));

console.log('End');

/*
Output:
Start
End
Promise 1
Promise 2
Timeout 1
Timeout 2
*/
```

### Example 2: Nested Promises and Timeouts
```javascript
console.log('Script start');

setTimeout(() => {
  console.log('setTimeout 1');
  Promise.resolve().then(() => console.log('Promise in setTimeout'));
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise 1');
    setTimeout(() => console.log('setTimeout in Promise'), 0);
  })
  .then(() => console.log('Promise 2'));

console.log('Script end');

/*
Output:
Script start
Script end
Promise 1
Promise 2
setTimeout 1
Promise in setTimeout
setTimeout in Promise
*/
```

### Example 3: Event Loop with DOM Events
```javascript
// HTML: <button id="btn">Click me</button>

console.log('Start');

document.getElementById('btn').addEventListener('click', () => {
  console.log('Button clicked');
  
  Promise.resolve().then(() => console.log('Promise after click'));
  
  setTimeout(() => console.log('Timeout after click'), 0);
});

setTimeout(() => console.log('Initial timeout'), 0);

Promise.resolve().then(() => console.log('Initial promise'));

console.log('End');

/*
Before click:
Start
End
Initial promise
Initial timeout

After click:
Button clicked
Promise after click
Timeout after click
*/
```

## Node.js Event Loop

Node.js has a more complex event loop with multiple phases:

### Event Loop Phases

1. **Timers Phase**: `setTimeout` and `setInterval` callbacks
2. **Pending Callbacks**: I/O callbacks deferred to next loop iteration
3. **Idle, Prepare**: Internal use only
4. **Poll Phase**: Fetch new I/O events; execute I/O related callbacks
5. **Check Phase**: `setImmediate` callbacks
6. **Close Callbacks**: Close event callbacks (e.g., `socket.on('close')`)

```javascript
// Node.js specific example
console.log('Start');

// Timers phase
setTimeout(() => console.log('Timer 1'), 0);
setTimeout(() => console.log('Timer 2'), 0);

// Check phase
setImmediate(() => console.log('Immediate 1'));
setImmediate(() => console.log('Immediate 2'));

// Microtasks
process.nextTick(() => console.log('Next Tick 1'));
process.nextTick(() => console.log('Next Tick 2'));

Promise.resolve().then(() => console.log('Promise 1'));

console.log('End');

/*
Output (Node.js):
Start
End
Next Tick 1
Next Tick 2
Promise 1
Timer 1
Timer 2
Immediate 1
Immediate 2
*/
```

### Node.js Microtask Priority
```javascript
// process.nextTick has higher priority than Promise.then
process.nextTick(() => {
  console.log('Next Tick 1');
  process.nextTick(() => console.log('Next Tick 2'));
  Promise.resolve().then(() => console.log('Promise 1'));
});

Promise.resolve().then(() => {
  console.log('Promise 2');
  process.nextTick(() => console.log('Next Tick 3'));
});

/*
Output:
Next Tick 1
Next Tick 2
Promise 2
Next Tick 3
Promise 1
*/
```

## Common Pitfalls and Solutions

### 1. Blocking the Event Loop
```javascript
// ❌ BAD: Blocks the event loop
function heavyComputation() {
  let result = 0;
  for (let i = 0; i < 10000000000; i++) {
    result += i;
  }
  return result;
}

console.log('Start');
heavyComputation(); // This blocks everything
console.log('This will be delayed');

// ✅ GOOD: Break up heavy work
function nonBlockingHeavyComputation(callback) {
  let result = 0;
  let i = 0;
  const chunkSize = 1000000;
  
  function processChunk() {
    const end = Math.min(i + chunkSize, 10000000000);
    
    for (; i < end; i++) {
      result += i;
    }
    
    if (i < 10000000000) {
      setTimeout(processChunk, 0); // Yield control
    } else {
      callback(result);
    }
  }
  
  processChunk();
}

console.log('Start');
nonBlockingHeavyComputation((result) => {
  console.log('Computation complete:', result);
});
console.log('This executes immediately');
```

### 2. Promise vs setTimeout Execution Order
```javascript
// Understanding microtask vs macrotask priority
setTimeout(() => console.log('Timeout'), 0);

Promise.resolve()
  .then(() => console.log('Promise 1'))
  .then(() => console.log('Promise 2'))
  .then(() => {
    setTimeout(() => console.log('Timeout in Promise'), 0);
    return 'done';
  })
  .then(console.log);

/*
Output:
Promise 1
Promise 2
done
Timeout
Timeout in Promise
*/
```

### 3. Event Loop Starvation
```javascript
// ❌ BAD: Microtasks can starve macrotasks
function recursivePromise() {
  Promise.resolve().then(() => {
    console.log('Microtask');
    recursivePromise(); // This prevents setTimeout from running
  });
}

setTimeout(() => console.log('This may never run'), 0);
recursivePromise();

// ✅ GOOD: Allow macrotasks to run
function controlledRecursion(count = 0) {
  if (count < 5) {
    Promise.resolve().then(() => {
      console.log('Microtask', count);
      // Use setTimeout to yield control occasionally
      setTimeout(() => controlledRecursion(count + 1), 0);
    });
  }
}

setTimeout(() => console.log('This will run'), 0);
controlledRecursion();
```

## Browser vs Node.js Differences

### Browser Event Loop
```javascript
// Browser specific APIs
console.log('Start');

// Animation frame (browser only)
requestAnimationFrame(() => console.log('Animation frame'));

// Idle callback (browser only)
requestIdleCallback(() => console.log('Idle callback'));

setTimeout(() => console.log('Timeout'), 0);
Promise.resolve().then(() => console.log('Promise'));

console.log('End');
```

### Node.js Event Loop
```javascript
// Node.js specific features
const fs = require('fs');

console.log('Start');

// File I/O (Node.js)
fs.readFile(__filename, () => {
  console.log('File read complete');
  
  setTimeout(() => console.log('Timeout in I/O'), 0);
  setImmediate(() => console.log('Immediate in I/O'));
  
  process.nextTick(() => console.log('NextTick in I/O'));
});

// Different timing behavior in Node.js
setTimeout(() => console.log('Timeout'), 0);
setImmediate(() => console.log('Immediate'));

console.log('End');
```

## Performance Implications

### 1. Measuring Event Loop Lag
```javascript
// Detect event loop blocking
class EventLoopMonitor {
  constructor() {
    this.start = process.hrtime.bigint();
    this.samples = [];
  }
  
  check() {
    const now = process.hrtime.bigint();
    const lag = Number(now - this.start - 1000000n) / 1000000; // Expected 1ms
    
    this.samples.push(Math.max(0, lag));
    
    if (this.samples.length >= 100) {
      const avgLag = this.samples.reduce((a, b) => a + b) / this.samples.length;
      console.log(`Average event loop lag: ${avgLag.toFixed(2)}ms`);
      this.samples = [];
    }
    
    this.start = process.hrtime.bigint();
    setTimeout(() => this.check(), 1);
  }
  
  start() {
    this.check();
  }
}

const monitor = new EventLoopMonitor();
monitor.start();
```

### 2. Optimizing for Event Loop
```javascript
// ✅ Good: Batch DOM operations
function efficientDOMUpdates(items) {
  const fragment = document.createDocumentFragment();
  
  items.forEach(item => {
    const element = document.createElement('div');
    element.textContent = item;
    fragment.appendChild(element);
  });
  
  document.body.appendChild(fragment); // Single DOM operation
}

// ✅ Good: Use RAF for animations
function smoothAnimation() {
  let start = null;
  
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    
    // Update animation
    element.style.transform = `translateX(${progress / 10}px)`;
    
    if (progress < 1000) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

// ✅ Good: Debounce heavy operations
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const debouncedSearch = debounce((query) => {
  // Heavy search operation
  performSearch(query);
}, 300);
```

## Debugging Event Loop Issues

### 1. Visualizing Execution Order
```javascript
function logWithTimestamp(message) {
  console.log(`${Date.now()} - ${message}`);
}

// Add logging to understand execution order
logWithTimestamp('Script start');

setTimeout(() => logWithTimestamp('Timeout 1'), 0);

Promise.resolve()
  .then(() => logWithTimestamp('Promise 1'))
  .then(() => logWithTimestamp('Promise 2'));

queueMicrotask(() => logWithTimestamp('Microtask'));

logWithTimestamp('Script end');
```

### 2. Using Performance Tools
```javascript
// Browser performance marking
performance.mark('event-loop-start');

setTimeout(() => {
  performance.mark('timeout-executed');
  performance.measure('timeout-delay', 'event-loop-start', 'timeout-executed');
  
  const measure = performance.getEntriesByName('timeout-delay')[0];
  console.log(`Timeout actual delay: ${measure.duration}ms`);
}, 100);

// Node.js performance hooks
const { performance, PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

obs.observe({ entryTypes: ['measure'] });
```

## Best Practices

1. **Don't Block the Event Loop**: Break up heavy computations
2. **Understand Microtask Priority**: Promises run before timeouts
3. **Use Appropriate APIs**: `requestAnimationFrame` for animations, `requestIdleCallback` for low-priority work
4. **Monitor Performance**: Watch for event loop lag in production
5. **Handle Errors Properly**: Unhandled promise rejections can affect the event loop
6. **Test Async Code**: Use proper testing frameworks that understand async execution

## Conclusion

The event loop is fundamental to understanding JavaScript's asynchronous nature. It enables non-blocking I/O operations and responsive user interfaces. Understanding how it works helps developers write more efficient code, debug timing issues, and avoid common pitfalls like blocking the main thread or creating infinite microtask loops.
