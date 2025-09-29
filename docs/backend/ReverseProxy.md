# Reverse Proxy

## What is a Reverse Proxy?

A reverse proxy is a server that sits between client devices (browsers, mobile apps) and backend servers, forwarding client requests to the appropriate backend server and returning the server's response to the client.

```
Client → Reverse Proxy → Backend Server(s)
```

Unlike a forward proxy that sits between clients and the internet, a reverse proxy sits between the internet and your servers.

## Forward Proxy vs Reverse Proxy

### Forward Proxy
```
Client → Forward Proxy → Internet → Server
```
- Hides client identity from servers
- Used by clients to access blocked content
- Examples: Corporate proxies, VPNs
- Client knows about the proxy

### Reverse Proxy
```
Client → Internet → Reverse Proxy → Server
```
- Hides server details from clients
- Used by servers to manage traffic
- Examples: Cloudflare, NGINX
- Client doesn't know about the proxy

## Key Functions of Reverse Proxy

### 1. Load Balancing
Distributes requests across multiple backend servers
```nginx
upstream backend {
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
```

### 2. SSL Termination
Handles SSL/TLS encryption and decryption
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://backend;  # Backend uses HTTP
    }
}
```

### 3. Caching
Stores and serves frequently requested content
```nginx
proxy_cache_path /cache levels=1:2 keys_zone=my_cache:10m;
location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    proxy_pass http://backend;
}
```

### 4. Compression
Reduces bandwidth by compressing responses
```nginx
gzip on;
gzip_types text/plain application/json application/javascript;
gzip_comp_level 6;
```

### 5. Security and Anonymity
- Hides backend server IP addresses
- Shields internal network structure
- Can filter malicious requests

### 6. Web Acceleration
- Connection pooling
- Content optimization
- HTTP/2 to HTTP/1.1 translation

## Architecture Patterns

### Single Reverse Proxy
```
Internet → Reverse Proxy → Application Server
```
- Simple setup
- Single point of failure

### High Availability Setup
```
Internet → Load Balancer
         ↙            ↘
    Proxy 1         Proxy 2
         ↘            ↙
      Backend Servers
```

### Multi-Tier Architecture
```
Internet → CDN → Reverse Proxy → API Gateway → Microservices
```

### Geographic Distribution
```
Users → Nearest Edge Proxy → Origin Proxy → Backend
```

## Common Use Cases

### 1. Microservices Architecture
```nginx
location /api/users {
    proxy_pass http://user-service:8001;
}
location /api/products {
    proxy_pass http://product-service:8002;
}
location /api/orders {
    proxy_pass http://order-service:8003;
}
```

### 2. Static Content Serving
```nginx
location ~* \.(jpg|jpeg|png|gif|css|js)$ {
    root /var/www/static;
    expires 30d;
}
```

### 3. API Gateway
- Request routing
- Authentication
- Rate limiting
- Request/response transformation

### 4. WebSocket Support
```nginx
location /ws {
    proxy_pass http://websocket-backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 5. A/B Testing
```nginx
split_clients "${remote_addr}" $backend_pool {
    20% backend_v2;
    *   backend_v1;
}
location / {
    proxy_pass http://$backend_pool;
}
```

## Configuration Examples

### Basic NGINX Reverse Proxy
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache Reverse Proxy
```apache
<VirtualHost *:80>
    ServerName example.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

### HAProxy Configuration
```
global
    daemon

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend web
    bind *:80
    default_backend servers

backend servers
    balance roundrobin
    server server1 192.168.1.100:80 check
    server server2 192.168.1.101:80 check
```

## Important HTTP Headers

### Request Headers Added by Proxy
```
X-Forwarded-For: client-ip, proxy1-ip, proxy2-ip
X-Forwarded-Host: original-host.com
X-Forwarded-Proto: https
X-Real-IP: client-ip
X-Forwarded-Port: 443
```

### Response Headers
```
Via: 1.1 proxy.example.com
X-Cache: HIT/MISS
X-Cache-Status: HIT/MISS/EXPIRED/UPDATING
```

## Benefits of Reverse Proxy

### 1. Performance
- **Caching**: Reduces backend load
- **Compression**: Decreases bandwidth usage
- **Connection pooling**: Fewer backend connections
- **SSL termination**: Offloads crypto operations

### 2. Security
- **IP masking**: Hides backend servers
- **DDoS mitigation**: Can absorb/filter attacks
- **WAF integration**: Web application firewall
- **Rate limiting**: Prevents abuse

### 3. Scalability
- **Load distribution**: Horizontal scaling
- **Backend flexibility**: Easy server additions
- **Graceful degradation**: Handle failures
- **Zero-downtime updates**: Rolling deployments

### 4. Centralized Management
- **Single SSL certificate point**
- **Unified logging**
- **Common authentication**
- **Consistent headers**

## Advanced Features

### Request/Response Modification
```nginx
# Add custom header
proxy_set_header X-Custom-Header "value";

# Modify response
sub_filter 'old-domain.com' 'new-domain.com';
sub_filter_once off;
```

### Circuit Breaking
```nginx
upstream backend {
    server backend1.com max_fails=3 fail_timeout=30s;
    server backend2.com max_fails=3 fail_timeout=30s;
}
```

### Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend;
}
```

### Health Checks
```nginx
upstream backend {
    server backend1.com;
    server backend2.com;

    # Active health check (NGINX Plus)
    health_check interval=5s fails=3 passes=2;
}
```

### Content-Based Routing
```nginx
map $request_uri $backend_pool {
    ~^/api/v1  backend_v1;
    ~^/api/v2  backend_v2;
    default    backend_default;
}

location / {
    proxy_pass http://$backend_pool;
}
```

## Popular Reverse Proxy Solutions

### Open Source
1. **NGINX**
   - Most popular
   - High performance
   - Rich features
   - Extensive documentation

2. **Apache HTTP Server** (with mod_proxy)
   - Mature and stable
   - Flexible configuration
   - Wide platform support

3. **HAProxy**
   - Focus on load balancing
   - High availability
   - Advanced health checks

4. **Traefik**
   - Cloud-native
   - Auto-discovery
   - Docker/Kubernetes integration

5. **Caddy**
   - Automatic HTTPS
   - Simple configuration
   - HTTP/3 support

### Commercial/Cloud
1. **Cloudflare**
   - Global CDN
   - DDoS protection
   - Edge computing

2. **AWS CloudFront**
   - CDN with proxy capabilities
   - AWS integration
   - Lambda@Edge

3. **Akamai**
   - Enterprise CDN
   - Advanced security
   - Global presence

4. **NGINX Plus**
   - Commercial NGINX
   - Active health checks
   - Dynamic configuration

## Common Challenges and Solutions

### 1. Client IP Preservation
**Problem**: Backend sees proxy IP, not client IP
**Solution**: Use X-Forwarded-For header
```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### 2. WebSocket Support
**Problem**: WebSockets need special handling
**Solution**: Upgrade connection headers
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### 3. Cookie Domain Issues
**Problem**: Cookies set for wrong domain
**Solution**: Proxy cookie domain rewriting
```nginx
proxy_cookie_domain backend.internal example.com;
```

### 4. Timeout Issues
**Problem**: Long-running requests timeout
**Solution**: Adjust timeout settings
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

### 5. CORS Issues
**Problem**: Cross-origin requests blocked
**Solution**: Add CORS headers at proxy
```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
```

## Performance Tuning

### Connection Settings
```nginx
# Worker connections
worker_connections 4096;

# Keepalive to backend
upstream backend {
    server backend1.com;
    keepalive 32;
}
```

### Buffer Settings
```nginx
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

### Cache Optimization
```nginx
proxy_cache_path /cache levels=1:2 keys_zone=cache:100m
                 max_size=10g inactive=60m;
proxy_cache_key "$scheme$request_method$host$request_uri";
proxy_cache_methods GET HEAD;
```

## Security Best Practices

1. **Hide Backend Information**
   ```nginx
   proxy_hide_header X-Powered-By;
   proxy_hide_header Server;
   ```

2. **Request Size Limits**
   ```nginx
   client_max_body_size 10M;
   client_body_buffer_size 128k;
   ```

3. **SSL/TLS Configuration**
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers HIGH:!aNULL:!MD5;
   ssl_prefer_server_ciphers on;
   ```

4. **Rate Limiting**
   ```nginx
   limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
   ```

5. **Access Control**
   ```nginx
   location /admin {
       allow 192.168.1.0/24;
       deny all;
       proxy_pass http://backend;
   }
   ```

## Monitoring and Logging

### Access Logs
```nginx
log_format proxy '$remote_addr - $remote_user [$time_local] '
                 '"$request" $status $body_bytes_sent '
                 '"$http_referer" "$http_user_agent" '
                 'rt=$request_time uct="$upstream_connect_time" '
                 'uht="$upstream_header_time" urt="$upstream_response_time"';

access_log /var/log/nginx/proxy.log proxy;
```

### Key Metrics to Monitor
- Request rate
- Response time
- Error rate
- Cache hit ratio
- Backend health
- Connection count
- Bandwidth usage

## Interview Questions

1. **Q: What's the difference between a reverse proxy and a load balancer?**
   A: A load balancer distributes traffic across servers. A reverse proxy can do load balancing plus caching, compression, SSL termination, and more. All load balancers are reverse proxies, but not all reverse proxies do load balancing.

2. **Q: How does a reverse proxy improve security?**
   A: Hides backend servers, can filter malicious requests, provides single point for SSL/security policies, and can integrate with WAF/DDoS protection.

3. **Q: When would you use a reverse proxy vs an API gateway?**
   A: Reverse proxy for basic routing, caching, and load balancing. API gateway for API-specific features like authentication, rate limiting, request transformation, and API versioning.

4. **Q: How do you handle sticky sessions with a reverse proxy?**
   A: Use cookie-based routing, IP hash, or application session affinity. Configure the proxy to route requests from the same client to the same backend.

5. **Q: What happens if the reverse proxy fails?**
   A: Single point of failure unless using HA setup. Solutions include multiple proxies with failover, DNS round-robin, or cloud load balancers with health checks.