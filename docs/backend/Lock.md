---
id: Lock
title: Locks and Synchronization
sidebar_label: Locks & Synchronization
---

# Locks and Synchronization

## Overview

In concurrent programming, **locks** and **synchronization mechanisms** are essential tools for coordinating access to shared resources among multiple threads or processes. Without proper synchronization, race conditions and data corruption can occur.

## Core Concepts

### 1. **Critical Section**
A part of the program where shared resources are accessed. Only one thread should execute in the critical section at a time.

### 2. **Mutual Exclusion (Mutex)**
A synchronization primitive that ensures only one thread can access a resource at a time.

### 3. **Race Condition**
When the outcome depends on the timing or interleaving of multiple threads' execution.

### 4. **Deadlock**
A situation where two or more threads are blocked forever, waiting for each other.

## Deadlock

### Definition
**Deadlock** occurs when two or more processes wait for each other indefinitely. Process A waits for Process B, while Process B waits for Process A, creating a circular dependency.

### Necessary Conditions for Deadlock

1. **Mutual Exclusion**: Resources cannot be shared
2. **Hold and Wait**: Process holds resources while waiting for others
3. **No Preemption**: Resources cannot be forcibly taken away
4. **Circular Wait**: Circular chain of waiting processes

### Deadlock Example

```javascript
// Simple deadlock scenario
class BankAccount {
  constructor(balance) {
    this.balance = balance;
    this.lock = new Mutex();
  }
  
  async transfer(toAccount, amount) {
    // Always acquire locks in the same order to prevent deadlock
    const firstLock = this.id < toAccount.id ? this : toAccount;
    const secondLock = this.id < toAccount.id ? toAccount : this;
    
    await firstLock.lock.acquire();
    try {
      await secondLock.lock.acquire();
      try {
        if (this.balance >= amount) {
          this.balance -= amount;
          toAccount.balance += amount;
          console.log(`Transferred ${amount} from ${this.id} to ${toAccount.id}`);
        }
      } finally {
        secondLock.lock.release();
      }
    } finally {
      firstLock.lock.release();
    }
  }
}

// Deadlock scenario (BAD)
async function deadlockExample() {
  const account1 = new BankAccount(1000);
  const account2 = new BankAccount(1000);
  
  // These two operations can deadlock
  Promise.all([
    account1.transfer(account2, 100), // Locks account1, then account2
    account2.transfer(account1, 200)  // Locks account2, then account1
  ]);
}
```

### Deadlock Prevention Strategies

#### 1. **Lock Ordering**
```javascript
// Always acquire locks in a consistent order
class DeadlockFreeTransfer {
  static async transfer(fromAccount, toAccount, amount) {
    // Order locks by account ID to prevent circular wait
    const accounts = [fromAccount, toAccount].sort((a, b) => a.id - b.id);
    
    await accounts[0].lock.acquire();
    try {
      await accounts[1].lock.acquire();
      try {
        if (fromAccount.balance >= amount) {
          fromAccount.balance -= amount;
          toAccount.balance += amount;
        }
      } finally {
        accounts[1].lock.release();
      }
    } finally {
      accounts[0].lock.release();
    }
  }
}
```

#### 2. **Timeout-based Locking**
```javascript
class TimeoutLock {
  constructor() {
    this.locked = false;
    this.waitQueue = [];
  }
  
  async acquireWithTimeout(timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Lock acquisition timeout'));
      }, timeoutMs);
      
      const tryAcquire = () => {
        if (!this.locked) {
          this.locked = true;
          clearTimeout(timeout);
          resolve();
        } else {
          this.waitQueue.push(() => {
            clearTimeout(timeout);
            this.locked = true;
            resolve();
          });
        }
      };
      
      tryAcquire();
    });
  }
  
  release() {
    if (this.waitQueue.length > 0) {
      const nextWaiter = this.waitQueue.shift();
      nextWaiter();
    } else {
      this.locked = false;
    }
  }
}
```

#### 3. **Banker's Algorithm**
```javascript
// Deadlock avoidance using resource allocation
class ResourceManager {
  constructor(resources) {
    this.available = [...resources];
    this.allocation = new Map();
    this.max = new Map();
    this.need = new Map();
  }
  
  request(processId, resources) {
    if (!this.isSafeState(processId, resources)) {
      throw new Error('Request would lead to unsafe state');
    }
    
    // Allocate resources
    for (let i = 0; i < resources.length; i++) {
      this.available[i] -= resources[i];
      if (!this.allocation.has(processId)) {
        this.allocation.set(processId, new Array(resources.length).fill(0));
      }
      this.allocation.get(processId)[i] += resources[i];
    }
  }
  
  isSafeState(processId, request) {
    // Simulate allocation and check if system remains in safe state
    const tempAvailable = [...this.available];
    for (let i = 0; i < request.length; i++) {
      tempAvailable[i] -= request[i];
      if (tempAvailable[i] < 0) return false;
    }
    
    // Check if a safe sequence exists
    return this.findSafeSequence(tempAvailable);
  }
  
  findSafeSequence(available) {
    // Implementation of safety algorithm
    // Returns true if safe sequence exists
    return true; // Simplified
  }
}
```

## Race Conditions

### Definition
A **race condition** occurs when the behavior of code depends on the relative timing of events, such as the order in which threads execute.

### Common Race Condition: Counter Increment
```javascript
// ❌ BAD: Race condition
let counter = 0;

async function unsafeIncrement() {
  // This is not atomic - race condition!
  const temp = counter;  // Read
  await new Promise(resolve => setTimeout(resolve, 1)); // Simulate work
  counter = temp + 1;    // Write
}

// Multiple concurrent calls can lead to lost updates
Promise.all([
  unsafeIncrement(),
  unsafeIncrement(),
  unsafeIncrement()
]);
// Counter might be 1 instead of 3!

// ✅ GOOD: Thread-safe increment
class SafeCounter {
  constructor() {
    this.value = 0;
    this.lock = new Mutex();
  }
  
  async increment() {
    await this.lock.acquire();
    try {
      const temp = this.value;
      await new Promise(resolve => setTimeout(resolve, 1));
      this.value = temp + 1;
    } finally {
      this.lock.release();
    }
  }
  
  getValue() {
    return this.value;
  }
}
```

### Optimistic Locking Example
```javascript
// Database-style optimistic locking
class OptimisticRecord {
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this.version = 1;
  }
  
  async update(newData, expectedVersion) {
    // Check if version matches (no concurrent modifications)
    if (this.version !== expectedVersion) {
      throw new Error('OptimisticLockException: Record was modified by another process');
    }
    
    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update data and increment version
    this.data = { ...this.data, ...newData };
    this.version++;
    
    return this.version;
  }
  
  async safeUpdate(newData, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const currentVersion = this.version;
        return await this.update(newData, currentVersion);
      } catch (error) {
        if (error.message.includes('OptimisticLockException') && attempt < maxRetries - 1) {
          // Retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        throw error;
      }
    }
  }
}
```

## Lock Types and Implementations

### 1. **Mutex (Mutual Exclusion)**
```javascript
class Mutex {
  constructor() {
    this.locked = false;
    this.waitQueue = [];
  }
  
  async acquire() {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }
  
  release() {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }
  
  async withLock(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Usage
const mutex = new Mutex();
await mutex.withLock(async () => {
  // Critical section
  console.log('Exclusive access');
});
```

### 2. **Read-Write Lock**
```javascript
class ReadWriteLock {
  constructor() {
    this.readers = 0;
    this.writer = false;
    this.readQueue = [];
    this.writeQueue = [];
  }
  
  async acquireRead() {
    return new Promise(resolve => {
      if (!this.writer && this.writeQueue.length === 0) {
        this.readers++;
        resolve();
      } else {
        this.readQueue.push(resolve);
      }
    });
  }
  
  async acquireWrite() {
    return new Promise(resolve => {
      if (!this.writer && this.readers === 0) {
        this.writer = true;
        resolve();
      } else {
        this.writeQueue.push(resolve);
      }
    });
  }
  
  releaseRead() {
    this.readers--;
    if (this.readers === 0 && this.writeQueue.length > 0) {
      const resolve = this.writeQueue.shift();
      this.writer = true;
      resolve();
    }
  }
  
  releaseWrite() {
    this.writer = false;
    
    // Prioritize waiting writers over readers to prevent writer starvation
    if (this.writeQueue.length > 0) {
      const resolve = this.writeQueue.shift();
      this.writer = true;
      resolve();
    } else {
      // Allow all waiting readers
      while (this.readQueue.length > 0) {
        const resolve = this.readQueue.shift();
        this.readers++;
        resolve();
      }
    }
  }
  
  async withReadLock(fn) {
    await this.acquireRead();
    try {
      return await fn();
    } finally {
      this.releaseRead();
    }
  }
  
  async withWriteLock(fn) {
    await this.acquireWrite();
    try {
      return await fn();
    } finally {
      this.releaseWrite();
    }
  }
}

// Usage
const rwLock = new ReadWriteLock();

// Multiple readers can access simultaneously
await rwLock.withReadLock(async () => {
  console.log('Reading data...');
});

// Writers have exclusive access
await rwLock.withWriteLock(async () => {
  console.log('Writing data...');
});
```

### 3. **Semaphore**
```javascript
class Semaphore {
  constructor(permits) {
    this.permits = permits;
    this.waitQueue = [];
  }
  
  async acquire(permits = 1) {
    return new Promise(resolve => {
      if (this.permits >= permits) {
        this.permits -= permits;
        resolve();
      } else {
        this.waitQueue.push({ permits, resolve });
      }
    });
  }
  
  release(permits = 1) {
    this.permits += permits;
    
    // Try to satisfy waiting requests
    while (this.waitQueue.length > 0 && this.permits >= this.waitQueue[0].permits) {
      const { permits: requestedPermits, resolve } = this.waitQueue.shift();
      this.permits -= requestedPermits;
      resolve();
    }
  }
  
  async withPermits(permits, fn) {
    await this.acquire(permits);
    try {
      return await fn();
    } finally {
      this.release(permits);
    }
  }
}

// Usage: Limit concurrent operations
const connectionPool = new Semaphore(5); // Max 5 concurrent connections

async function databaseOperation() {
  await connectionPool.withPermits(1, async () => {
    console.log('Performing database operation...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
}
```

### 4. **Condition Variables**
```javascript
class ConditionVariable {
  constructor(mutex) {
    this.mutex = mutex;
    this.waitQueue = [];
  }
  
  async wait() {
    return new Promise(resolve => {
      this.waitQueue.push(resolve);
      this.mutex.release(); // Release mutex while waiting
    });
  }
  
  signal() {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      resolve();
    }
  }
  
  signalAll() {
    while (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      resolve();
    }
  }
}

// Producer-Consumer pattern with condition variables
class BoundedBuffer {
  constructor(capacity) {
    this.buffer = [];
    this.capacity = capacity;
    this.mutex = new Mutex();
    this.notFull = new ConditionVariable(this.mutex);
    this.notEmpty = new ConditionVariable(this.mutex);
  }
  
  async put(item) {
    await this.mutex.acquire();
    
    while (this.buffer.length >= this.capacity) {
      await this.notFull.wait();
      await this.mutex.acquire(); // Re-acquire after wait
    }
    
    this.buffer.push(item);
    this.notEmpty.signal();
    this.mutex.release();
  }
  
  async take() {
    await this.mutex.acquire();
    
    while (this.buffer.length === 0) {
      await this.notEmpty.wait();
      await this.mutex.acquire(); // Re-acquire after wait
    }
    
    const item = this.buffer.shift();
    this.notFull.signal();
    this.mutex.release();
    
    return item;
  }
}
```

## Lock-Free Programming

### Atomic Operations
```javascript
// Using atomic operations to avoid locks (conceptual)
class LockFreeCounter {
  constructor() {
    this.value = 0;
  }
  
  // Simulate atomic compare-and-swap
  compareAndSwap(expected, newValue) {
    if (this.value === expected) {
      this.value = newValue;
      return true;
    }
    return false;
  }
  
  increment() {
    let current;
    do {
      current = this.value;
    } while (!this.compareAndSwap(current, current + 1));
    
    return current + 1;
  }
}

// Lock-free stack
class LockFreeStack {
  constructor() {
    this.head = null;
  }
  
  push(data) {
    const newNode = { data, next: null };
    
    do {
      newNode.next = this.head;
    } while (!this.compareAndSwapHead(newNode.next, newNode));
  }
  
  pop() {
    let head;
    
    do {
      head = this.head;
      if (head === null) return null;
    } while (!this.compareAndSwapHead(head, head.next));
    
    return head.data;
  }
  
  compareAndSwapHead(expected, newValue) {
    if (this.head === expected) {
      this.head = newValue;
      return true;
    }
    return false;
  }
}
```

## Performance Considerations

### 1. **Lock Contention**
```javascript
// ❌ BAD: High contention on single lock
class HighContentionCounter {
  constructor() {
    this.value = 0;
    this.lock = new Mutex();
  }
  
  async increment() {
    await this.lock.acquire();
    try {
      this.value++;
    } finally {
      this.lock.release();
    }
  }
}

// ✅ GOOD: Reduce contention with striping
class StripedCounter {
  constructor(stripes = 16) {
    this.stripes = Array.from({ length: stripes }, () => ({
      value: 0,
      lock: new Mutex()
    }));
  }
  
  async increment() {
    const stripe = this.stripes[Math.floor(Math.random() * this.stripes.length)];
    await stripe.lock.acquire();
    try {
      stripe.value++;
    } finally {
      stripe.lock.release();
    }
  }
  
  getTotalValue() {
    return this.stripes.reduce((sum, stripe) => sum + stripe.value, 0);
  }
}
```

### 2. **Lock Granularity**
```javascript
// Fine-grained locking for better concurrency
class BankAccountManager {
  constructor() {
    this.accounts = new Map();
    this.globalLock = new Mutex(); // Only for account creation/deletion
  }
  
  async createAccount(id, initialBalance) {
    await this.globalLock.acquire();
    try {
      if (!this.accounts.has(id)) {
        this.accounts.set(id, {
          balance: initialBalance,
          lock: new Mutex()
        });
      }
    } finally {
      this.globalLock.release();
    }
  }
  
  async transfer(fromId, toId, amount) {
    const fromAccount = this.accounts.get(fromId);
    const toAccount = this.accounts.get(toId);
    
    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }
    
    // Acquire locks in consistent order to prevent deadlock
    const accounts = [fromAccount, toAccount].sort((a, b) => 
      a.id < b.id ? -1 : 1
    );
    
    await accounts[0].lock.acquire();
    try {
      await accounts[1].lock.acquire();
      try {
        if (fromAccount.balance >= amount) {
          fromAccount.balance -= amount;
          toAccount.balance += amount;
          return true;
        }
        return false;
      } finally {
        accounts[1].lock.release();
      }
    } finally {
      accounts[0].lock.release();
    }
  }
}
```

## Best Practices

### 1. **Always Use Try-Finally**
```javascript
// ✅ GOOD: Ensure locks are always released
async function criticalSection(mutex) {
  await mutex.acquire();
  try {
    // Critical section code
    await performCriticalOperation();
  } finally {
    mutex.release(); // Always release, even if exception occurs
  }
}
```

### 2. **Avoid Nested Locks**
```javascript
// ❌ BAD: Nested locks can cause deadlock
async function badNestedLocks(mutex1, mutex2) {
  await mutex1.acquire();
  try {
    await mutex2.acquire(); // Potential deadlock
    try {
      // Work with both resources
    } finally {
      mutex2.release();
    }
  } finally {
    mutex1.release();
  }
}

// ✅ GOOD: Acquire all locks upfront with ordering
async function goodLockAcquisition(locks) {
  // Sort locks to ensure consistent ordering
  const sortedLocks = [...locks].sort((a, b) => a.id - b.id);
  
  for (const lock of sortedLocks) {
    await lock.acquire();
  }
  
  try {
    // Work with all resources
  } finally {
    // Release in reverse order
    for (let i = sortedLocks.length - 1; i >= 0; i--) {
      sortedLocks[i].release();
    }
  }
}
```

### 3. **Use Timeouts**
```javascript
// Prevent indefinite blocking
async function safeOperation(mutex, timeoutMs = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
  });
  
  try {
    await Promise.race([
      mutex.acquire(),
      timeoutPromise
    ]);
    
    try {
      // Critical section
    } finally {
      mutex.release();
    }
  } catch (error) {
    if (error.message === 'Operation timeout') {
      console.warn('Lock acquisition timed out');
    }
    throw error;
  }
}
```

## Debugging Synchronization Issues

### 1. **Deadlock Detection**
```javascript
class DeadlockDetector {
  constructor() {
    this.waitGraph = new Map(); // Process -> waiting for process
    this.locks = new Map();     // Lock -> owner process
  }
  
  requestLock(processId, lockId) {
    const owner = this.locks.get(lockId);
    if (owner && owner !== processId) {
      this.waitGraph.set(processId, owner);
      if (this.hasCycle()) {
        throw new Error(`Deadlock detected: ${processId} waiting for ${owner}`);
      }
    }
  }
  
  acquireLock(processId, lockId) {
    this.locks.set(lockId, processId);
    this.waitGraph.delete(processId);
  }
  
  releaseLock(lockId) {
    this.locks.delete(lockId);
  }
  
  hasCycle() {
    const visited = new Set();
    const recursionStack = new Set();
    
    for (const [node] of this.waitGraph) {
      if (this.hasCycleUtil(node, visited, recursionStack)) {
        return true;
      }
    }
    return false;
  }
  
  hasCycleUtil(node, visited, recursionStack) {
    visited.add(node);
    recursionStack.add(node);
    
    const neighbor = this.waitGraph.get(node);
    if (neighbor) {
      if (!visited.has(neighbor)) {
        if (this.hasCycleUtil(neighbor, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
}
```

### 2. **Performance Monitoring**
```javascript
class LockMonitor {
  constructor() {
    this.stats = new Map();
  }
  
  recordLockAcquisition(lockId, waitTime, holdTime) {
    if (!this.stats.has(lockId)) {
      this.stats.set(lockId, {
        acquisitions: 0,
        totalWaitTime: 0,
        totalHoldTime: 0,
        maxWaitTime: 0,
        maxHoldTime: 0
      });
    }
    
    const stat = this.stats.get(lockId);
    stat.acquisitions++;
    stat.totalWaitTime += waitTime;
    stat.totalHoldTime += holdTime;
    stat.maxWaitTime = Math.max(stat.maxWaitTime, waitTime);
    stat.maxHoldTime = Math.max(stat.maxHoldTime, holdTime);
  }
  
  getReport() {
    const report = [];
    for (const [lockId, stat] of this.stats) {
      report.push({
        lockId,
        acquisitions: stat.acquisitions,
        avgWaitTime: stat.totalWaitTime / stat.acquisitions,
        avgHoldTime: stat.totalHoldTime / stat.acquisitions,
        maxWaitTime: stat.maxWaitTime,
        maxHoldTime: stat.maxHoldTime
      });
    }
    return report.sort((a, b) => b.avgWaitTime - a.avgWaitTime);
  }
}
```

## Conclusion

Understanding locks and synchronization is crucial for building reliable concurrent systems. Key takeaways:

1. **Always prevent deadlocks** through consistent lock ordering and timeouts
2. **Minimize lock contention** with appropriate granularity and lock-free techniques
3. **Handle race conditions** with proper synchronization primitives
4. **Monitor performance** to identify bottlenecks and contention issues
5. **Use the right tool** for the job (mutex, semaphore, read-write lock, etc.)

Proper synchronization ensures data consistency and system reliability in multi-threaded environments.
