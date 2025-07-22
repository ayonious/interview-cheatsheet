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
```
// Round Robin Load Balancer
CLASS LoadBalancer:
  INITIALIZE:
    servers = list_of_servers
    current_index = 0
  
  FUNCTION get_server():
    server = servers[current_index]
    current_index = (current_index + 1) % LENGTH(servers)
    RETURN server

// Weighted Round Robin
CLASS WeightedLoadBalancer:
  INITIALIZE:
    servers = list_of_servers  // [{server: 'server1', weight: 3}, ...]
    current_weights = MAP servers TO {server, weight, current_weight: 0}
  
  FUNCTION get_server():
    total_weight = 0
    selected = null
    
    FOR EACH server IN current_weights:
      server.current_weight += server.weight
      total_weight += server.weight
      
      IF selected IS NULL OR server.current_weight > selected.current_weight:
        selected = server
    
    selected.current_weight -= total_weight
    RETURN selected.server
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
```
// Horizontal Sharding Strategy
CLASS DatabaseSharding:
  INITIALIZE:
    shards = array_of_database_connections
  
  // Hash-based sharding
  FUNCTION get_shard(key):
    hash = hash_function(key)
    shard_index = hash % LENGTH(shards)
    RETURN shards[shard_index]
  
  // Range-based sharding
  FUNCTION get_shard_by_range(key):
    IF key < 1000: RETURN shards[0]
    IF key < 2000: RETURN shards[1]
    RETURN shards[2]
  
  // Directory-based sharding
  FUNCTION get_shard_by_directory(key):
    RETURN shard_directory.get(key)
  
  FUNCTION hash_function(key):
    // Simple hash function
    hash = 0
    FOR EACH char IN key:
      hash = ((hash << 5) - hash) + ASCII_VALUE(char)
    RETURN hash
```

**Sharding Strategies**:
- **Hash-based**: Distribute based on hash of key
- **Range-based**: Distribute based on key ranges
- **Directory-based**: Lookup service maps keys to shards

### 3. **Caching Strategies**

#### Cache Patterns
```
// Cache-Aside Pattern
CLASS CacheAside:
  INITIALIZE:
    cache = cache_client
    database = database_client
  
  FUNCTION get(key):
    // Try cache first
    data = cache.get(key)
    IF data EXISTS: RETURN data
    
    // Cache miss - get from database
    data = database.get(key)
    IF data EXISTS:
      cache.set(key, data, ttl: 3600)  // Cache for 1 hour
    RETURN data
  
  FUNCTION set(key, value):
    // Update database
    database.set(key, value)
    // Invalidate cache
    cache.delete(key)

// Write-Through Cache
CLASS WriteThrough:
  INITIALIZE:
    cache = cache_client
    database = database_client
  
  FUNCTION set(key, value):
    // Write to both cache and database
    EXECUTE_PARALLEL([
      cache.set(key, value),
      database.set(key, value)
    ])
  
  FUNCTION get(key):
    // Always read from cache
    RETURN cache.get(key)

// Write-Behind (Write-Back) Cache
CLASS WriteBehind:
  INITIALIZE:
    cache = cache_client
    database = database_client
    pending_writes = MAP()
    batch_interval = 5000  // 5 seconds
    
    SCHEDULE_RECURRING(flush_writes, batch_interval)
  
  FUNCTION set(key, value):
    // Write to cache immediately
    cache.set(key, value)
    // Queue database write
    pending_writes.set(key, value)
  
  FUNCTION flush_writes():
    IF SIZE(pending_writes) == 0: RETURN
    
    writes = CONVERT_TO_ARRAY(pending_writes.entries())
    pending_writes.clear()
    
    // Batch write to database
    database.batch_set(writes)
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
```
// HTTP/REST API calls
CLASS OrderService:
  INITIALIZE:
    user_service = UserService()
    product_service = ProductService()
    payment_service = PaymentService()
  
  FUNCTION create_order(user_id, items):
    // Synchronous calls to other services
    user = user_service.get_user(user_id)
    
    FOR EACH item IN items:
      product = product_service.get_product(item.product_id)
      IF product.stock < item.quantity:
        THROW Error('Insufficient stock')
    
    payment = payment_service.process_payment({
      user_id: user_id,
      amount: calculate_total(items)
    })
    
    RETURN save_order({user_id, items, payment_id: payment.id})
```

#### Asynchronous Communication
```
// Event-driven communication
CLASS OrderService:
  INITIALIZE:
    event_bus = EventBus()
    
    // Listen for events
    event_bus.subscribe('payment.completed', handle_payment_completed)
    event_bus.subscribe('inventory.updated', handle_inventory_updated)
  
  FUNCTION create_order(user_id, items):
    order = save_order({user_id, items, status: 'pending'})
    
    // Publish events for other services
    event_bus.publish('order.created', {
      order_id: order.id,
      user_id: user_id,
      items: items,
      timestamp: current_timestamp()
    })
    
    RETURN order
  
  FUNCTION handle_payment_completed(event):
    update_order_status(event.order_id, 'paid')
  
  FUNCTION handle_inventory_updated(event):
    // React to inventory changes
    check_order_fulfillment(event.product_id)
```

## Performance Optimization Strategies

### 1. **Database Optimization**

#### Indexing Strategies
```
// Primary key index (automatic)
TABLE users:
  id: SERIAL (PRIMARY KEY)
  email: STRING(255) (UNIQUE)
  created_at: TIMESTAMP

// Single column index
CREATE INDEX idx_users_email ON users(email)

// Composite index
CREATE INDEX idx_users_status_created ON users(status, created_at)

// Partial index
CREATE INDEX idx_active_users_email ON users(email) 
WHERE status = 'active'

// Covering index
CREATE INDEX idx_users_covering ON users(id, email, status) 
INCLUDE (first_name, last_name)
```

#### Query Optimization
```
// Use EXPLAIN to analyze query performance
EXPLAIN ANALYZE 
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id, u.name
ORDER BY order_count DESC
LIMIT 10

// Optimize with proper indexing and query structure
CREATE INDEX idx_users_created_at ON users(created_at)
CREATE INDEX idx_orders_user_id ON orders(user_id)
```

### 2. **Connection Pooling**
```
CLASS ConnectionPool:
  INITIALIZE:
    config = configuration
    pool = []
    active_connections = 0
    waiting_queue = []
  
  FUNCTION get_connection():
    RETURN NEW PROMISE((resolve, reject) => {
      IF LENGTH(pool) > 0:
        resolve(pool.pop())
      ELSE IF active_connections < config.max_connections:
        create_connection().then(resolve).catch(reject)
      ELSE:
        waiting_queue.push({resolve, reject})
        
        // Timeout for waiting requests
        SET_TIMEOUT(() => {
          index = FIND_INDEX(waiting_queue, item => item.resolve === resolve)
          IF index != -1:
            waiting_queue.splice(index, 1)
            reject(Error('Connection timeout'))
        }, config.connection_timeout)
    })
  
  FUNCTION create_connection():
    active_connections++
    connection = config.create_connection()
    RETURN connection
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
  
  FUNCTION log(level, message, context):
    log_entry = {
      timestamp: current_iso_timestamp(),
      level: level,
      message: message,
      service: service,
      version: version,
      request_id: context.request_id,
      user_id: context.user_id,
      ...context
    }
    
    OUTPUT(to_json(log_entry))
  
  FUNCTION info(message, context): log('INFO', message, context)
  FUNCTION warn(message, context): log('WARN', message, context)
  FUNCTION error(message, context): log('ERROR', message, context)

// Usage
logger = StructuredLogger('order-service', '1.0.0')
logger.info('Order created', {
  order_id: '12345',
  user_id: 'user-123',
  amount: 99.99,
  request_id: 'req-456'
})
```

#### 3. **Tracing**
```
CLASS DistributedTracing:
  INITIALIZE:
    active_spans = MAP()
  
  FUNCTION start_span(operation_name, parent_span_id):
    span_id = generate_span_id()
    trace_id = IF parent_span_id EXISTS ?
      active_spans.get(parent_span_id).trace_id :
      generate_trace_id()
    
    span = {
      span_id: span_id,
      trace_id: trace_id,
      operation_name: operation_name,
      parent_span_id: parent_span_id,
      start_time: current_timestamp(),
      tags: MAP(),
      logs: []
    }
    
    active_spans.set(span_id, span)
    RETURN span_id
  
  FUNCTION finish_span(span_id, error):
    span = active_spans.get(span_id)
    IF span IS NULL: RETURN
    
    span.end_time = current_timestamp()
    span.duration = span.end_time - span.start_time
    
    IF error EXISTS:
      span.tags.error = true
      span.logs.ADD({
        timestamp: current_timestamp(),
        level: 'error',
        message: error.message,
        stack: error.stack
      })
    
    send_to_collector(span)
    active_spans.delete(span_id)
  
  FUNCTION add_tag(span_id, key, value):
    span = active_spans.get(span_id)
    IF span EXISTS:
      span.tags[key] = value
  
  FUNCTION generate_span_id():
    RETURN RANDOM_STRING(9)
  
  FUNCTION generate_trace_id():
    RETURN RANDOM_STRING(16)
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
