# What Happens When You Type a URL in Your Browser?

This is one of the most common interview questions that tests your understanding of networking, DNS, HTTP, and web technologies. Let's break down the entire process step by step.

## Complete Flow Overview

```
User types "https://www.example.com/page"
    ↓
Browser Processing → DNS Resolution → TCP Connection
    ↓
TLS Handshake → HTTP Request → Server Processing
    ↓
HTTP Response → Browser Rendering → Page Display
```

## Step 1: User Input and URL Parsing

### Browser URL Processing
1. **Autocomplete and Suggestions**
   - Browser checks history, bookmarks, cached URLs
   - Provides suggestions dropdown
   - May prefetch DNS for likely matches

2. **URL Validation and Parsing**
   ```
   https://www.example.com:443/page?id=123#section
   ├─ Protocol (https)
   ├─ Subdomain (www)
   ├─ Domain (example.com)
   ├─ Port (443, implicit)
   ├─ Path (/page)
   ├─ Query (?id=123)
   └─ Fragment (#section)
   ```

3. **Protocol Handler Check**
   - Determines if URL uses standard protocol (http/https)
   - May handle special protocols (mailto:, ftp:, file:)

## Step 2: Browser Cache Check

### Cache Lookup Sequence
1. **Browser Cache**
   ```
   Memory Cache → Fast, stores current session
   Disk Cache → Persistent, survives restarts
   ```

2. **Service Worker Cache**
   - Programmable network proxy
   - Can intercept and modify requests
   - Offline functionality

3. **HTTP Cache Headers Check**
   ```http
   Cache-Control: max-age=3600
   ETag: "33a64df551"
   Last-Modified: Wed, 21 Oct 2023 07:28:00 GMT
   ```

If cache hit and valid → Skip to Step 9 (Rendering)

## Step 3: DNS Resolution

### DNS Lookup Process

1. **Check Local Caches**
   ```
   Browser DNS Cache → OS DNS Cache → Router Cache
   ```

2. **Hosts File Check**
   ```
   Windows: C:\Windows\System32\drivers\etc\hosts
   Linux/Mac: /etc/hosts
   ```

3. **Recursive DNS Query**
   ```
   Client → ISP DNS Resolver (Recursive Resolver)
         ↓
   Root Server (".")
         ↓
   TLD Server (".com")
         ↓
   Authoritative Server ("example.com")
         ↓
   IP Address (93.184.216.34)
   ```

### DNS Query Types
- **A Record**: IPv4 address
- **AAAA Record**: IPv6 address
- **CNAME**: Canonical name (alias)
- **MX**: Mail exchange
- **NS**: Name server

### DNS Security
- **DNSSEC**: Cryptographic signatures
- **DNS over HTTPS (DoH)**: Encrypted DNS
- **DNS over TLS (DoT)**: Encrypted DNS

## Step 4: Establish TCP Connection

### TCP Three-Way Handshake
```
Client                          Server
  |                               |
  |-------- SYN (seq=x) -------->|
  |                               |
  |<----- SYN-ACK (seq=y, ack=x+1)|
  |                               |
  |-------- ACK (ack=y+1) ------->|
  |                               |
  |      Connection Established   |
```

### TCP Details
1. **SYN (Synchronize)**
   - Client sends random sequence number
   - Includes TCP options (window size, MSS)

2. **SYN-ACK**
   - Server acknowledges client's SYN
   - Sends its own sequence number

3. **ACK (Acknowledge)**
   - Client acknowledges server's SYN
   - Connection ready for data transfer

### Modern Optimizations
- **TCP Fast Open**: Send data with SYN
- **Happy Eyeballs**: Parallel IPv4/IPv6 attempts
- **Connection Pooling**: Reuse existing connections

## Step 5: TLS/SSL Handshake (for HTTPS)

### TLS 1.2 Handshake
```
Client                          Server
  |                               |
  |------- Client Hello -------->|
  |     (cipher suites, TLS version)
  |                               |
  |<------ Server Hello ---------|
  |     (chosen cipher, certificate)
  |                               |
  |<------ Certificate ----------|
  |                               |
  |<------ Server Hello Done ----|
  |                               |
  |------- Key Exchange -------->|
  |                               |
  |------- Change Cipher Spec -->|
  |                               |
  |------- Finished ------------>|
  |                               |
  |<------ Change Cipher Spec ---|
  |                               |
  |<------ Finished -------------|
  |                               |
  |     Encrypted Communication   |
```

### TLS 1.3 Improvements
- **1-RTT Handshake**: Faster connection
- **0-RTT Resumption**: Skip handshake for known servers
- **Forward Secrecy**: Mandatory
- **Removed Weak Algorithms**: More secure

### Certificate Validation
1. Check certificate validity period
2. Verify certificate chain to trusted CA
3. Check certificate revocation (OCSP)
4. Validate domain name matches
5. Check certificate transparency logs

## Step 6: HTTP Request

### Request Construction
```http
GET /page HTTP/2
Host: www.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: text/html,application/xhtml+xml
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: session_id=abc123
Cache-Control: no-cache
```

### HTTP Methods
- **GET**: Retrieve resource
- **POST**: Submit data
- **PUT**: Update resource
- **DELETE**: Remove resource
- **HEAD**: Headers only
- **OPTIONS**: Available methods
- **PATCH**: Partial update

### HTTP/2 Features
- **Multiplexing**: Multiple streams over single connection
- **Server Push**: Proactive resource sending
- **Header Compression**: HPACK algorithm
- **Binary Protocol**: More efficient than text

### HTTP/3 (QUIC)
- Built on UDP instead of TCP
- Faster connection establishment
- Better performance on lossy networks
- Connection migration support

## Step 7: Server Processing

### Request Handling Flow

1. **Load Balancer/Reverse Proxy**
   ```
   Internet → Load Balancer → Web Server Pool
   ```

2. **Web Server Processing**
   - Parse HTTP request
   - Route to appropriate handler
   - Check authentication/authorization

3. **Application Server**
   ```python
   # Example Django request processing
   def view_function(request):
       # Business logic
       data = database.query()
       return render(template, data)
   ```

4. **Database Queries**
   ```sql
   SELECT * FROM users WHERE id = 123;
   ```

5. **Cache Layers**
   - Application cache (Redis, Memcached)
   - Database query cache
   - CDN cache

### Microservices Architecture
```
API Gateway → Service Discovery
           ↓
    User Service ←→ Order Service
           ↓              ↓
        User DB       Order DB
```

## Step 8: HTTP Response

### Response Structure
```http
HTTP/2 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 12345
Content-Encoding: gzip
Cache-Control: public, max-age=3600
Set-Cookie: session_id=xyz789; HttpOnly; Secure
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN

<!DOCTYPE html>
<html>
<head>...</head>
<body>...</body>
</html>
```

### Status Codes
- **1xx**: Informational
- **2xx**: Success (200 OK, 201 Created, 204 No Content)
- **3xx**: Redirection (301 Moved Permanently, 302 Found, 304 Not Modified)
- **4xx**: Client Error (400 Bad Request, 401 Unauthorized, 404 Not Found)
- **5xx**: Server Error (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable)

### Response Processing
1. **Decompression**: gzip, brotli, deflate
2. **Character Encoding**: UTF-8 conversion
3. **Cookie Storage**: Update cookie jar
4. **Cache Storage**: Based on cache headers

## Step 9: Browser Rendering

### Critical Rendering Path

1. **DOM Construction**
   ```
   HTML → Tokenizer → Parse Tree → DOM Tree
   ```

2. **CSSOM Construction**
   ```
   CSS → Tokenizer → Parse Tree → CSSOM Tree
   ```

3. **Render Tree Creation**
   ```
   DOM Tree + CSSOM Tree → Render Tree
   ```

4. **Layout (Reflow)**
   - Calculate element positions
   - Determine sizes and dimensions
   - Handle responsive breakpoints

5. **Paint**
   - Fill in pixels
   - Create paint records
   - Layer composition

6. **Composite**
   - GPU acceleration
   - Layer management
   - Final pixel output

### JavaScript Execution
```javascript
// Parser-blocking script
<script src="app.js"></script>

// Async script (doesn't block parser)
<script async src="analytics.js"></script>

// Deferred script (executes after DOM ready)
<script defer src="main.js"></script>
```

### Resource Loading

1. **Critical Resources**
   - HTML, Critical CSS, Critical JS
   - Block initial render

2. **Progressive Loading**
   ```html
   <!-- Preload critical resources -->
   <link rel="preload" href="font.woff2" as="font">

   <!-- Prefetch future navigation -->
   <link rel="prefetch" href="/next-page">

   <!-- DNS prefetch for external domains -->
   <link rel="dns-prefetch" href="//api.example.com">
   ```

3. **Lazy Loading**
   ```html
   <img loading="lazy" src="image.jpg">
   ```

## Step 10: Additional Requests

### Parallel Resource Downloads
- Browser typically allows 6 connections per domain
- HTTP/2 multiplexing allows unlimited streams
- Domain sharding (HTTP/1.1 optimization)

### Resource Types
1. **CSS Files**: Block rendering
2. **JavaScript Files**: May block parsing
3. **Images**: Progressive rendering
4. **Fonts**: FOIT/FOUT behavior
5. **Ajax/Fetch Requests**: Dynamic content

## Performance Optimizations

### Network Optimizations
1. **CDN (Content Delivery Network)**
   ```
   User → Nearest CDN Edge → Origin Server
   ```

2. **Compression**
   - Gzip: Standard compression
   - Brotli: Better compression ratio
   - WebP/AVIF: Image formats

3. **HTTP/2 Server Push**
   ```http
   Link: </style.css>; rel=preload; as=style
   ```

### Browser Optimizations
1. **Prefetching**
   - DNS prefetch
   - Preconnect
   - Preload
   - Prerender

2. **Caching Strategies**
   - Cache-first
   - Network-first
   - Stale-while-revalidate

3. **Code Splitting**
   ```javascript
   // Dynamic import
   import('./module').then(module => {
     // Use module
   });
   ```

## Security Considerations

### HTTPS Security
1. **SSL/TLS Encryption**: Protects data in transit
2. **Certificate Validation**: Prevents MITM attacks
3. **HSTS**: Forces HTTPS usage
4. **Certificate Pinning**: Mobile app security

### Browser Security Features
1. **Same-Origin Policy**: Isolates origins
2. **CORS**: Cross-origin resource sharing
3. **CSP**: Content Security Policy
4. **XSS Protection**: Script injection prevention
5. **CSRF Tokens**: Request forgery protection

## Modern Web Technologies

### Progressive Web Apps (PWA)
- Service Workers for offline functionality
- Web App Manifest
- Push notifications
- Background sync

### WebAssembly
- Near-native performance
- Compiled from C/C++/Rust
- Runs in sandboxed environment

### HTTP/3 and QUIC
- UDP-based transport
- 0-RTT connection establishment
- Connection migration
- Improved congestion control

## Common Interview Follow-ups

1. **Q: How can you optimize this process?**
   - Use CDN for static assets
   - Implement caching strategies
   - Enable HTTP/2 or HTTP/3
   - Minimize redirects
   - Optimize images and resources

2. **Q: What happens with a 301 redirect?**
   - Browser receives 301 status with Location header
   - Makes new request to new URL
   - Updates bookmarks/history
   - Search engines update their index

3. **Q: How does browser caching work?**
   - Check Cache-Control and Expires headers
   - Validate with ETag or Last-Modified
   - 304 Not Modified if unchanged
   - Serve from cache or fetch new

4. **Q: What's the difference between HTTP/1.1 and HTTP/2?**
   - HTTP/2: Binary protocol, multiplexing, server push, header compression
   - HTTP/1.1: Text protocol, one request per connection (without pipelining)

5. **Q: How do cookies work in this process?**
   - Browser sends cookies with request
   - Server may set new cookies in response
   - Cookies stored per domain/path
   - Subject to SameSite and secure flags

## Timing Breakdown (Typical)

- DNS Lookup: 20-120ms
- TCP Handshake: 30-100ms
- TLS Handshake: 40-150ms
- HTTP Request: 10-30ms
- Server Processing: 50-500ms
- HTTP Response: 10-100ms
- DOM/CSSOM Building: 20-100ms
- Rendering: 20-200ms

**Total: 200ms - 1300ms** (varies greatly based on network, server, and content)