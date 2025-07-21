# URL Shortener System Design (like bit.ly)

## Problem Statement
Design a URL shortening service that converts long URLs into shorter, more manageable links with high availability and performance.

## Requirements

### Functional Requirements
- Shorten long URLs to create unique short links
- Redirect short URLs to original long URLs  
- Custom aliases for URLs (optional)
- URL expiration with TTL
- Basic analytics (click count, geographic data)
- User accounts and URL management

### Non-Functional Requirements
- **Availability**: 99.9% uptime
- **Scalability**: 100M URLs shortened per day, 10B redirections
- **Performance**: URL redirection < 100ms
- **Durability**: URLs should not be lost
- **Read/Write Ratio**: 100:1 (heavily read-oriented)

## Capacity Estimation

### Traffic
- **Write Operations**: 100M URLs/day = ~1,160 URLs/second
- **Read Operations**: 10B redirections/day = ~115K redirections/second
- **Peak Load**: 5x average = ~575K redirections/second

### Storage
- **URL Data**: 500 bytes per URL mapping
- **5 Years Storage**: 100M × 365 × 5 × 500 bytes = ~91TB
- **With Metadata**: ~150TB total

### Bandwidth  
- **Incoming**: 1,160 URLs/sec × 500 bytes = ~580KB/sec
- **Outgoing**: 115K redirections/sec × 100 bytes = ~11.5MB/sec

## High-Level Architecture

```
[Load Balancer] → [Web Servers] → [Application Layer] → [Cache Layer] → [Database]
                      ↓
                [Analytics Service]
                      ↓
                [Message Queue]
```

## Core Components

### 1. URL Encoding Service
**Base62 Encoding Strategy**:
- Characters: [a-z, A-Z, 0-9] = 62 characters
- 7-character URL = 62^7 = ~3.5 trillion combinations
- Counter-based approach for uniqueness

### 2. Database Design
**Primary URL Table**:
```sql
CREATE TABLE urls (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(7) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    click_count BIGINT DEFAULT 0,
    INDEX idx_short_code (short_code),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(7),
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(2),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_short_code_time (short_code, clicked_at)
);
```

### 3. Caching Strategy
- **Redis Cluster** for distributed caching
- **Cache-Aside Pattern** for URL lookups
- **LRU Eviction** for memory management
- **Cache TTL**: 24 hours for popular URLs

### 4. Rate Limiting
- **Per-User Limits**: 1000 URLs/day for free users
- **Per-IP Limits**: 100 requests/hour for anonymous users
- **Sliding Window** algorithm implementation

## Detailed Questions & Answers

### Q1: How do you generate unique short URLs?

**Answer**: There are several approaches:

**Approach 1: Counter-Based (Recommended)**
```python
def encode_base62(num):
    chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if num == 0:
        return chars[0]
    
    result = []
    while num > 0:
        result.append(chars[num % 62])
        num //= 62
    
    return ''.join(reversed(result))

# Use auto-increment ID from database
short_code = encode_base62(auto_increment_id)
```

**Approach 2: Hash-Based**
```python
import hashlib

def generate_short_url(original_url, salt=""):
    hash_object = hashlib.md5((original_url + salt).encode())
    return hash_object.hexdigest()[:7]
```

**Approach 3: UUID-Based**
```python
import uuid

def generate_uuid_based():
    return str(uuid.uuid4())[:7]
```

**Trade-offs**:
- **Counter**: Predictable but guaranteed unique, requires centralized counter
- **Hash**: Fast but collision possible, deterministic
- **UUID**: Random but lower collision probability

### Q2: How do you handle high read traffic and ensure low latency?

**Answer**: Multi-layer caching strategy:

**1. Browser Cache**
```http
HTTP/1.1 301 Moved Permanently
Location: https://example.com/very/long/url
Cache-Control: public, max-age=300
```

**2. CDN Layer**
- Cache redirections at edge locations
- Geographic distribution reduces latency
- Handle 80% of requests without reaching origin

**3. Application Cache (Redis)**
```python
import redis

redis_client = redis.Redis(host='redis-cluster')

def get_original_url(short_code):
    # Try cache first
    cached_url = redis_client.get(f"url:{short_code}")
    if cached_url:
        return cached_url.decode('utf-8')
    
    # Fallback to database
    original_url = database.get_url(short_code)
    if original_url:
        # Cache for 24 hours
        redis_client.setex(f"url:{short_code}", 86400, original_url)
    
    return original_url
```

**4. Database Optimization**
- Read replicas for geographic distribution
- Proper indexing on short_code
- Connection pooling

### Q3: How do you handle database scaling as the system grows?

**Answer**: Progressive scaling strategy:

**Phase 1: Vertical Scaling**
- Increase CPU, RAM, and storage
- Optimize queries and add indexes
- Good up to ~1M URLs

**Phase 2: Read Replicas**
```python
class DatabaseRouter:
    def __init__(self):
        self.master = get_master_connection()
        self.replicas = [get_replica_connection(i) for i in range(3)]
    
    def read(self, query):
        replica = random.choice(self.replicas)
        return replica.execute(query)
    
    def write(self, query):
        return self.master.execute(query)
```

**Phase 3: Horizontal Partitioning (Sharding)**
```python
def get_shard_id(short_code):
    return hash(short_code) % NUM_SHARDS

def get_database_shard(short_code):
    shard_id = get_shard_id(short_code)
    return database_connections[shard_id]
```

**Sharding Strategies**:
- **Range-based**: Partition by short_code prefix
- **Hash-based**: Hash short_code to determine shard
- **Directory-based**: Lookup service to find correct shard

### Q4: How do you implement analytics without affecting performance?

**Answer**: Asynchronous analytics processing:

**1. Event-Driven Architecture**
```python
import asyncio
import json
from kafka import KafkaProducer

class AnalyticsCollector:
    def __init__(self):
        self.kafka_producer = KafkaProducer(
            bootstrap_servers=['kafka1:9092', 'kafka2:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
    
    def log_click(self, short_code, request_data):
        event = {
            'short_code': short_code,
            'ip_address': request_data.remote_addr,
            'user_agent': request_data.headers.get('User-Agent'),
            'timestamp': time.time(),
            'country': self.get_country(request_data.remote_addr)
        }
        
        # Non-blocking send
        self.kafka_producer.send('url_clicks', value=event)
```

**2. Batch Processing**
```python
class AnalyticsProcessor:
    def process_clicks_batch(self, events):
        # Batch insert to reduce database load
        click_records = []
        for event in events:
            click_records.append({
                'short_code': event['short_code'],
                'ip_address': event['ip_address'],
                'country': event['country'],
                'clicked_at': datetime.fromtimestamp(event['timestamp'])
            })
        
        # Bulk insert every 1000 records or 30 seconds
        database.bulk_insert('analytics', click_records)
        
        # Update click counts in Redis
        for record in click_records:
            redis_client.incr(f"clicks:{record['short_code']}")
```

**3. Real-time Aggregations**
```python
# Use Redis for real-time counters
def increment_click_count(short_code):
    pipeline = redis_client.pipeline()
    pipeline.incr(f"clicks:total:{short_code}")
    pipeline.incr(f"clicks:daily:{short_code}:{today}")
    pipeline.incr(f"clicks:hourly:{short_code}:{current_hour}")
    pipeline.execute()
```

### Q5: How do you handle URL expiration and cleanup?

**Answer**: Multi-layered expiration strategy:

**1. Application-Level Check**
```python
def get_url_with_expiration_check(short_code):
    url_data = database.get_url(short_code)
    
    if not url_data:
        raise URLNotFound()
    
    if url_data.expires_at and datetime.now() > url_data.expires_at:
        # Mark as expired but don't delete immediately
        database.mark_expired(short_code)
        raise URLExpired()
    
    return url_data.original_url
```

**2. Background Cleanup Service**
```python
class ExpirationCleanupService:
    def __init__(self):
        self.batch_size = 1000
        
    def cleanup_expired_urls(self):
        # Find expired URLs
        expired_urls = database.query("""
            SELECT short_code FROM urls 
            WHERE expires_at < NOW() 
            AND deleted_at IS NULL 
            LIMIT %s
        """, self.batch_size)
        
        for batch in self.chunks(expired_urls, 100):
            # Soft delete - mark as deleted but keep for analytics
            database.soft_delete_batch(batch)
            
            # Remove from cache
            cache_keys = [f"url:{code}" for code in batch]
            redis_client.delete(*cache_keys)
```

**3. Database-Level TTL (for some databases)**
```sql
-- For databases that support TTL
CREATE TABLE temp_urls (
    short_code VARCHAR(7) PRIMARY KEY,
    original_url TEXT,
    expires_at TIMESTAMP,
    TTL expires_at
);
```

### Q6: How do you prevent abuse and implement security measures?

**Answer**: Multi-layered security approach:

**1. Rate Limiting**
```python
class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def is_allowed(self, identifier, limit, window):
        key = f"rate_limit:{identifier}:{window}"
        current = self.redis.get(key) or 0
        
        if int(current) >= limit:
            return False
            
        pipeline = self.redis.pipeline()
        pipeline.incr(key)
        pipeline.expire(key, window)
        pipeline.execute()
        return True
```

**2. URL Validation**
```python
import validators
from urllib.parse import urlparse

def validate_url(url):
    # Basic format validation
    if not validators.url(url):
        raise InvalidURLError("Invalid URL format")
    
    parsed = urlparse(url)
    
    # Block dangerous protocols
    if parsed.scheme not in ['http', 'https']:
        raise InvalidURLError("Only HTTP/HTTPS URLs allowed")
    
    # Block internal/private networks
    if is_internal_ip(parsed.netloc):
        raise InvalidURLError("Cannot shorten internal URLs")
    
    # Check against malicious URL database
    if is_malicious_url(url):
        raise MaliciousURLError("URL flagged as malicious")
```

**3. CAPTCHA for High Volume Users**
```python
def create_short_url(original_url, user_info):
    if user_info.daily_count > 100:  # High volume user
        if not verify_captcha(user_info.captcha_response):
            raise CaptchaRequired("Please complete CAPTCHA")
    
    return generate_short_url(original_url)
```

### Q7: How would you design the system to handle custom aliases?

**Answer**: Enhanced database schema and validation:

**1. Database Schema Update**
```sql
CREATE TABLE urls (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(50) UNIQUE NOT NULL,  -- Increased length
    original_url TEXT NOT NULL,
    user_id BIGINT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE KEY unique_short_code (short_code)
);
```

**2. Custom Alias Validation**
```python
import re

class CustomAliasValidator:
    def __init__(self):
        self.reserved_words = {'api', 'admin', 'www', 'app', 'help'}
        self.pattern = re.compile(r'^[a-zA-Z0-9_-]{3,50}$')
    
    def validate_custom_alias(self, alias):
        if not self.pattern.match(alias):
            raise ValueError("Invalid characters or length")
        
        if alias.lower() in self.reserved_words:
            raise ValueError("Reserved word not allowed")
        
        if self.is_alias_taken(alias):
            raise ValueError("Alias already taken")
        
        return True
    
    def is_alias_taken(self, alias):
        return database.exists('urls', short_code=alias)
```

**3. Priority System**
```python
def create_url_with_alias(original_url, custom_alias=None, user_id=None):
    if custom_alias:
        validator = CustomAliasValidator()
        validator.validate_custom_alias(custom_alias)
        
        return database.create_url(
            short_code=custom_alias,
            original_url=original_url,
            user_id=user_id,
            is_custom=True
        )
    else:
        # Generate automatic short code
        auto_id = database.get_next_id()
        short_code = encode_base62(auto_id)
        
        return database.create_url(
            short_code=short_code,
            original_url=original_url,
            user_id=user_id,
            is_custom=False
        )
```

## Advanced Scenarios

### Scenario 1: Black Friday Traffic Spike
**Challenge**: Handle 10x normal traffic during peak shopping days.

**Solution**:
1. **Auto-scaling**: Implement horizontal pod autoscaling
2. **Circuit Breakers**: Fail fast when database is overwhelmed
3. **Degraded Mode**: Serve cached responses only during extreme load
4. **Queue-based Processing**: Buffer URL creation requests

### Scenario 2: Database Failover
**Challenge**: Primary database goes down during peak hours.

**Solution**:
1. **Health Checks**: Continuous monitoring of database health
2. **Automatic Failover**: Promote read replica to master
3. **Connection Retry Logic**: Exponential backoff for failed connections
4. **Split-brain Prevention**: Use consensus algorithms for leader election

### Scenario 3: Regional Compliance
**Challenge**: Data residency requirements for EU users (GDPR).

**Solution**:
1. **Geographic Sharding**: Route EU users to EU data centers
2. **Data Classification**: Tag URLs with user region
3. **Right to be Forgotten**: Implement complete data deletion APIs
4. **Cross-region Replication**: Backup compliance for disaster recovery

This comprehensive design covers all major aspects of building a scalable URL shortener with detailed solutions to common interview questions and scenarios.