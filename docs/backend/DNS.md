# DNS (Domain Name System)

## What is DNS?

DNS is the internet's phone book - it translates human-readable domain names (like google.com) into IP addresses (like 142.250.80.46) that computers use to communicate. It's a hierarchical, distributed database system that forms a critical part of internet infrastructure.

## DNS Hierarchy

### DNS Structure
```
                Root (.)
            /      |       \
        .com     .org      .net    (TLDs)
          |        |         |
     google   wikipedia   example  (SLDs)
          |        |         |
        www      en        mail    (Subdomains)
```

### DNS Components

1. **Root Servers**
   - 13 root server clusters (A-M)
   - Knows all TLD nameservers
   - Distributed globally with anycast

2. **TLD (Top-Level Domain) Servers**
   - Generic: .com, .org, .net, .edu
   - Country-code: .uk, .jp, .de
   - New gTLDs: .app, .dev, .blog

3. **Authoritative Nameservers**
   - Contains actual DNS records
   - Final source of truth for a domain
   - Usually 2-4 servers for redundancy

4. **Recursive Resolvers**
   - ISP or public DNS (8.8.8.8, 1.1.1.1)
   - Performs full DNS lookup
   - Caches results

## DNS Resolution Process

### Full Resolution Flow
```
User enters "www.example.com" in browser
            ↓
1. Check Browser Cache
            ↓ (miss)
2. Check OS Cache
            ↓ (miss)
3. Check Router Cache
            ↓ (miss)
4. Query ISP Recursive Resolver
            ↓
5. Query Root Server → Returns .com TLD servers
            ↓
6. Query .com TLD → Returns example.com nameservers
            ↓
7. Query example.com nameserver → Returns IP address
            ↓
8. Return IP to browser
            ↓
9. Browser connects to IP address
```

### Recursive vs Iterative Queries

**Recursive Query**
```
Client → Recursive Resolver: "What's the IP of example.com?"
Recursive Resolver does all the work
Recursive Resolver → Client: "It's 93.184.216.34"
```

**Iterative Query**
```
Resolver → Root: "Where's .com?"
Root → Resolver: "Ask these TLD servers"
Resolver → TLD: "Where's example.com?"
TLD → Resolver: "Ask these nameservers"
Resolver → Nameserver: "What's the IP?"
Nameserver → Resolver: "93.184.216.34"
```

## DNS Record Types

### Common Record Types

1. **A (Address) Record**
   ```
   example.com.    IN    A    93.184.216.34
   ```
   Maps domain to IPv4 address

2. **AAAA Record**
   ```
   example.com.    IN    AAAA    2606:2800:220:1:248:1893:25c8:1946
   ```
   Maps domain to IPv6 address

3. **CNAME (Canonical Name)**
   ```
   www.example.com.    IN    CNAME    example.com.
   blog.example.com.   IN    CNAME    example.wordpress.com.
   ```
   Alias for another domain

4. **MX (Mail Exchange)**
   ```
   example.com.    IN    MX    10    mail1.example.com.
   example.com.    IN    MX    20    mail2.example.com.
   ```
   Specifies mail servers with priority

5. **TXT (Text)**
   ```
   example.com.    IN    TXT    "v=spf1 include:_spf.google.com ~all"
   ```
   Arbitrary text data (SPF, DKIM, domain verification)

6. **NS (Nameserver)**
   ```
   example.com.    IN    NS    ns1.example.com.
   example.com.    IN    NS    ns2.example.com.
   ```
   Specifies authoritative nameservers

7. **PTR (Pointer)**
   ```
   34.216.184.93.in-addr.arpa.    IN    PTR    example.com.
   ```
   Reverse DNS lookup (IP to domain)

8. **SOA (Start of Authority)**
   ```
   example.com. IN SOA ns1.example.com. admin.example.com. (
       2024010101 ; Serial
       7200       ; Refresh
       3600       ; Retry
       1209600    ; Expire
       3600       ; Minimum TTL
   )
   ```

9. **SRV (Service)**
   ```
   _sip._tcp.example.com. IN SRV 10 60 5060 sipserver.example.com.
   ```
   Service discovery (port, priority, weight)

10. **CAA (Certificate Authority Authorization)**
    ```
    example.com. IN CAA 0 issue "letsencrypt.org"
    ```
    Specifies allowed certificate authorities

## DNS Caching

### Cache Locations
1. **Browser Cache**
   - Chrome: chrome://net-internals/#dns
   - Very short TTL (60 seconds typical)

2. **Operating System Cache**
   - Windows: `ipconfig /displaydns`
   - Linux: nscd or systemd-resolved
   - macOS: `dscacheutil -cachedump`

3. **Router/Gateway Cache**
   - Home routers cache DNS
   - Corporate firewalls

4. **ISP Recursive Resolver**
   - Largest cache
   - Serves many users

### TTL (Time To Live)
```
example.com.    300    IN    A    93.184.216.34
                ↑
            TTL in seconds (5 minutes)
```

Common TTL Values:
- 300 (5 min): Frequently changing content
- 3600 (1 hour): Normal websites
- 86400 (1 day): Stable infrastructure
- 604800 (1 week): Rarely changing records

## DNS Security

### DNSSEC (DNS Security Extensions)
Provides authentication and integrity but not confidentiality

**How it works:**
1. Zone signing with private key
2. Public key in DNSKEY record
3. Chain of trust from root
4. Signature validation

```
example.com.    IN    RRSIG    A 8 2 86400 (
    20240131000000 20240101000000 12345 example.com.
    [signature data]
)
```

### DNS Privacy

1. **DNS over HTTPS (DoH)**
   ```
   https://cloudflare-dns.com/dns-query
   https://dns.google/dns-query
   ```
   - Encrypted DNS queries over HTTPS
   - Port 443
   - Harder to block/filter

2. **DNS over TLS (DoT)**
   ```
   tls://1.1.1.1
   tls://8.8.8.8
   ```
   - Encrypted DNS over TLS
   - Port 853
   - Easier to identify and block

3. **DNSCrypt**
   - Encrypted DNS protocol
   - Authentication of resolver
   - Prevention of tampering

### DNS Attacks

1. **DNS Spoofing/Cache Poisoning**
   - Attacker provides false DNS responses
   - Poisoned cache spreads to users
   - Mitigation: DNSSEC, 0x20 bit encoding

2. **DNS Amplification DDoS**
   - Small query generates large response
   - Spoofed source IP
   - Mitigation: Rate limiting, response rate limiting

3. **DNS Tunneling**
   - Encode data in DNS queries/responses
   - Bypass firewalls
   - Detection: Analyze query patterns

4. **Domain Hijacking**
   - Unauthorized domain transfer
   - Registrar account compromise
   - Mitigation: Registry lock, 2FA

5. **DNS Rebinding**
   - Bypass same-origin policy
   - Attack local network
   - Mitigation: DNS rebinding protection

## DNS Load Balancing

### Round-Robin DNS
```
example.com.    IN    A    192.0.2.1
example.com.    IN    A    192.0.2.2
example.com.    IN    A    192.0.2.3
```
- Simple load distribution
- No health checking
- Client-side caching issues

### GeoDNS/GeoIP
```
US Users → example.com → 192.0.2.1 (US Server)
EU Users → example.com → 192.0.2.2 (EU Server)
Asia Users → example.com → 192.0.2.3 (Asia Server)
```

### Weighted DNS
```
example.com.    IN    A    192.0.2.1    ; weight=3
example.com.    IN    A    192.0.2.2    ; weight=1
```
Traffic distribution: 75% to first server, 25% to second

## DNS Providers and Services

### Public DNS Resolvers

1. **Cloudflare (1.1.1.1)**
   - Fastest performance
   - Privacy-focused
   - DNSSEC validation

2. **Google (8.8.8.8)**
   - Reliable and fast
   - Global anycast network
   - Extensive caching

3. **Quad9 (9.9.9.9)**
   - Security-focused
   - Blocks malicious domains
   - No logging policy

4. **OpenDNS (208.67.222.222)**
   - Content filtering options
   - Phishing protection
   - Enterprise features

### Managed DNS Providers

1. **Route53 (AWS)**
   - Health checking
   - Traffic policies
   - AWS integration

2. **Cloudflare DNS**
   - Fast propagation
   - DDoS protection
   - Analytics

3. **Google Cloud DNS**
   - Anycast nameservers
   - DNSSEC support
   - SLA guarantee

## DNS Configuration

### Zone File Example
```
$ORIGIN example.com.
$TTL 3600

@    IN    SOA    ns1.example.com. admin.example.com. (
            2024010101    ; Serial
            3600         ; Refresh
            1800         ; Retry
            604800       ; Expire
            86400 )      ; Minimum TTL

@           IN    NS      ns1.example.com.
@           IN    NS      ns2.example.com.
@           IN    A       93.184.216.34
@           IN    MX  10  mail.example.com.
www         IN    CNAME   example.com.
mail        IN    A       93.184.216.35
ftp         IN    A       93.184.216.36
```

### DNS Propagation
- Not instant - can take 24-48 hours
- Depends on TTL values
- Old cached records expire gradually
- Use DNS propagation checkers

## Performance Optimization

### Best Practices
1. **Minimize DNS Lookups**
   - Reduce unique hostnames
   - Use domain sharding carefully

2. **Optimize TTL Values**
   - Balance between caching and flexibility
   - Lower TTL before changes

3. **Use DNS Prefetching**
   ```html
   <link rel="dns-prefetch" href="//api.example.com">
   ```

4. **Implement DNS Failover**
   - Multiple NS records
   - Health checking
   - Automatic failover

5. **Consider Anycast DNS**
   - Same IP multiple locations
   - Automatic routing to nearest
   - Built-in redundancy

## Troubleshooting DNS

### Common Tools

1. **nslookup**
   ```bash
   nslookup example.com
   nslookup example.com 8.8.8.8
   ```

2. **dig**
   ```bash
   dig example.com
   dig @8.8.8.8 example.com
   dig +trace example.com
   dig -x 93.184.216.34  # Reverse lookup
   ```

3. **host**
   ```bash
   host example.com
   host -t MX example.com
   ```

4. **systemd-resolve**
   ```bash
   systemd-resolve --status
   systemd-resolve example.com
   ```

### Common Issues

1. **NXDOMAIN**
   - Domain doesn't exist
   - Check spelling, propagation

2. **SERVFAIL**
   - DNS server failure
   - DNSSEC validation failure

3. **Slow Resolution**
   - High latency to DNS server
   - Too many DNS lookups
   - No caching

4. **Split-Horizon DNS**
   - Different responses internal/external
   - VPN considerations

## Modern DNS Features

### DNS Service Discovery
```
_service._proto.domain.com
_http._tcp.example.com SRV 10 1 80 web.example.com
```

### Multicast DNS (mDNS)
- Local network discovery
- .local domain
- Zero configuration

### DNS-SD (DNS Service Discovery)
- Automatic service discovery
- Works with mDNS
- Used by Bonjour, Avahi

## Interview Questions

1. **Q: What happens when DNS resolution fails?**
   A: Browser shows error, fallback to hosts file, try alternate DNS servers, or connection timeout.

2. **Q: How do you reduce DNS lookup time?**
   A: DNS caching, reduce unique domains, DNS prefetching, use faster DNS servers, implement anycast.

3. **Q: What's the difference between A and CNAME records?**
   A: A record points to IP address directly; CNAME is an alias to another domain name. CNAME can't be at root domain.

4. **Q: How does DNS caching affect deployment?**
   A: Old IPs may be cached; use low TTL before changes, wait for propagation, implement gradual rollout.

5. **Q: How do you implement DNS failover?**
   A: Multiple A records, health checking, dynamic DNS updates, or use managed DNS with failover features.