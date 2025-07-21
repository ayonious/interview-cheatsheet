# Chat Application System Design (like WhatsApp)

## Problem Statement
Design a real-time messaging system that supports billions of users with instant message delivery, group conversations, and multimedia sharing capabilities.

## Requirements

### Functional Requirements
- Send and receive messages in real-time
- One-on-one and group messaging (up to 256 members)
- Message delivery status (sent, delivered, read)
- Online/offline/last seen status
- Message history and search
- File and media sharing (images, videos, documents)
- Message encryption for privacy
- Push notifications for offline users

### Non-Functional Requirements
- **Availability**: 99.99% uptime
- **Scalability**: 2B users, 100B messages per day
- **Performance**: Message delivery < 100ms
- **Consistency**: Messages delivered in order
- **Security**: End-to-end encryption
- **Storage**: 5 years message retention

## Capacity Estimation

### Traffic
- **2B total users, 1B daily active users**
- **Average 50 messages per user per day** = 50B messages/day
- **Peak usage**: 3x average = 150B messages/day = 1.74M messages/second
- **Connection management**: 500M concurrent connections

### Storage
- **Text Message**: ~100 bytes average
- **Media Message**: ~1MB average (after compression)
- **Daily Storage**: 50B × 100 bytes = 5TB/day (text only)
- **With Media**: ~50TB/day including media
- **5 Years**: ~91PB total storage needed

### Bandwidth
- **Text Messages**: 1.74M × 100 bytes = 174MB/second
- **Media Messages**: 20% of messages × 1MB = 348GB/second during peak

## High-Level Architecture

```
[Load Balancer] → [API Gateway] → [Microservices]
                                      ↓
[WebSocket Manager] ← → [Message Service] ← → [Message Queue]
                                      ↓
[User Service] ← → [Media Service] ← → [File Storage]
                                      ↓
[Notification Service] ← → [Database Cluster]
```

## Core Components

### 1. Connection Management Service
```python
class ConnectionManager:
    def __init__(self):
        self.user_connections = {}  # user_id -> websocket_connection
        self.connection_metadata = {}  # connection_id -> user_info
    
    async def handle_connection(self, websocket, user_id):
        connection_id = str(uuid.uuid4())
        self.user_connections[user_id] = websocket
        self.connection_metadata[connection_id] = {
            'user_id': user_id,
            'connected_at': datetime.now(),
            'last_activity': datetime.now()
        }
        
        # Update user online status
        await self.update_user_presence(user_id, 'online')
    
    async def send_message_to_user(self, user_id, message):
        if user_id in self.user_connections:
            await self.user_connections[user_id].send(json.dumps(message))
            return True
        return False  # User offline
```

### 2. Message Service
```python
class MessageService:
    def __init__(self):
        self.message_queue = MessageQueue()
        self.db = MessageDatabase()
    
    async def send_message(self, sender_id, recipient_id, content, message_type='text'):
        message = {
            'id': str(uuid.uuid4()),
            'conversation_id': self.get_conversation_id(sender_id, recipient_id),
            'sender_id': sender_id,
            'content': content,
            'message_type': message_type,
            'timestamp': datetime.now().isoformat(),
            'status': 'sent'
        }
        
        # Store in database
        await self.db.store_message(message)
        
        # Queue for delivery
        await self.message_queue.enqueue('message_delivery', message)
        
        return message
```

### 3. Database Schema
```sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    username VARCHAR(50),
    profile_image_url TEXT,
    last_seen TIMESTAMP,
    status ENUM('online', 'offline', 'away') DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    type ENUM('direct', 'group') NOT NULL,
    name VARCHAR(100),  -- For group chats
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Messages table (partitioned by conversation_id)
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT,
    message_type ENUM('text', 'image', 'video', 'document', 'audio') DEFAULT 'text',
    file_url TEXT,  -- For media messages
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_conversation_time (conversation_id, created_at),
    INDEX idx_sender (sender_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
) PARTITION BY HASH(conversation_id) PARTITIONS 100;

-- Message delivery status
CREATE TABLE message_status (
    message_id UUID,
    user_id BIGINT,
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Conversation participants
CREATE TABLE conversation_participants (
    conversation_id UUID,
    user_id BIGINT,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Detailed Questions & Answers

### Q1: How do you ensure real-time message delivery?

**Answer**: Multi-layered approach with WebSockets and fallback mechanisms:

**1. WebSocket Connection Management**
```python
class WebSocketManager:
    def __init__(self):
        self.connections = {}  # user_id -> websocket
        self.heartbeat_interval = 30  # seconds
    
    async def maintain_connection(self, user_id, websocket):
        try:
            while True:
                # Send heartbeat
                await websocket.ping()
                await asyncio.sleep(self.heartbeat_interval)
                
        except websockets.exceptions.ConnectionClosed:
            await self.handle_disconnect(user_id)
    
    async def send_message(self, user_id, message):
        if user_id in self.connections:
            try:
                await self.connections[user_id].send(json.dumps(message))
                return True
            except:
                # Connection broken, clean up
                await self.handle_disconnect(user_id)
        return False
```

**2. Message Queue for Reliable Delivery**
```python
import asyncio
from kafka import KafkaProducer, KafkaConsumer

class MessageDeliveryService:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['kafka1:9092', 'kafka2:9092'],
            value_serializer=lambda v: json.dumps(v).encode()
        )
        
    async def deliver_message(self, message):
        recipient_id = message['recipient_id']
        
        # Try WebSocket first
        if await self.websocket_manager.send_message(recipient_id, message):
            await self.update_status(message['id'], 'delivered')
            return
        
        # User offline - queue for later delivery
        self.producer.send('offline_messages', {
            'user_id': recipient_id,
            'message': message,
            'retry_count': 0
        })
        
        # Send push notification
        await self.notification_service.send_push(recipient_id, message)
```

**3. Offline Message Handling**
```python
class OfflineMessageHandler:
    async def handle_user_online(self, user_id):
        # Deliver queued messages when user comes online
        queued_messages = await self.get_queued_messages(user_id)
        
        for message in queued_messages:
            success = await self.websocket_manager.send_message(user_id, message)
            if success:
                await self.mark_message_delivered(message['id'])
                await self.remove_from_queue(user_id, message['id'])
```

### Q2: How do you handle group messaging efficiently?

**Answer**: Optimized fanout strategies based on group size:

**1. Small Groups (< 100 members) - Direct Fanout**
```python
class GroupMessageHandler:
    async def send_group_message(self, group_id, sender_id, message):
        participants = await self.db.get_active_participants(group_id)
        
        # Create message record
        message_record = await self.db.store_group_message(
            group_id, sender_id, message
        )
        
        # Fan out to all participants
        delivery_tasks = []
        for participant_id in participants:
            if participant_id != sender_id:  # Don't send to sender
                task = self.deliver_to_participant(participant_id, message_record)
                delivery_tasks.append(task)
        
        # Execute deliveries concurrently
        await asyncio.gather(*delivery_tasks, return_exceptions=True)
```

**2. Large Groups (100+ members) - Queue-Based Fanout**
```python
class LargeGroupHandler:
    async def send_large_group_message(self, group_id, sender_id, message):
        # Store message once
        message_record = await self.db.store_group_message(
            group_id, sender_id, message
        )
        
        # Queue fanout job
        fanout_job = {
            'group_id': group_id,
            'message_id': message_record['id'],
            'sender_id': sender_id,
            'total_participants': len(await self.db.get_participants(group_id))
        }
        
        await self.message_queue.enqueue('group_fanout', fanout_job)
        
        # Return immediately to sender
        return message_record
    
    async def process_group_fanout(self, job):
        participants = await self.db.get_active_participants(job['group_id'])
        batch_size = 1000
        
        # Process in batches to avoid overwhelming the system
        for i in range(0, len(participants), batch_size):
            batch = participants[i:i + batch_size]
            await self.fanout_to_batch(job['message_id'], batch)
            await asyncio.sleep(0.1)  # Small delay between batches
```

**3. Group Message Status Tracking**
```python
async def track_group_message_status(self, message_id, group_id):
    total_participants = await self.db.count_participants(group_id)
    
    status_summary = await self.db.query("""
        SELECT 
            status,
            COUNT(*) as count
        FROM message_status 
        WHERE message_id = %s 
        GROUP BY status
    """, message_id)
    
    return {
        'total': total_participants,
        'delivered': status_summary.get('delivered', 0),
        'read': status_summary.get('read', 0),
        'pending': total_participants - sum(status_summary.values())
    }
```

### Q3: How do you implement message ordering and consistency?

**Answer**: Vector clocks and sequence numbers for ordering:

**1. Message Sequence Numbers**
```python
class MessageOrderingService:
    def __init__(self):
        self.sequence_counters = {}  # conversation_id -> counter
        self.lock = asyncio.Lock()
    
    async def get_next_sequence(self, conversation_id):
        async with self.lock:
            if conversation_id not in self.sequence_counters:
                # Initialize from database
                last_seq = await self.db.get_last_sequence(conversation_id)
                self.sequence_counters[conversation_id] = last_seq + 1
            else:
                self.sequence_counters[conversation_id] += 1
            
            return self.sequence_counters[conversation_id]
    
    async def send_ordered_message(self, conversation_id, sender_id, content):
        sequence_num = await self.get_next_sequence(conversation_id)
        
        message = {
            'id': str(uuid.uuid4()),
            'conversation_id': conversation_id,
            'sender_id': sender_id,
            'content': content,
            'sequence_number': sequence_num,
            'timestamp': datetime.now().isoformat()
        }
        
        return await self.db.store_message(message)
```

**2. Client-Side Ordering**
```javascript
class MessageBuffer {
    constructor() {
        this.expectedSequence = {};  // conversation_id -> next expected sequence
        this.bufferedMessages = {};  // conversation_id -> [messages]
    }
    
    receiveMessage(message) {
        const conversationId = message.conversation_id;
        const expectedSeq = this.expectedSequence[conversationId] || 1;
        
        if (message.sequence_number === expectedSeq) {
            // Message is in order, process it
            this.processMessage(message);
            this.expectedSequence[conversationId] = expectedSeq + 1;
            
            // Check if any buffered messages can now be processed
            this.processBufferedMessages(conversationId);
        } else {
            // Out of order message, buffer it
            if (!this.bufferedMessages[conversationId]) {
                this.bufferedMessages[conversationId] = [];
            }
            this.bufferedMessages[conversationId].push(message);
        }
    }
    
    processBufferedMessages(conversationId) {
        const buffered = this.bufferedMessages[conversationId] || [];
        const expectedSeq = this.expectedSequence[conversationId];
        
        // Sort and process any messages that are now in order
        buffered.sort((a, b) => a.sequence_number - b.sequence_number);
        
        for (let i = 0; i < buffered.length; i++) {
            if (buffered[i].sequence_number === this.expectedSequence[conversationId]) {
                this.processMessage(buffered[i]);
                this.expectedSequence[conversationId]++;
                buffered.splice(i, 1);
                i--; // Adjust index after removal
            } else {
                break; // Stop if we hit a gap
            }
        }
    }
}
```

### Q4: How do you handle media file sharing at scale?

**Answer**: Distributed storage with CDN and optimization:

**1. Media Upload Service**
```python
class MediaUploadService:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.cdn_url = 'https://cdn.chatapp.com'
        
    async def upload_media(self, user_id, file_data, file_type):
        # Generate unique file name
        file_id = str(uuid.uuid4())
        file_extension = self.get_extension(file_type)
        s3_key = f"media/{user_id}/{file_id}.{file_extension}"
        
        # Compress/optimize based on type
        processed_data = await self.process_media(file_data, file_type)
        
        # Upload to S3 with encryption
        await self.s3_client.put_object(
            Bucket='chatapp-media',
            Key=s3_key,
            Body=processed_data,
            ContentType=file_type,
            ServerSideEncryption='AES256',
            Metadata={
                'uploaded_by': str(user_id),
                'upload_time': str(datetime.now())
            }
        )
        
        # Generate CDN URL
        media_url = f"{self.cdn_url}/{s3_key}"
        
        # Store metadata in database
        media_record = await self.db.store_media_metadata(
            file_id, user_id, s3_key, media_url, file_type, len(processed_data)
        )
        
        return media_record
    
    async def process_media(self, file_data, file_type):
        if file_type.startswith('image/'):
            return await self.compress_image(file_data)
        elif file_type.startswith('video/'):
            return await self.compress_video(file_data)
        else:
            return file_data  # Documents, audio - no compression
```

**2. Media Message Handling**
```python
async def send_media_message(self, sender_id, recipient_id, file_data, file_type):
    # Upload media first
    media_record = await self.media_service.upload_media(
        sender_id, file_data, file_type
    )
    
    # Create message with media reference
    message = {
        'id': str(uuid.uuid4()),
        'conversation_id': self.get_conversation_id(sender_id, recipient_id),
        'sender_id': sender_id,
        'message_type': 'media',
        'media_id': media_record['id'],
        'media_url': media_record['url'],
        'media_type': file_type,
        'file_size': media_record['size'],
        'thumbnail_url': media_record.get('thumbnail_url'),  # For images/videos
        'timestamp': datetime.now().isoformat()
    }
    
    return await self.send_message(message)
```

**3. Progressive Media Loading**
```javascript
class MediaMessageHandler {
    async displayMediaMessage(message) {
        const mediaContainer = document.createElement('div');
        
        if (message.media_type.startsWith('image/')) {
            // Show thumbnail first, full image on click
            const thumbnail = document.createElement('img');
            thumbnail.src = message.thumbnail_url;
            thumbnail.onclick = () => this.showFullImage(message.media_url);
            mediaContainer.appendChild(thumbnail);
            
        } else if (message.media_type.startsWith('video/')) {
            // Show video player with poster
            const video = document.createElement('video');
            video.poster = message.thumbnail_url;
            video.controls = true;
            video.preload = 'metadata';  // Only load metadata initially
            video.src = message.media_url;
            mediaContainer.appendChild(video);
        }
        
        return mediaContainer;
    }
    
    async preloadMedia(conversationId) {
        // Preload media for recent messages in background
        const recentMessages = await this.getRecentMediaMessages(conversationId, 10);
        
        for (const message of recentMessages) {
            if (message.media_type.startsWith('image/')) {
                const img = new Image();
                img.src = message.media_url;  // Triggers browser caching
            }
        }
    }
}
```

### Q5: How do you implement end-to-end encryption?

**Answer**: Signal Protocol implementation with key management:

**1. Key Generation and Exchange**
```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

class E2EEncryption:
    def __init__(self):
        self.identity_key = x25519.X25519PrivateKey.generate()
        self.public_identity_key = self.identity_key.public_key()
    
    def generate_prekeys(self, count=100):
        prekeys = []
        for i in range(count):
            private_key = x25519.X25519PrivateKey.generate()
            public_key = private_key.public_key()
            
            prekey_record = {
                'id': i,
                'private_key': private_key,
                'public_key': public_key,
                'used': False
            }
            prekeys.append(prekey_record)
        
        return prekeys
    
    def initiate_session(self, recipient_identity_key, recipient_prekey):
        # Generate ephemeral key pair
        ephemeral_key = x25519.X25519PrivateKey.generate()
        
        # Perform Triple Diffie-Hellman
        dh1 = self.identity_key.exchange(recipient_prekey)
        dh2 = ephemeral_key.exchange(recipient_identity_key)
        dh3 = ephemeral_key.exchange(recipient_prekey)
        
        # Derive root key
        root_key_material = dh1 + dh2 + dh3
        root_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'',
            info=b'TextSecure'
        ).derive(root_key_material)
        
        return {
            'root_key': root_key,
            'ephemeral_public': ephemeral_key.public_key()
        }
```

**2. Message Encryption/Decryption**
```python
from cryptography.fernet import Fernet
import base64

class MessageEncryption:
    def __init__(self, session_key):
        self.session_key = session_key
        self.cipher = Fernet(base64.urlsafe_b64encode(session_key))
    
    def encrypt_message(self, plaintext):
        encrypted_data = self.cipher.encrypt(plaintext.encode())
        return {
            'ciphertext': base64.b64encode(encrypted_data).decode(),
            'message_keys': self.get_current_message_keys()
        }
    
    def decrypt_message(self, encrypted_message):
        try:
            ciphertext = base64.b64decode(encrypted_message['ciphertext'])
            plaintext = self.cipher.decrypt(ciphertext)
            return plaintext.decode()
        except Exception:
            raise DecryptionError("Failed to decrypt message")
    
    def get_current_message_keys(self):
        # Implement Double Ratchet algorithm
        # This is simplified - real implementation would be more complex
        return {
            'chain_key': self.derive_chain_key(),
            'message_key': self.derive_message_key()
        }
```

### Q6: How do you handle message status updates efficiently?

**Answer**: Batch processing and real-time status propagation:

**1. Status Update Batching**
```python
class StatusUpdateService:
    def __init__(self):
        self.status_batch = {}
        self.batch_size = 1000
        self.flush_interval = 5  # seconds
        
    async def update_message_status(self, message_id, user_id, status):
        key = f"{message_id}:{user_id}"
        self.status_batch[key] = {
            'message_id': message_id,
            'user_id': user_id,
            'status': status,
            'timestamp': datetime.now()
        }
        
        if len(self.status_batch) >= self.batch_size:
            await self.flush_status_updates()
    
    async def flush_status_updates(self):
        if not self.status_batch:
            return
            
        updates = list(self.status_batch.values())
        self.status_batch.clear()
        
        # Batch update database
        await self.db.batch_update_status(updates)
        
        # Notify senders about status changes
        await self.notify_status_changes(updates)
    
    async def notify_status_changes(self, updates):
        # Group by message sender for efficient notifications
        sender_updates = {}
        for update in updates:
            message = await self.db.get_message(update['message_id'])
            sender_id = message['sender_id']
            
            if sender_id not in sender_updates:
                sender_updates[sender_id] = []
            sender_updates[sender_id].append(update)
        
        # Send status updates to message senders
        for sender_id, user_updates in sender_updates.items():
            await self.websocket_manager.send_status_update(sender_id, user_updates)
```

**2. Read Receipt Handling**
```python
class ReadReceiptManager:
    async def mark_conversation_read(self, user_id, conversation_id, last_read_message_id):
        # Update user's read position
        await self.db.update_read_position(user_id, conversation_id, last_read_message_id)
        
        # Find all unread messages up to this point
        unread_messages = await self.db.get_unread_messages(
            user_id, conversation_id, last_read_message_id
        )
        
        # Batch mark as read
        message_ids = [msg['id'] for msg in unread_messages]
        await self.status_service.batch_mark_read(message_ids, user_id)
        
        # Notify other participants in group chats
        if await self.is_group_conversation(conversation_id):
            await self.notify_group_read_status(conversation_id, user_id, last_read_message_id)
```

### Q7: How do you implement push notifications for offline users?

**Answer**: Multi-provider notification system with smart delivery:

**1. Notification Service Architecture**
```python
class PushNotificationService:
    def __init__(self):
        self.apns_client = APNSClient()  # iOS
        self.fcm_client = FCMClient()   # Android
        self.web_push_client = WebPushClient()  # Web browsers
        
    async def send_message_notification(self, user_id, message):
        user_devices = await self.db.get_user_devices(user_id)
        
        if not user_devices:
            return False
            
        # Prepare notification content
        notification = await self.prepare_notification(message)
        
        # Send to all user devices
        delivery_tasks = []
        for device in user_devices:
            task = self.send_to_device(device, notification)
            delivery_tasks.append(task)
        
        results = await asyncio.gather(*delivery_tasks, return_exceptions=True)
        
        # Track delivery success rates
        successful = sum(1 for result in results if result and not isinstance(result, Exception))
        await self.metrics.record_notification_delivery(user_id, len(user_devices), successful)
        
        return successful > 0
    
    async def prepare_notification(self, message):
        sender_info = await self.db.get_user_info(message['sender_id'])
        
        # Customize notification based on message type
        if message['message_type'] == 'text':
            body = message['content'][:100] + ('...' if len(message['content']) > 100 else '')
        elif message['message_type'] == 'media':
            body = f"📸 {sender_info['name']} sent a photo"
        else:
            body = f"{sender_info['name']} sent a message"
        
        return {
            'title': sender_info['name'],
            'body': body,
            'badge': await self.get_unread_count(message['recipient_id']),
            'data': {
                'conversation_id': message['conversation_id'],
                'message_id': message['id'],
                'type': 'new_message'
            }
        }
    
    async def send_to_device(self, device, notification):
        try:
            if device['platform'] == 'ios':
                return await self.apns_client.send_notification(
                    device['token'], notification
                )
            elif device['platform'] == 'android':
                return await self.fcm_client.send_notification(
                    device['token'], notification
                )
            elif device['platform'] == 'web':
                return await self.web_push_client.send_notification(
                    device['token'], notification
                )
        except Exception as e:
            # Log error and potentially remove invalid tokens
            await self.handle_notification_error(device, e)
            return False
```

**2. Smart Notification Delivery**
```python
class SmartNotificationManager:
    async def should_send_notification(self, user_id, message):
        # Check user notification preferences
        prefs = await self.db.get_notification_preferences(user_id)
        
        if not prefs['enabled']:
            return False
            
        # Check do not disturb hours
        user_timezone = prefs.get('timezone', 'UTC')
        current_time = datetime.now(pytz.timezone(user_timezone))
        
        if prefs.get('do_not_disturb'):
            dnd_start = prefs['dnd_start_time']
            dnd_end = prefs['dnd_end_time']
            
            if self.is_in_dnd_period(current_time, dnd_start, dnd_end):
                return False
        
        # Check if user is currently active
        last_activity = await self.presence_service.get_last_activity(user_id)
        if last_activity and (datetime.now() - last_activity).seconds < 30:
            return False  # User is likely actively using the app
        
        # Check message priority (e.g., group mentions)
        if await self.is_high_priority_message(message):
            return True
            
        return True
    
    async def batch_process_notifications(self):
        # Process notifications in batches to avoid overwhelming the system
        pending_notifications = await self.db.get_pending_notifications(limit=10000)
        
        for batch in self.chunks(pending_notifications, 100):
            await self.process_notification_batch(batch)
            await asyncio.sleep(0.1)  # Rate limiting
```

## Advanced Scenarios

### Scenario 1: Handling Network Partitions
**Challenge**: Users in different regions lose connectivity to each other but can still connect locally.

**Solution**:
1. **Message Queuing**: Store messages locally until connectivity restored
2. **Conflict Resolution**: Use vector clocks to resolve message ordering conflicts
3. **Eventual Consistency**: Sync messages when partition heals
4. **Status Indicators**: Show users when messages are pending sync

### Scenario 2: Celebrity User with Millions of Followers
**Challenge**: Popular user joins group chat, causing massive fanout.

**Solution**:
1. **Rate Limiting**: Limit message frequency for high-follower users
2. **Tiered Delivery**: Prioritize active users for immediate delivery
3. **Async Fanout**: Use background jobs for massive group message delivery
4. **Circuit Breakers**: Prevent system overload with automatic throttling

### Scenario 3: Regulatory Compliance (GDPR, CCPA)
**Challenge**: Handle data deletion requests while maintaining message integrity.

**Solution**:
1. **User Data Mapping**: Track all user data locations across services
2. **Cascading Deletion**: Remove user data from all systems simultaneously
3. **Message Anonymization**: Replace deleted user content with placeholders
4. **Audit Logging**: Track all data operations for compliance reporting

This comprehensive chat application design covers real-time messaging, scalability, security, and advanced scenarios commonly discussed in system design interviews.