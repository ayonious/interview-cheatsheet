# WebSockets

## What are WebSockets?

WebSockets provide full-duplex, bidirectional communication channels over a single TCP connection. Unlike traditional HTTP request-response model, WebSockets enable real-time, persistent connections between client and server, allowing both parties to send data at any time.

## HTTP vs WebSockets

### Traditional HTTP
```
Client → Request → Server
Client ← Response ← Server
Connection Closed
(Repeat for each interaction)
```

### WebSocket Connection
```
Client → HTTP Upgrade Request → Server
Client ← HTTP 101 Switching Protocols ← Server
Client ←→ Persistent Bidirectional Connection ←→ Server
(Connection remains open)
```

## How WebSockets Work

### Connection Establishment (Handshake)

1. **Client Sends Upgrade Request**
```http
GET /chat HTTP/1.1
Host: example.com:8080
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: http://example.com
```

2. **Server Response**
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

3. **Key Validation**
```javascript
// Server calculates accept key
const crypto = require('crypto');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const acceptKey = crypto
  .createHash('sha1')
  .update(clientKey + GUID)
  .digest('base64');
```

## WebSocket Protocol

### Frame Structure
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               | Masking-key, if MASK set to 1 |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

### Frame Types (Opcodes)
- `0x0`: Continuation frame
- `0x1`: Text frame (UTF-8)
- `0x2`: Binary frame
- `0x8`: Close connection
- `0x9`: Ping
- `0xA`: Pong

## Implementation Examples

### Client-Side (JavaScript)
```javascript
// Create WebSocket connection
const ws = new WebSocket('wss://example.com/socket');

// Connection opened
ws.addEventListener('open', (event) => {
    console.log('Connected to server');
    ws.send('Hello Server!');
});

// Listen for messages
ws.addEventListener('message', (event) => {
    console.log('Message from server:', event.data);

    // Handle different data types
    if (event.data instanceof Blob) {
        // Binary data
        const reader = new FileReader();
        reader.onload = () => console.log(reader.result);
        reader.readAsText(event.data);
    } else {
        // Text data
        const data = JSON.parse(event.data);
        handleMessage(data);
    }
});

// Connection closed
ws.addEventListener('close', (event) => {
    console.log('Disconnected:', event.code, event.reason);
});

// Error handling
ws.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});

// Send different types of data
ws.send('Plain text');
ws.send(JSON.stringify({ type: 'chat', message: 'Hello' }));
ws.send(new Blob(['Binary data']));

// Close connection
ws.close(1000, 'Normal closure');
```

### Server-Side (Node.js with ws library)
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
    console.log('Client connected from:', req.socket.remoteAddress);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to WebSocket server'
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
        console.log('Received:', data);

        // Broadcast to all clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    // Handle close
    ws.on('close', (code, reason) => {
        console.log('Client disconnected:', code, reason);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Send ping to keep connection alive
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 30000);

    ws.on('close', () => clearInterval(interval));
});
```

### Server-Side (Python with websockets)
```python
import asyncio
import websockets
import json

connected_clients = set()

async def handle_client(websocket, path):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

            # Broadcast to all clients
            disconnected = set()
            for client in connected_clients:
                try:
                    await client.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(client)

            # Remove disconnected clients
            connected_clients.difference_update(disconnected)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)

async def main():
    async with websockets.serve(handle_client, "localhost", 8080):
        await asyncio.Future()  # Run forever

asyncio.run(main())
```

## Use Cases

### Real-Time Applications
1. **Chat Applications**
   - Instant messaging
   - Group chats
   - Typing indicators
   - Read receipts

2. **Live Feeds**
   - Social media updates
   - News feeds
   - Stock tickers
   - Sports scores

3. **Collaborative Tools**
   - Google Docs-like editing
   - Whiteboard applications
   - Code collaboration
   - Project management

4. **Gaming**
   - Multiplayer games
   - Game state synchronization
   - Player movements
   - Chat systems

5. **IoT and Monitoring**
   - Sensor data streaming
   - System monitoring
   - Real-time analytics
   - Dashboard updates

6. **Financial Trading**
   - Price updates
   - Order book changes
   - Trade execution
   - Market data feeds

## WebSocket Subprotocols

### Common Subprotocols
```javascript
// Client specifies desired subprotocols
const ws = new WebSocket('wss://example.com', ['chat', 'superchat']);

// Server selects one
ws.on('open', () => {
    console.log('Selected protocol:', ws.protocol);
});
```

### STOMP (Simple Text Oriented Messaging Protocol)
```javascript
// STOMP over WebSocket
const stompClient = Stomp.over(ws);
stompClient.connect({}, (frame) => {
    stompClient.subscribe('/topic/messages', (message) => {
        console.log(JSON.parse(message.body));
    });
});
```

## Authentication and Security

### Authentication Methods

1. **Token in URL**
```javascript
const ws = new WebSocket('wss://example.com/socket?token=abc123');
```

2. **Authentication after Connection**
```javascript
ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'auth',
        token: localStorage.getItem('authToken')
    }));
});
```

3. **Cookie-Based**
```javascript
// Cookies sent automatically with upgrade request
const ws = new WebSocket('wss://example.com/socket');
```

### Security Best Practices
1. **Always use WSS (WebSocket Secure)**
   ```javascript
   // Good
   const ws = new WebSocket('wss://example.com');

   // Bad (unencrypted)
   const ws = new WebSocket('ws://example.com');
   ```

2. **Validate Origin**
   ```javascript
   wss.on('connection', (ws, req) => {
       const origin = req.headers.origin;
       if (!isAllowedOrigin(origin)) {
           ws.close(1008, 'Origin not allowed');
           return;
       }
   });
   ```

3. **Rate Limiting**
   ```javascript
   const rateLimit = new Map();

   ws.on('message', (data) => {
       const clientId = ws.id;
       const now = Date.now();
       const clientRate = rateLimit.get(clientId) || [];

       // Remove old entries
       const recentMessages = clientRate.filter(t => now - t < 60000);

       if (recentMessages.length >= 100) {
           ws.close(1008, 'Rate limit exceeded');
           return;
       }

       recentMessages.push(now);
       rateLimit.set(clientId, recentMessages);
   });
   ```

4. **Input Validation**
   ```javascript
   ws.on('message', (data) => {
       try {
           const parsed = JSON.parse(data);
           if (!validateMessage(parsed)) {
               ws.send(JSON.stringify({ error: 'Invalid message' }));
               return;
           }
       } catch (e) {
           ws.send(JSON.stringify({ error: 'Invalid JSON' }));
       }
   });
   ```

## Scaling WebSockets

### Challenges
1. **Stateful Connections**: Can't easily load balance
2. **Memory Usage**: Each connection consumes memory
3. **Horizontal Scaling**: Need session affinity
4. **Broadcasting**: Message all connected clients

### Solutions

1. **Sticky Sessions**
```nginx
upstream websocket {
    ip_hash;  # Ensures same client goes to same server
    server backend1.example.com:8080;
    server backend2.example.com:8080;
}
```

2. **Redis Pub/Sub for Broadcasting**
```javascript
const Redis = require('redis');
const pub = Redis.createClient();
const sub = Redis.createClient();

// Subscribe to Redis channel
sub.subscribe('broadcast');
sub.on('message', (channel, message) => {
    // Broadcast to all local connections
    wss.clients.forEach(client => {
        client.send(message);
    });
});

// Publish message to all servers
ws.on('message', (data) => {
    pub.publish('broadcast', data);
});
```

3. **Message Queue Integration**
```javascript
// Using RabbitMQ
const amqp = require('amqplib');

async function setupMessageQueue() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertExchange('websocket', 'fanout');
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, 'websocket', '');

    channel.consume(q.queue, (msg) => {
        broadcastToLocalClients(msg.content.toString());
    });
}
```

## Connection Management

### Heartbeat/Ping-Pong
```javascript
class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.pingInterval = null;
        this.reconnectInterval = 5000;
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            // Start heartbeat
            this.pingInterval = setInterval(() => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.ping();
                }
            }, 30000);
        });

        this.ws.on('pong', () => {
            // Server is alive
            this.lastPong = Date.now();
        });

        this.ws.on('close', () => {
            clearInterval(this.pingInterval);
            // Attempt reconnection
            setTimeout(() => this.connect(), this.reconnectInterval);
        });
    }
}
```

### Reconnection Strategy
```javascript
class ReconnectingWebSocket {
    constructor(url) {
        this.url = url;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 1000;
        this.reconnectDecay = 1.5;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('Connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const timeout = this.reconnectInterval *
                    Math.pow(this.reconnectDecay, this.reconnectAttempts);

                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.connect();
                }, timeout);
            }
        };
    }
}
```

## Performance Optimization

### Message Batching
```javascript
class BatchedWebSocket {
    constructor(ws) {
        this.ws = ws;
        this.messageQueue = [];
        this.batchInterval = 100; // ms

        setInterval(() => this.flush(), this.batchInterval);
    }

    send(message) {
        this.messageQueue.push(message);
    }

    flush() {
        if (this.messageQueue.length > 0) {
            this.ws.send(JSON.stringify({
                type: 'batch',
                messages: this.messageQueue
            }));
            this.messageQueue = [];
        }
    }
}
```

### Compression
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8080,
    perMessageDeflate: {
        zlibDeflateOptions: {
            level: 6, // Compression level
        },
        threshold: 1024, // Only compress messages > 1KB
    }
});
```

## WebSocket Alternatives

### 1. Server-Sent Events (SSE)
```javascript
// Server
app.get('/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    setInterval(() => {
        res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`);
    }, 1000);
});

// Client
const events = new EventSource('/events');
events.onmessage = (event) => {
    console.log(JSON.parse(event.data));
};
```

### 2. Long Polling
```javascript
async function longPoll() {
    try {
        const response = await fetch('/poll', {
            method: 'GET',
            timeout: 30000
        });
        const data = await response.json();
        handleData(data);
    } catch (error) {
        console.error(error);
    }
    // Immediately poll again
    longPoll();
}
```

### 3. WebRTC Data Channels
```javascript
// Peer-to-peer communication
const pc = new RTCPeerConnection();
const dataChannel = pc.createDataChannel('chat');

dataChannel.onopen = () => {
    dataChannel.send('Hello peer!');
};
```

## Common Issues and Solutions

### 1. Connection Drops
**Problem**: Connections close unexpectedly
**Solutions**:
- Implement heartbeat/ping-pong
- Add reconnection logic
- Check proxy/firewall timeout settings

### 2. Scaling Issues
**Problem**: Too many connections per server
**Solutions**:
- Use connection pooling
- Implement horizontal scaling with Redis
- Consider using WebSocket gateways

### 3. Browser Compatibility
**Problem**: Older browsers don't support WebSockets
**Solutions**:
- Use Socket.IO for fallbacks
- Implement graceful degradation
- Use polyfills

### 4. Proxy/Firewall Issues
**Problem**: Corporate proxies block WebSockets
**Solutions**:
- Use WSS on port 443
- Implement fallback to long-polling
- Use WebSocket-compatible proxies

## Monitoring and Debugging

### Key Metrics
```javascript
const metrics = {
    connections: wss.clients.size,
    messagesReceived: 0,
    messagesSent: 0,
    errors: 0,
    avgMessageSize: 0,
    peakConnections: 0
};

wss.on('connection', (ws) => {
    metrics.connections = wss.clients.size;
    metrics.peakConnections = Math.max(
        metrics.peakConnections,
        metrics.connections
    );

    ws.on('message', (data) => {
        metrics.messagesReceived++;
        metrics.avgMessageSize =
            (metrics.avgMessageSize + data.length) / 2;
    });
});
```

### Chrome DevTools
```
1. Network tab → WS filter
2. Click on WebSocket connection
3. View frames (messages) tab
4. See real-time message flow
```

## Interview Questions

1. **Q: When would you use WebSockets over HTTP?**
   A: Real-time bidirectional communication, live updates, chat applications, gaming, collaborative editing, or when you need server push capability.

2. **Q: How do you scale WebSocket servers?**
   A: Sticky sessions for load balancing, Redis pub/sub for broadcasting, horizontal scaling with message queues, connection pooling.

3. **Q: What's the difference between WebSockets and Server-Sent Events?**
   A: WebSockets are bidirectional, SSE is server-to-client only. WebSockets use a custom protocol, SSE uses HTTP. SSE auto-reconnects, WebSockets need manual reconnection.

4. **Q: How do you handle WebSocket security?**
   A: Use WSS (encrypted), validate origin headers, implement authentication, rate limiting, input validation, and CSRF protection.

5. **Q: What happens if a WebSocket connection drops?**
   A: Connection close event fires, need to implement reconnection logic, handle message queueing during disconnection, and restore state after reconnection.