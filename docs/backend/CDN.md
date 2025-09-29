# CDN (Content Delivery Network)

## What is a CDN?

A Content Delivery Network is a geographically distributed network of proxy servers that deliver content to users from the server closest to their location, reducing latency and improving load times.

## How CDN Works

### Basic Architecture
```
Origin Server (Virginia)
        ↓
CDN Provider Network
    ↙   ↓   ↘
Edge Servers Worldwide
    ↙   ↓   ↘
Users in Different Regions
```

### Content Delivery Flow
1. **First Request (Cache Miss)**
   ```
   User → Nearest Edge Server → Origin Server
                ↓
          Cache Content
                ↓
          Serve to User
   ```

2. **Subsequent Requests (Cache Hit)**
   ```
   User → Nearest Edge Server → Serve from Cache
   ```

## Types of CDN

### Push CDN
- Content is proactively pushed to edge servers
- Developer uploads content to CDN
- Better for sites with predictable content
- Example: Static site generators

### Pull CDN
- Content is fetched on first request (lazy loading)
- Automatic cache population
- Better for dynamic or unpredictable content
- Example: User-generated content

## CDN Components

### 1. Points of Presence (PoPs)
- Physical data center locations
- Contains multiple edge servers
- Strategically placed globally
- Connected via high-speed backbone

### 2. Edge Servers
- Cache and serve content
- Handle user requests
- Perform edge computing
- SSL termination

### 3. Origin Server
- Master copy of content
- Source of truth
- Handles cache misses
- Processes dynamic requests

### 4. DNS Infrastructure
- GeoDNS for location-based routing
- Anycast IP addresses
- Health monitoring
- Automatic failover

## Content Types Served

### Static Content
- Images (JPEG, PNG, WebP, SVG)
- CSS stylesheets
- JavaScript files
- Fonts (WOFF, TTF)
- Videos (MP4, WebM)
- Documents (PDF)

### Dynamic Content (Modern CDNs)
- API responses (with careful cache headers)
- Personalized content (edge computing)
- Real-time data (WebSocket proxying)

## Benefits of CDN

### 1. Performance
- **Reduced Latency**: ~50-70% improvement
- **Faster Load Times**: 2-3x faster page loads
- **Better User Experience**: Lower bounce rates
- **Bandwidth Optimization**: Compression and optimization

### 2. Availability
- **Redundancy**: Multiple server locations
- **Failover**: Automatic rerouting
- **Load Distribution**: Prevents origin overload
- **100% Uptime**: Even during origin failures

### 3. Scalability
- **Traffic Spikes**: Handle sudden load increases
- **Global Reach**: Serve users worldwide
- **Elastic Capacity**: Auto-scaling
- **Cost Effective**: Pay-per-use model

### 4. Security
- **DDoS Protection**: Absorb attack traffic
- **WAF Integration**: Web application firewall
- **SSL/TLS**: Certificate management
- **Bot Protection**: Filter malicious traffic

## Caching Strategies

### Cache Headers
```http
Cache-Control: public, max-age=31536000, immutable
ETag: "33a64df551"
Last-Modified: Wed, 21 Oct 2023 07:28:00 GMT
Expires: Thu, 31 Dec 2024 23:59:59 GMT
```

### Cache Invalidation Methods
1. **TTL Expiration**: Natural timeout
2. **Purge API**: Programmatic removal
3. **Cache Tags**: Group-based invalidation
4. **Versioning**: URL fingerprinting
   ```
   /assets/style.v2.css
   /assets/style.css?v=12345
   ```

### Cache Levels
```
Browser Cache → CDN Edge Cache → CDN Shield → Origin
```

## CDN Routing Methods

### 1. GeoDNS
```
User in Tokyo → DNS Query → Tokyo Edge Server IP
User in London → DNS Query → London Edge Server IP
```

### 2. Anycast
- Single IP address for multiple servers
- Network routes to nearest server
- Automatic failover
- Used by Cloudflare

### 3. Performance-Based
- Real-time performance monitoring
- Routes to fastest server
- Considers network congestion
- Dynamic optimization

## Edge Computing

### Edge Functions
```javascript
// Cloudflare Worker example
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Modify request
  // Add authentication
  // Transform response
  return new Response('Hello from edge!')
}
```

### Use Cases
- A/B testing
- Authentication
- Request modification
- Response transformation
- Bot detection
- Geolocation-based content

## CDN Providers

### Major Providers

1. **Cloudflare**
   - Free tier available
   - 200+ data centers
   - DDoS protection included
   - Edge Workers

2. **AWS CloudFront**
   - Deep AWS integration
   - 400+ PoPs
   - Lambda@Edge
   - Shield for DDoS

3. **Akamai**
   - Largest network (300,000+ servers)
   - Enterprise focus
   - Advanced security features
   - EdgeWorkers

4. **Fastly**
   - Real-time purging
   - Instant configuration changes
   - Varnish-based
   - Edge computing

5. **Google Cloud CDN**
   - Google's global network
   - Anycast IPs
   - Cloud Armor integration
   - Cache invalidation API

## Implementation Best Practices

### 1. Asset Organization
```
/static/
  /css/     → Long cache (1 year)
  /js/      → Long cache (1 year)
  /images/  → Medium cache (1 month)
/api/       → Short cache or no cache
/dynamic/   → No cache
```

### 2. URL Versioning
```html
<!-- Bad: Browser might cache old version -->
<link rel="stylesheet" href="/style.css">

<!-- Good: Force new version -->
<link rel="stylesheet" href="/style.css?v=2.1.0">

<!-- Better: Content hash -->
<link rel="stylesheet" href="/style.abc123.css">
```

### 3. Cache Headers Strategy
```nginx
# Static assets (1 year)
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

# HTML (no cache)
location ~* \.(html)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# API responses (5 minutes)
location /api {
    add_header Cache-Control "public, max-age=300";
}
```

## Performance Metrics

### Key Metrics
- **Cache Hit Ratio**: >90% is good
- **Bandwidth Savings**: 60-80% typical
- **Origin Offload**: Traffic served from edge
- **TTFB**: Time to first byte (&lt;200ms good)

### Monitoring
```javascript
// Performance API
const perfData = performance.getEntriesByType('navigation')[0];
console.log('DNS:', perfData.domainLookupEnd - perfData.domainLookupStart);
console.log('TCP:', perfData.connectEnd - perfData.connectStart);
console.log('TTFB:', perfData.responseStart - perfData.fetchStart);
```

## Advanced Features

### 1. Image Optimization
```
Original: image.jpg (500KB)
    ↓
CDN Transforms:
- Resize: image.jpg?w=300&h=200
- Format: image.webp (200KB)
- Quality: image.jpg?q=85
```

### 2. Video Streaming
- Adaptive bitrate streaming
- HLS/DASH protocols
- Chunk caching
- Live streaming support

### 3. Security Features
```http
# Security headers added by CDN
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: default-src 'self'
```

### 4. Load Balancing
```
CDN Edge → Multiple Origins
         ↙        ↘
    Primary      Backup
    Origin       Origin
```

## Common Challenges

### 1. Cache Invalidation
**Problem**: Updated content not reflected
**Solutions**:
- Cache busting with version numbers
- Shorter TTL for frequently changing content
- Use CDN purge API

### 2. CORS Issues
**Problem**: Cross-origin resource blocked
**Solution**:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### 3. SSL Certificate Management
**Problem**: Certificate errors on custom domains
**Solutions**:
- Use CDN-provided certificates
- Upload custom certificates
- Automated renewal with Let's Encrypt

### 4. Dynamic Content Caching
**Problem**: Caching personalized content
**Solutions**:
- Vary header for cache key
- Edge-side includes (ESI)
- Edge computing for personalization

## Cost Optimization

### Strategies
1. **Optimize Cache Headers**: Higher cache hit ratio
2. **Compress Content**: Reduce bandwidth costs
3. **Image Optimization**: Serve appropriate sizes
4. **Geographic Restrictions**: Limit serving regions
5. **Bandwidth Commitments**: Volume discounts

### Cost Factors
- Bandwidth usage (GB transferred)
- Number of requests
- Geographic distribution
- Additional features (WAF, DDoS)
- Storage costs

## CDN vs Other Solutions

### CDN vs Multiple Servers
- CDN: Automatic geographic distribution
- Multiple Servers: Manual management required

### CDN vs Reverse Proxy
- CDN: Global caching network
- Reverse Proxy: Single location caching

### CDN vs Cloud Storage
- CDN: Optimized for delivery
- Cloud Storage: Optimized for storage

## Interview Questions

1. **Q: How does a CDN improve website performance?**
   A: Reduces latency by serving from nearest location, caches content to reduce origin load, optimizes content delivery, and provides better bandwidth.

2. **Q: What's the difference between push and pull CDN?**
   A: Push CDN requires manual content upload; Pull CDN fetches automatically on first request.

3. **Q: How do you handle cache invalidation?**
   A: Cache busting with version numbers, TTL expiration, purge APIs, or cache tags.

4. **Q: When wouldn't you use a CDN?**
   A: Highly dynamic personalized content, regulatory requirements for data locality, very small user base in single region, or cost constraints.

5. **Q: How does CDN handle SSL/TLS?**
   A: SSL termination at edge, certificate management, SNI support for multiple domains, and automated renewal.