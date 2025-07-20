---
id: DesignSummary
title: System Design Summary
sidebar_label: System Design Summary
---

# System Design Principles and Patterns

## Overview

System design involves creating scalable, reliable, and maintainable distributed systems. This summary covers key principles, patterns, and strategies used in modern system architecture.

## Core Design Principles

### 1. **Scalability**
The ability to handle increased load by adding resources to the system.

#### Horizontal Scaling (Scale Out)
- Add more machines to handle increased load
- **Pros**: Cost-effective, fault tolerant, virtually unlimited scaling
- **Cons**: Complex data management, network overhead
- **Examples**: Web servers, microservices, NoSQL databases

#### Vertical Scaling (Scale Up)
- Add more power (CPU, RAM) to existing machines
- **Pros**: Simple to implement, no data distribution complexity
- **Cons**: Expensive, single point of failure, hardware limits
- **Examples**: Database servers, monolithic applications

### 2. **Reliability**
System continues to work correctly even when failures occur.

#### Fault Tolerance Strategies
```
┌─────────────────┐
│ Load Balancer   │
└─────────┬───────┘
          │
    ┌─────┼─────┐
    │     │     │
┌───▼─┐ ┌─▼──┐ ┌▼───┐
│Web 1│ │Web2│ │Web3│
└─────┘ └────┘ └────┘
    │     │     │
    └─────┼─────┘
          │
┌─────────▼────────┐
│   Database       │
│ (Master/Slave)   │
└──────────────────┘
```

#### Redundancy Patterns
- **Active-Active**: Multiple active instances
- **Active-Passive**: Standby instances for failover
- **N+1 Redundancy**: N active + 1 backup

### 3. **Availability**
System remains operational over time (measured in "nines").

| Availability | Downtime per Year | Downtime per Month |
|--------------|-------------------|--------------------|
| 99% | 3.65 days | 7.31 hours |
| 99.9% | 8.77 hours | 43.83 minutes |
| 99.99% | 52.60 minutes | 4.38 minutes |
| 99.999% | 5.26 minutes | 26.30 seconds |

### 4. **Consistency**
All nodes see the same data simultaneously.

#### CAP Theorem
You can only guarantee two of:
- **Consistency**: All nodes have same data
- **Availability**: System remains operational
- **Partition Tolerance**: System continues despite network failures

#### Consistency Models
- **Strong Consistency**: All reads receive the most recent write
- **Eventual Consistency**: System will become consistent over time
- **Weak Consistency**: No guarantees about when data will be consistent

## Key Design Patterns

### 1. **Load Balancing**

#### Types of Load Balancers
```javascript
// Round Robin Load Balancer
class LoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
  }
  
  getServer() {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
}

// Weighted Round Robin
class WeightedLoadBalancer {
  constructor(servers) {
    this.servers = servers; // [{ server: 'server1', weight: 3 }, ...]
    this.currentWeights = servers.map(s => ({ ...s, currentWeight: 0 }));
  }
  
  getServer() {
    let totalWeight = 0;
    let selected = null;
    
    this.currentWeights.forEach(server => {
      server.currentWeight += server.weight;
      totalWeight += server.weight;
      
      if (!selected || server.currentWeight > selected.currentWeight) {
        selected = server;
      }
    });
    
    selected.currentWeight -= totalWeight;
    return selected.server;
  }
}
```

#### Load Balancing Algorithms
- **Round Robin**: Requests distributed sequentially
- **Weighted Round Robin**: Servers get requests based on capacity
- **Least Connections**: Route to server with fewest active connections
- **IP Hash**: Route based on client IP hash
- **Geographic**: Route based on client location

### 2. **Database Design Patterns**

#### Master-Slave Replication
```
┌─────────────┐      ┌─────────────┐
│   Master    │─────▶│   Slave 1   │
│ (Read/Write)│      │ (Read Only) │
└─────────────┘      └─────────────┘
        │
        ▼
┌─────────────┐      ┌─────────────┐
│   Slave 2   │      │   Slave 3   │
│ (Read Only) │      │ (Read Only) │
└─────────────┘      └─────────────┘
```

**Benefits**:
- Read scalability
- Data backup and recovery
- Analytics without affecting main database

**Drawbacks**:
- Write bottleneck on master
- Replication lag
- Increased complexity

#### Database Sharding
```javascript
// Horizontal Sharding Strategy
class DatabaseSharding {
  constructor(shards) {
    this.shards = shards; // Array of database connections
  }
  
  // Hash-based sharding
  getShard(key) {
    const hash = this.hashFunction(key);
    const shardIndex = hash % this.shards.length;
    return this.shards[shardIndex];
  }
  
  // Range-based sharding
  getShardByRange(key) {
    if (key < 1000) return this.shards[0];
    if (key < 2000) return this.shards[1];
    return this.shards[2];
  }
  
  // Directory-based sharding
  getShardByDirectory(key) {
    return this.shardDirectory.get(key);
  }
  
  hashFunction(key) {
    // Simple hash function
    return key.split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);
  }
}
```

**Sharding Strategies**:
- **Hash-based**: Distribute based on hash of key
- **Range-based**: Distribute based on key ranges
- **Directory-based**: Lookup service maps keys to shards

### 3. **Caching Strategies**

#### Cache Patterns
```javascript
// Cache-Aside Pattern
class CacheAside {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async get(key) {
    // Try cache first
    let data = await this.cache.get(key);
    if (data) return data;
    
    // Cache miss - get from database
    data = await this.database.get(key);
    if (data) {
      await this.cache.set(key, data, 3600); // Cache for 1 hour
    }
    return data;
  }
  
  async set(key, value) {
    // Update database
    await this.database.set(key, value);
    // Invalidate cache
    await this.cache.delete(key);
  }
}

// Write-Through Cache
class WriteThrough {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async set(key, value) {
    // Write to both cache and database
    await Promise.all([
      this.cache.set(key, value),
      this.database.set(key, value)
    ]);
  }
  
  async get(key) {
    // Always read from cache
    return await this.cache.get(key);
  }
}

// Write-Behind (Write-Back) Cache
class WriteBehind {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
    this.pendingWrites = new Map();
    this.batchInterval = 5000; // 5 seconds
    
    setInterval(() => this.flushWrites(), this.batchInterval);
  }
  
  async set(key, value) {
    // Write to cache immediately
    await this.cache.set(key, value);
    // Queue database write
    this.pendingWrites.set(key, value);
  }
  
  async flushWrites() {
    if (this.pendingWrites.size === 0) return;
    
    const writes = Array.from(this.pendingWrites.entries());
    this.pendingWrites.clear();
    
    // Batch write to database
    await this.database.batchSet(writes);
  }
}
```

#### Cache Levels
```
Client ─▶ CDN ─▶ Load Balancer ─▶ Web Server ─▶ App Cache ─▶ Database
          │                        │             │
          │                        │             ▼
          │                        │        Redis/Memcached
          │                        ▼
          │                   Local Cache
          ▼
    Browser Cache
```

### 4. **Message Queue Patterns**

#### Publish-Subscribe Pattern
```javascript
class PubSubSystem {
  constructor() {
    this.topics = new Map(); // topic -> Set of subscribers
    this.messageQueue = new Map(); // topic -> Array of messages
  }
  
  subscribe(topic, subscriber) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
      this.messageQueue.set(topic, []);
    }
    this.topics.get(topic).add(subscriber);
  }
  
  publish(topic, message) {
    const subscribers = this.topics.get(topic);
    if (!subscribers) return;
    
    // Immediate delivery
    subscribers.forEach(subscriber => {
      try {
        subscriber.notify(message);
      } catch (error) {
        console.error('Delivery failed:', error);
        // Could implement retry logic here
      }
    });
    
    // Store for durability
    this.messageQueue.get(topic).push({
      message,
      timestamp: Date.now()
    });
  }
  
  unsubscribe(topic, subscriber) {
    const subscribers = this.topics.get(topic);
    if (subscribers) {
      subscribers.delete(subscriber);
    }
  }
}
```

#### Message Queue Use Cases
- **Decoupling**: Services don't need direct connections
- **Reliability**: Messages persist until processed
- **Scalability**: Handle traffic spikes with queues
- **Async Processing**: Long-running tasks don't block responses

## Microservices Architecture

### Service Decomposition Strategies

#### By Business Capability
```
E-commerce System
├── User Service (Authentication, Profiles)
├── Product Service (Catalog, Inventory)
├── Order Service (Cart, Checkout, Orders)
├── Payment Service (Billing, Transactions)
├── Shipping Service (Logistics, Tracking)
└── Notification Service (Email, SMS, Push)
```

#### By Data Ownership
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   User Service  │  │ Product Service │  │  Order Service  │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│   User DB       │  │  Product DB     │  │   Order DB      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Communication Patterns

#### Synchronous Communication
```javascript
// HTTP/REST API calls
class OrderService {
  constructor(userService, productService, paymentService) {
    this.userService = userService;
    this.productService = productService;
    this.paymentService = paymentService;
  }
  
  async createOrder(userId, items) {
    // Synchronous calls to other services
    const user = await this.userService.getUser(userId);
    
    for (const item of items) {
      const product = await this.productService.getProduct(item.productId);
      if (product.stock < item.quantity) {
        throw new Error('Insufficient stock');
      }
    }
    
    const payment = await this.paymentService.processPayment({
      userId,
      amount: this.calculateTotal(items)
    });
    
    return this.saveOrder({ userId, items, paymentId: payment.id });
  }
}
```

#### Asynchronous Communication
```javascript
// Event-driven communication
class OrderService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    
    // Listen for events
    this.eventBus.subscribe('payment.completed', this.handlePaymentCompleted.bind(this));
    this.eventBus.subscribe('inventory.updated', this.handleInventoryUpdated.bind(this));
  }
  
  async createOrder(userId, items) {
    const order = await this.saveOrder({ userId, items, status: 'pending' });
    
    // Publish events for other services
    this.eventBus.publish('order.created', {
      orderId: order.id,
      userId,
      items,
      timestamp: Date.now()
    });
    
    return order;
  }
  
  handlePaymentCompleted(event) {
    this.updateOrderStatus(event.orderId, 'paid');
  }
  
  handleInventoryUpdated(event) {
    // React to inventory changes
    this.checkOrderFulfillment(event.productId);
  }
}
```

## Performance Optimization Strategies

### 1. **Database Optimization**

#### Indexing Strategies
```sql
-- Primary key index (automatic)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP
);

-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_users_status_created ON users(status, created_at);

-- Partial index
CREATE INDEX idx_active_users_email ON users(email) 
WHERE status = 'active';

-- Covering index
CREATE INDEX idx_users_covering ON users(id, email, status) 
INCLUDE (first_name, last_name);
```

#### Query Optimization
```sql
-- Use EXPLAIN to analyze query performance
EXPLAIN ANALYZE 
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id, u.name
ORDER BY order_count DESC
LIMIT 10;

-- Optimize with proper indexing and query structure
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### 2. **Connection Pooling**
```javascript
class ConnectionPool {
  constructor(config) {
    this.config = config;
    this.pool = [];
    this.activeConnections = 0;
    this.waitingQueue = [];
  }
  
  async getConnection() {
    return new Promise((resolve, reject) => {
      if (this.pool.length > 0) {
        resolve(this.pool.pop());
      } else if (this.activeConnections < this.config.maxConnections) {
        this.createConnection().then(resolve).catch(reject);
      } else {
        this.waitingQueue.push({ resolve, reject });
        
        // Timeout for waiting requests
        setTimeout(() => {
          const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            reject(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout);
      }
    });
  }
  
  async createConnection() {
    this.activeConnections++;
    const connection = await this.config.createConnection();
    return connection;
  }
  
  releaseConnection(connection) {
    if (this.waitingQueue.length > 0) {
      const { resolve } = this.waitingQueue.shift();
      resolve(connection);
    } else {
      this.pool.push(connection);
    }
  }
}
```

## Monitoring and Observability

### Three Pillars of Observability

#### 1. **Metrics**
```javascript
class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
  }
  
  incrementCounter(name, value = 1, tags = {}) {
    const key = this.buildKey(name, tags);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }
  
  setGauge(name, value, tags = {}) {
    const key = this.buildKey(name, tags);
    this.gauges.set(key, value);
  }
  
  recordHistogram(name, value, tags = {}) {
    const key = this.buildKey(name, tags);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key).push({ value, timestamp: Date.now() });
  }
  
  buildKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return tagString ? `${name}{${tagString}}` : name;
  }
}

// Usage
const metrics = new MetricsCollector();
metrics.incrementCounter('http_requests_total', 1, { method: 'GET', status: '200' });
metrics.setGauge('memory_usage_bytes', process.memoryUsage().heapUsed);
metrics.recordHistogram('request_duration_ms', responseTime);
```

#### 2. **Logging**
```javascript
class StructuredLogger {
  constructor(service, version) {
    this.service = service;
    this.version = version;
  }
  
  log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      version: this.version,
      requestId: context.requestId,
      userId: context.userId,
      ...context
    };
    
    console.log(JSON.stringify(logEntry));
  }
  
  info(message, context) { this.log('INFO', message, context); }
  warn(message, context) { this.log('WARN', message, context); }
  error(message, context) { this.log('ERROR', message, context); }
}

// Usage
const logger = new StructuredLogger('order-service', '1.0.0');
logger.info('Order created', { 
  orderId: '12345', 
  userId: 'user-123', 
  amount: 99.99,
  requestId: 'req-456'
});
```

#### 3. **Tracing**
```javascript
class DistributedTracing {
  constructor() {
    this.activeSpans = new Map();
  }
  
  startSpan(operationName, parentSpanId = null) {
    const spanId = this.generateSpanId();
    const traceId = parentSpanId ? 
      this.activeSpans.get(parentSpanId).traceId : 
      this.generateTraceId();
    
    const span = {
      spanId,
      traceId,
      operationName,
      parentSpanId,
      startTime: Date.now(),
      tags: {},
      logs: []
    };
    
    this.activeSpans.set(spanId, span);
    return spanId;
  }
  
  finishSpan(spanId, error = null) {
    const span = this.activeSpans.get(spanId);
    if (!span) return;
    
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    
    if (error) {
      span.tags.error = true;
      span.logs.push({
        timestamp: Date.now(),
        level: 'error',
        message: error.message,
        stack: error.stack
      });
    }
    
    this.sendToCollector(span);
    this.activeSpans.delete(spanId);
  }
  
  addTag(spanId, key, value) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }
  
  generateSpanId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  generateTraceId() {
    return Math.random().toString(36).substr(2, 16);
  }
}
```

## Security Considerations

### Authentication and Authorization
```javascript
// JWT-based authentication
class AuthService {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }
  
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    
    return jwt.sign(payload, this.secretKey);
  }
  
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  authorize(requiredRoles) {
    return (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      try {
        const payload = this.verifyToken(token);
        const hasRole = requiredRoles.some(role => payload.roles.includes(role));
        
        if (!hasRole) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        req.user = payload;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Authentication required' });
      }
    };
  }
}
```

### Rate Limiting
```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // clientId -> [timestamps]
  }
  
  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }
    
    const clientRequests = this.requests.get(clientId);
    
    // Remove expired timestamps
    const validRequests = clientRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(clientId, validRequests);
    return true;
  }
}
```

## Conclusion

Effective system design requires understanding and applying these key concepts:

1. **Scalability**: Design for growth with horizontal and vertical scaling strategies
2. **Reliability**: Build fault-tolerant systems with proper redundancy
3. **Performance**: Optimize through caching, database tuning, and efficient algorithms
4. **Security**: Implement proper authentication, authorization, and rate limiting
5. **Observability**: Monitor systems with metrics, logging, and tracing
6. **Consistency**: Balance consistency requirements with availability needs

The choice of patterns and technologies depends on specific requirements like scale, consistency needs, team expertise, and business constraints.
