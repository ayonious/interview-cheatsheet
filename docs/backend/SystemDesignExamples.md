# System Design Examples for Practice

This document provides practical system design examples that software engineers can use to practice and improve their system design skills. Each example includes the problem statement, key requirements, and architectural considerations.

## Example 1: URL Shortener (like bit.ly)

### Problem Statement
Design a URL shortening service that converts long URLs into shorter, more manageable links.

### Functional Requirements
- Shorten long URLs to create unique short links
- Redirect short URLs to original long URLs
- Custom aliases for URLs (optional)
- URL expiration (optional)
- Analytics (click count, geographic data)

### Non-Functional Requirements
- **Availability**: 99.9% uptime
- **Scalability**: 100M URLs shortened per day
- **Performance**: URL redirection < 100ms
- **Durability**: URLs should not be lost

### Key Components
1. **URL Encoding Service**: Generate short URLs using base62 encoding
2. **Database**: Store URL mappings (SQL for ACID properties)
3. **Cache Layer**: Redis for frequently accessed URLs
4. **Load Balancer**: Distribute traffic across multiple servers
5. **Analytics Service**: Track click metrics

### Architecture Considerations
- **Database Schema**: 
  ```sql
  CREATE TABLE urls (
    id BIGINT PRIMARY KEY,
    short_url VARCHAR(7),
    long_url TEXT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    click_count INT DEFAULT 0
  );
  ```
- **Encoding Strategy**: Use base62 (a-z, A-Z, 0-9) for 7-character URLs
- **Caching Strategy**: Cache popular URLs with LRU eviction
- **Rate Limiting**: Prevent abuse with user-based limits

### Scale Estimation
- 100M URLs/day = ~1,160 URLs/second
- 100:1 read/write ratio = 116K redirections/second
- Storage: ~500GB for 100B URLs over 5 years
- Bandwidth: ~58KB/s for writes, 5.8MB/s for reads

## Example 2: Chat Application (like WhatsApp)

### Problem Statement
Design a real-time messaging system that supports one-on-one and group conversations with message delivery guarantees.

### Functional Requirements
- Send and receive messages in real-time
- One-on-one and group messaging
- Message delivery status (sent, delivered, read)
- Online/offline status
- Message history
- File and media sharing

### Non-Functional Requirements
- **Availability**: 99.99% uptime
- **Scalability**: 1B users, 100B messages/day
- **Performance**: Message delivery < 100ms
- **Consistency**: Messages must be delivered in order

### Key Components
1. **Message Service**: Handle message creation and routing
2. **Connection Manager**: Manage WebSocket connections
3. **Notification Service**: Push notifications for offline users
4. **User Service**: Handle authentication and user management
5. **Media Service**: Handle file uploads and storage

### Architecture Considerations
- **Real-time Communication**: WebSockets for persistent connections
- **Message Storage**: 
  ```sql
  CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID,
    sender_id UUID,
    content TEXT,
    message_type ENUM('text', 'image', 'file'),
    created_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
  );
  ```
- **Message Delivery**: Use message queues (Apache Kafka) for reliable delivery
- **Data Partitioning**: Shard by conversation_id for horizontal scaling
- **Presence Service**: Redis for real-time online/offline status

### Technical Challenges
1. **Message Ordering**: Use vector clocks or logical timestamps
2. **Offline Message Delivery**: Store messages in queue until user comes online
3. **Group Message Fanout**: Efficiently deliver to all group members
4. **End-to-End Encryption**: Implement signal protocol for security

### Scale Estimation
- 1B users, 50% daily active = 500M daily active users
- 100B messages/day = ~1.16M messages/second
- Storage: ~10TB/day for messages
- Connection management: 500M concurrent WebSocket connections

## Practice Tips

### When Practicing These Examples:
1. **Start with Requirements**: Always clarify functional and non-functional requirements
2. **Estimate Scale**: Calculate read/write ratios, storage needs, and bandwidth
3. **Design High-Level Architecture**: Identify main components and their interactions
4. **Deep Dive into Components**: Design database schemas, APIs, and algorithms
5. **Address Bottlenecks**: Identify and solve potential performance issues
6. **Consider Trade-offs**: Discuss consistency vs availability, cost vs performance

### Common System Design Patterns:
- **Load Balancing**: Distribute traffic across multiple servers
- **Caching**: Improve performance with Redis/Memcached
- **Database Sharding**: Horizontal partitioning for scale
- **Message Queues**: Asynchronous processing and reliability
- **CDN**: Global content distribution
- **Microservices**: Service decomposition for maintainability

### Additional Practice Examples:
- Design Instagram (photo sharing with feeds)
- Design Netflix (video streaming platform)
- Design Uber (ride-sharing service)
- Design Twitter (social media with timeline)
- Design Dropbox (file storage and synchronization)