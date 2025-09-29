# HTTP vs HTTPS

## HTTP (HyperText Transfer Protocol)

HTTP is the foundation of data communication on the World Wide Web. It's an application-layer protocol that enables communication between clients and servers.

### Key Characteristics of HTTP
- **Port**: Default port 80
- **Security**: Unencrypted, plain text transmission
- **Performance**: Slightly faster due to no encryption overhead
- **URL Format**: `http://example.com`

### How HTTP Works
1. Client sends an HTTP request to the server
2. Server processes the request
3. Server sends back an HTTP response
4. All data is transmitted in plain text

## HTTPS (HyperText Transfer Protocol Secure)

HTTPS is the secure version of HTTP, using encryption to protect data transmission between client and server.

### Key Characteristics of HTTPS
- **Port**: Default port 443
- **Security**: Encrypted using SSL/TLS protocols
- **Performance**: Slightly slower due to encryption/decryption overhead
- **URL Format**: `https://example.com`
- **Certificate**: Requires SSL/TLS certificate

### How HTTPS Works
1. **SSL/TLS Handshake**:
   - Client sends "Client Hello" with supported cipher suites
   - Server responds with "Server Hello" and certificate
   - Client verifies certificate authenticity
   - Session keys are generated and exchanged
2. **Encrypted Communication**:
   - All subsequent data is encrypted using session keys
   - Data integrity is verified using message authentication codes

## Key Differences

| Aspect | HTTP | HTTPS |
|--------|------|-------|
| **Security** | No encryption | SSL/TLS encryption |
| **Data Integrity** | No protection | Protected via certificates |
| **Authentication** | No server authentication | Server authentication via certificates |
| **SEO Ranking** | Lower ranking | Higher ranking (Google preference) |
| **Browser Warnings** | No warnings | "Not Secure" warnings if absent |
| **Speed** | Marginally faster | Slightly slower (negligible with HTTP/2) |
| **Caching** | Can be cached by proxies | End-to-end encryption limits proxy caching |

## When to Use What

### Use HTTP When:
- Building internal tools on isolated networks
- Developing/testing on localhost
- Working with non-sensitive, public data
- Resource-constrained IoT devices (though HTTPS is still recommended)

### Use HTTPS When (Always Preferred):
- **User Authentication**: Login pages, user accounts
- **Sensitive Data**: Personal information, financial data, health records
- **E-commerce**: Payment processing, shopping carts
- **Forms**: Any form collecting user data
- **APIs**: Especially those requiring authentication
- **Public Websites**: SEO benefits and user trust
- **Compliance**: Meeting regulatory requirements (PCI DSS, GDPR, HIPAA)

## SSL/TLS Certificates

### Types of Certificates:
1. **Domain Validated (DV)**
   - Basic encryption
   - Validates domain ownership only
   - Quick issuance

2. **Organization Validated (OV)**
   - Validates organization identity
   - More trust indicators

3. **Extended Validation (EV)**
   - Highest level of validation
   - Green address bar (in older browsers)
   - Extensive verification process

### Certificate Authorities (CAs):
- Let's Encrypt (free, automated)
- DigiCert
- Comodo
- GoDaddy
- GlobalSign

## Modern Considerations

### HTTP/2 and HTTP/3
- **HTTP/2**: Requires HTTPS in practice (browser requirement)
- **HTTP/3**: Built on QUIC, always encrypted

### HSTS (HTTP Strict Transport Security)
- Forces browsers to use HTTPS
- Prevents protocol downgrade attacks
- Configured via response header:
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```

### Mixed Content Issues
- HTTPS pages loading HTTP resources
- Browsers block or warn about mixed content
- All resources should use HTTPS on secure pages

## Performance Optimization

### HTTPS Performance Tips:
1. **Session Resumption**: Reuse TLS sessions
2. **OCSP Stapling**: Faster certificate validation
3. **HTTP/2 Push**: Proactive resource sending
4. **CDN with SSL**: Distributed SSL termination
5. **TLS 1.3**: Faster handshake (1-RTT or 0-RTT)

## Security Best Practices

1. **Always use HTTPS** for production websites
2. **Implement HSTS** to enforce HTTPS
3. **Use strong cipher suites** and disable weak ones
4. **Keep certificates updated** before expiration
5. **Implement certificate pinning** for mobile apps
6. **Regular security audits** using tools like SSL Labs
7. **Redirect HTTP to HTTPS** automatically
8. **Use secure cookies** with Secure and HttpOnly flags

## Common Interview Questions

1. **Q: What happens during an SSL/TLS handshake?**
   A: Client hello → Server hello + certificate → Key exchange → Finished messages → Encrypted communication

2. **Q: Can HTTPS prevent all attacks?**
   A: No, it protects data in transit but doesn't prevent XSS, SQL injection, or server-side vulnerabilities

3. **Q: What is a man-in-the-middle attack?**
   A: An attacker intercepts communication between client and server; HTTPS prevents this through encryption and authentication

4. **Q: What's the difference between SSL and TLS?**
   A: TLS is the successor to SSL; SSL 3.0 evolved into TLS 1.0. Modern systems use TLS (currently 1.3)

5. **Q: Why might HTTP be faster than HTTPS?**
   A: No encryption overhead, no handshake process, though with HTTP/2 and TLS 1.3, the difference is negligible