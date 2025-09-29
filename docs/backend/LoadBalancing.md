# Load Balancing

## What is Load Balancing?

Load balancing is the process of distributing network traffic across multiple servers to ensure no single server becomes overwhelmed. It improves application availability, reliability, and scalability by efficiently distributing incoming requests.

## Why Load Balancing?

### Problems It Solves:
- **Single Point of Failure**: Eliminates dependency on one server
- **Performance Bottlenecks**: Prevents server overload
- **Scalability Issues**: Enables horizontal scaling
- **Maintenance Downtime**: Allows rolling updates without service interruption
- **Geographic Latency**: Routes users to nearest servers

### Benefits:
- High availability (HA)
- Improved performance
- Scalability and flexibility
- Redundancy and fault tolerance
- Efficient resource utilization

## Types of Load Balancers

### 1. Hardware Load Balancers
- Physical devices (F5 BIG-IP, Citrix ADC)
- High performance but expensive
- Dedicated processing power
- Often used in enterprise data centers

### 2. Software Load Balancers
- **Open Source**: HAProxy, NGINX, Apache mod_proxy
- **Commercial**: NGINX Plus, Avi Networks
- More flexible and cost-effective
- Easy to deploy and update

### 3. Cloud Load Balancers
- **AWS**: ELB (Classic, Application, Network, Gateway)
- **Google Cloud**: Cloud Load Balancing
- **Azure**: Azure Load Balancer, Application Gateway
- Managed services with auto-scaling
- Pay-per-use pricing model

## Load Balancing Algorithms

### 1. Round Robin
```
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A (cycle repeats)
```
- Simple and predictable
- Works well with servers of equal capacity
- Doesn't consider server load

### 2. Weighted Round Robin
```
Server A (weight: 3) gets 3 requests
Server B (weight: 2) gets 2 requests
Server C (weight: 1) gets 1 request
```
- Accounts for different server capacities
- Manual weight configuration required

### 3. Least Connections
- Routes to server with fewest active connections
- Better for long-lived connections
- Good for varied request processing times

### 4. Weighted Least Connections
- Combines least connections with server weights
- Considers both capacity and current load

### 5. IP Hash (Source IP Affinity)
```python
server_index = hash(client_ip) % num_servers
```
- Same client always goes to same server
- Useful for session persistence
- Can cause uneven distribution

### 6. Least Response Time
- Routes to fastest-responding server
- Considers both active connections and response time
- Optimal for performance

### 7. Random
- Randomly selects a server
- Simple but unpredictable
- Can work well with large server pools

### 8. Resource-Based
- Monitors CPU, memory, bandwidth
- Routes based on available resources
- Requires health monitoring agents

## OSI Layer Classification

### Layer 4 (Transport Layer) Load Balancing
- **Works with**: IP addresses and ports
- **Protocols**: TCP/UDP
- **Speed**: Faster, less CPU intensive
- **Features**: Basic load distribution
- **Cannot inspect**: Application data

Example configuration:
```nginx
upstream backend {
    server 10.0.1.1:8080;
    server 10.0.1.2:8080;
}
```

### Layer 7 (Application Layer) Load Balancing
- **Works with**: HTTP headers, URLs, cookies
- **Protocols**: HTTP/HTTPS, WebSocket
- **Speed**: Slower, more CPU intensive
- **Features**: Content-based routing, SSL termination
- **Can inspect**: Application data

Example configuration:
```nginx
location /api {
    proxy_pass http://api-servers;
}
location /images {
    proxy_pass http://static-servers;
}
```

## Session Persistence (Sticky Sessions)

### Methods:
1. **Cookie-Based**: LB inserts session cookie
2. **IP-Based**: Client IP determines server
3. **Application Cookie**: Uses existing app cookie
4. **SSL Session ID**: Uses SSL session for persistence

### Pros and Cons:
- ✅ Maintains user session state
- ✅ Simplifies application design
- ❌ Uneven load distribution
- ❌ Complications with server failures
- ❌ Limits horizontal scaling benefits

## Health Checks

### Active Health Checks
```yaml
health_check:
  interval: 10s
  timeout: 3s
  unhealthy_threshold: 3
  healthy_threshold: 2
  path: /health
  expected_status: 200
```

### Passive Health Checks
- Monitors real traffic responses
- Marks servers down based on error rates
- No additional health check traffic

### Health Check Types:
1. **TCP Check**: Port connectivity
2. **HTTP/HTTPS Check**: Response code validation
3. **Custom Script**: Application-specific checks
4. **Database Check**: Backend connectivity

## Load Balancer Deployment Patterns

### 1. Single Load Balancer
```
Internet → LB → [Server1, Server2, Server3]
```
- Simple but single point of failure

### 2. Active-Passive HA
```
Internet → Active LB (Primary)
        ↘ Passive LB (Standby) → [Servers]
```
- Failover capability
- Resource underutilization

### 3. Active-Active HA
```
Internet → DNS Round Robin
        ↙         ↘
    LB1            LB2
        ↘         ↙
    [Server Pool]
```
- No single point of failure
- Better resource utilization

### 4. Global Server Load Balancing (GSLB)
```
User → DNS → Nearest Data Center
           ↙     ↓     ↘
         US-East  EU  Asia-Pacific
```
- Geographic distribution
- Disaster recovery
- Reduced latency

## Advanced Features

### SSL/TLS Termination
- Decrypt HTTPS at load balancer
- Reduces backend server CPU load
- Centralized certificate management
- Internal traffic can use HTTP

### Connection Multiplexing
- Reuses backend connections
- Reduces connection overhead
- Improves performance

### Request Routing
```nginx
# Content-based routing
location ~ \.(jpg|png|gif)$ {
    proxy_pass http://static-servers;
}

# Header-based routing
if ($http_user_agent ~* mobile) {
    proxy_pass http://mobile-servers;
}
```

### Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api {
    limit_req zone=api burst=20;
}
```

### Caching
- Static content caching
- API response caching
- Reduces backend load

## Popular Load Balancing Solutions

### Open Source
1. **HAProxy**
   - High performance
   - Layer 4 and 7
   - Active health checks

2. **NGINX**
   - Web server and load balancer
   - Layer 7 focused
   - Rich feature set

3. **Traefik**
   - Cloud-native
   - Auto-discovery
   - Let's Encrypt integration

### Cloud Services
1. **AWS ELB Types**:
   - **CLB**: Classic (legacy)
   - **ALB**: Application (Layer 7)
   - **NLB**: Network (Layer 4)
   - **GLB**: Gateway (Layer 3)

2. **Google Cloud Load Balancing**:
   - Global and regional
   - Anycast IP
   - Auto-scaling

3. **Azure Load Balancer**:
   - Basic and Standard SKUs
   - Zone redundancy
   - Cross-region support

## Best Practices

1. **High Availability**
   - Deploy multiple load balancers
   - Use different availability zones
   - Implement health checks

2. **Security**
   - Enable SSL/TLS termination
   - Implement DDoS protection
   - Use Web Application Firewall (WAF)
   - Restrict backend access

3. **Performance**
   - Enable connection pooling
   - Configure appropriate timeouts
   - Use caching where possible
   - Monitor and tune algorithms

4. **Monitoring**
   - Track response times
   - Monitor error rates
   - Alert on unhealthy instances
   - Log analysis

5. **Scaling**
   - Auto-scale based on metrics
   - Plan for traffic spikes
   - Test failover scenarios
   - Document capacity limits

## Common Issues and Solutions

### 1. Uneven Load Distribution
- **Cause**: Sticky sessions, poor algorithm choice
- **Solution**: Review algorithm, implement connection limits

### 2. Cascading Failures
- **Cause**: Aggressive health checks, retry storms
- **Solution**: Circuit breakers, exponential backoff

### 3. SSL Certificate Issues
- **Cause**: Expired certs, misconfiguration
- **Solution**: Automated renewal, monitoring

### 4. Connection Exhaustion
- **Cause**: Keep-alive issues, connection leaks
- **Solution**: Connection pooling, timeout tuning

## Load Balancing vs Related Concepts

### Load Balancer vs Reverse Proxy
- Load balancers distribute load across servers
- Reverse proxies can do load balancing plus caching, compression, SSL
- All load balancers are reverse proxies, not vice versa

### Load Balancer vs API Gateway
- API Gateway: API management, auth, rate limiting, transformation
- Load Balancer: Traffic distribution, health checks
- API Gateways often include load balancing

## Interview Questions

1. **Q: How do you handle session state with load balancing?**
   A: Sticky sessions, external session storage (Redis), or stateless design

2. **Q: What's the difference between Layer 4 and Layer 7 load balancing?**
   A: L4 works with IP/port, faster; L7 inspects application data, more features

3. **Q: How do you achieve zero-downtime deployments?**
   A: Rolling updates, blue-green deployments, or canary releases with health checks

4. **Q: How do you prevent a load balancer from becoming a bottleneck?**
   A: Multiple load balancers, horizontal scaling, DNS round-robin, anycast IPs

5. **Q: What happens when a server fails health checks?**
   A: Marked unhealthy, removed from rotation, traffic redistributed, alerts triggered