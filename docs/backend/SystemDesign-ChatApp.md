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
```
CLASS ConnectionManager:
    INITIALIZE:
        user_connections = MAP<user_id, websocket_connection>
        connection_metadata = MAP<connection_id, user_info>
    
    FUNCTION handle_connection(websocket, user_id):
        connection_id = generate_unique_id()
        user_connections[user_id] = websocket
        connection_metadata[connection_id] = {
            user_id: user_id,
            connected_at: current_timestamp(),
            last_activity: current_timestamp()
        }
        
        UPDATE user_presence(user_id, 'online')
    
    FUNCTION send_message_to_user(user_id, message):
        IF user_id EXISTS IN user_connections:
            SEND message TO user_connections[user_id]
            RETURN success
        RETURN failure  // User offline
```

### 2. Message Service
```
CLASS MessageService:
    INITIALIZE:
        message_queue = MessageQueue()
        database = MessageDatabase()
    
    FUNCTION send_message(sender_id, recipient_id, content, message_type):
        message = {
            id: generate_unique_id(),
            conversation_id: get_conversation_id(sender_id, recipient_id),
            sender_id: sender_id,
            content: content,
            message_type: message_type,
            timestamp: current_timestamp(),
            status: 'sent'
        }
        
        // Store in database
        database.store_message(message)
        
        // Queue for delivery
        message_queue.enqueue('message_delivery', message)
        
        RETURN message
```

### 3. Database Schema
```
// Users table
TABLE users:
    id: BIGINT (PRIMARY KEY, AUTO_INCREMENT)
    phone_number: STRING (UNIQUE, NOT NULL)
    username: STRING
    profile_image_url: TEXT
    last_seen: TIMESTAMP
    status: ENUM('online', 'offline', 'away')
    created_at: TIMESTAMP (DEFAULT: CURRENT_TIME)

// Conversations table
TABLE conversations:
    id: UUID (PRIMARY KEY)
    type: ENUM('direct', 'group')
    name: STRING  // For group chats
    created_by: BIGINT
    created_at: TIMESTAMP
    updated_at: TIMESTAMP

// Messages table (partitioned by conversation_id)
TABLE messages:
    id: UUID (PRIMARY KEY)
    conversation_id: UUID (FOREIGN KEY)
    sender_id: BIGINT (FOREIGN KEY)
    content: TEXT
    message_type: ENUM('text', 'image', 'video', 'document', 'audio')
    file_url: TEXT  // For media messages
    created_at: TIMESTAMP
    edited_at: TIMESTAMP (NULLABLE)
    deleted_at: TIMESTAMP (NULLABLE)
    
    INDEXES:
        (conversation_id, created_at)
        (sender_id)
    
    PARTITIONING: HASH(conversation_id) INTO 100 PARTITIONS

// Message delivery status
TABLE message_status:
    message_id: UUID (FOREIGN KEY)
    user_id: BIGINT (FOREIGN KEY)
    status: ENUM('sent', 'delivered', 'read')
    updated_at: TIMESTAMP
    PRIMARY KEY: (message_id, user_id)

// Conversation participants
TABLE conversation_participants:
    conversation_id: UUID (FOREIGN KEY)
    user_id: BIGINT (FOREIGN KEY)
    role: ENUM('admin', 'member')
    joined_at: TIMESTAMP
    left_at: TIMESTAMP (NULLABLE)
    PRIMARY KEY: (conversation_id, user_id)
```

## Detailed Questions & Answers

### Q1: How do you ensure real-time message delivery?

**Answer**: Multi-layered approach with WebSockets and fallback mechanisms:

**1. WebSocket Connection Management**
```
CLASS WebSocketManager:
    INITIALIZE:
        connections = MAP<user_id, websocket>
        heartbeat_interval = 30 seconds
    
    FUNCTION maintain_connection(user_id, websocket):
        TRY:
            WHILE connection_active:
                // Send heartbeat
                SEND ping TO websocket
                WAIT heartbeat_interval
        CATCH connection_closed:
            CALL handle_disconnect(user_id)
    
    FUNCTION send_message(user_id, message):
        IF user_id EXISTS IN connections:
            TRY:
                SEND message TO connections[user_id]
                RETURN success
            CATCH connection_error:
                // Connection broken, clean up
                CALL handle_disconnect(user_id)
        RETURN failure
```

**2. Message Queue for Reliable Delivery**
```
CLASS MessageDeliveryService:
    INITIALIZE:
        message_queue = MessageQueue(servers: [kafka1, kafka2])
        
    FUNCTION deliver_message(message):
        recipient_id = message.recipient_id
        
        // Try WebSocket first
        IF websocket_manager.send_message(recipient_id, message):
            update_status(message.id, 'delivered')
            RETURN
        
        // User offline - queue for later delivery
        message_queue.enqueue('offline_messages', {
            user_id: recipient_id,
            message: message,
            retry_count: 0
        })
        
        // Send push notification
        notification_service.send_push(recipient_id, message)
```

**3. Offline Message Handling**
```
CLASS OfflineMessageHandler:
    FUNCTION handle_user_online(user_id):
        // Deliver queued messages when user comes online
        queued_messages = get_queued_messages(user_id)
        
        FOR EACH message IN queued_messages:
            success = websocket_manager.send_message(user_id, message)
            IF success:
                mark_message_delivered(message.id)
                remove_from_queue(user_id, message.id)
```

### Q2: How do you handle group messaging efficiently?

**Answer**: Optimized fanout strategies based on group size:

**1. Small Groups (< 100 members) - Direct Fanout**
```
CLASS GroupMessageHandler:
    FUNCTION send_group_message(group_id, sender_id, message):
        participants = database.get_active_participants(group_id)
        
        // Create message record
        message_record = database.store_group_message(group_id, sender_id, message)
        
        // Fan out to all participants
        delivery_tasks = []
        FOR EACH participant_id IN participants:
            IF participant_id != sender_id:  // Don't send to sender
                task = deliver_to_participant(participant_id, message_record)
                ADD task TO delivery_tasks
        
        // Execute deliveries concurrently
        EXECUTE ALL delivery_tasks IN PARALLEL
```

**2. Large Groups (100+ members) - Queue-Based Fanout**
```
CLASS LargeGroupHandler:
    FUNCTION send_large_group_message(group_id, sender_id, message):
        // Store message once
        message_record = database.store_group_message(group_id, sender_id, message)
        
        // Queue fanout job
        fanout_job = {
            group_id: group_id,
            message_id: message_record.id,
            sender_id: sender_id,
            total_participants: COUNT(database.get_participants(group_id))
        }
        
        message_queue.enqueue('group_fanout', fanout_job)
        
        // Return immediately to sender
        RETURN message_record
    
    FUNCTION process_group_fanout(job):
        participants = database.get_active_participants(job.group_id)
        batch_size = 1000
        
        // Process in batches to avoid overwhelming the system
        FOR i = 0 TO LENGTH(participants) STEP batch_size:
            batch = participants[i : i + batch_size]
            fanout_to_batch(job.message_id, batch)
            WAIT 0.1 seconds  // Small delay between batches
```

**3. Group Message Status Tracking**
```
FUNCTION track_group_message_status(message_id, group_id):
    total_participants = database.count_participants(group_id)
    
    status_summary = database.query("
        SELECT status, COUNT(*) as count
        FROM message_status 
        WHERE message_id = message_id
        GROUP BY status
    ")
    
    RETURN {
        total: total_participants,
        delivered: status_summary['delivered'] OR 0,
        read: status_summary['read'] OR 0,
        pending: total_participants - SUM(status_summary.values())
    }
```

### Q3: How do you implement message ordering and consistency?

**Answer**: Vector clocks and sequence numbers for ordering:

**1. Message Sequence Numbers**
```
CLASS MessageOrderingService:
    INITIALIZE:
        sequence_counters = MAP<conversation_id, counter>
        lock = MUTEX
    
    FUNCTION get_next_sequence(conversation_id):
        ACQUIRE lock:
            IF conversation_id NOT IN sequence_counters:
                // Initialize from database
                last_seq = database.get_last_sequence(conversation_id)
                sequence_counters[conversation_id] = last_seq + 1
            ELSE:
                sequence_counters[conversation_id] = sequence_counters[conversation_id] + 1
            
            RETURN sequence_counters[conversation_id]
    
    FUNCTION send_ordered_message(conversation_id, sender_id, content):
        sequence_num = get_next_sequence(conversation_id)
        
        message = {
            id: generate_unique_id(),
            conversation_id: conversation_id,
            sender_id: sender_id,
            content: content,
            sequence_number: sequence_num,
            timestamp: current_timestamp()
        }
        
        RETURN database.store_message(message)
```

**2. Client-Side Ordering**
```
CLASS MessageBuffer:
    INITIALIZE:
        expected_sequence = MAP<conversation_id, next_expected_sequence>
        buffered_messages = MAP<conversation_id, LIST<message>>
    
    FUNCTION receive_message(message):
        conversation_id = message.conversation_id
        expected_seq = expected_sequence[conversation_id] OR 1
        
        IF message.sequence_number == expected_seq:
            // Message is in order, process it
            process_message(message)
            expected_sequence[conversation_id] = expected_seq + 1
            
            // Check if any buffered messages can now be processed
            process_buffered_messages(conversation_id)
        ELSE:
            // Out of order message, buffer it
            IF conversation_id NOT IN buffered_messages:
                buffered_messages[conversation_id] = []
            buffered_messages[conversation_id].ADD(message)
    
    FUNCTION process_buffered_messages(conversation_id):
        buffered = buffered_messages[conversation_id] OR []
        expected_seq = expected_sequence[conversation_id]
        
        // Sort and process any messages that are now in order
        SORT buffered BY sequence_number ASCENDING
        
        FOR i = 0 TO LENGTH(buffered):
            IF buffered[i].sequence_number == expected_sequence[conversation_id]:
                process_message(buffered[i])
                expected_sequence[conversation_id]++
                REMOVE buffered[i]
                i--  // Adjust index after removal
            ELSE:
                BREAK  // Stop if we hit a gap
```

### Q4: How do you handle media file sharing at scale?

**Answer**: Distributed storage with CDN and optimization:

**1. Media Upload Service**
```
CLASS MediaUploadService:
    INITIALIZE:
        cloud_storage_client = CloudStorageClient()
        cdn_url = 'https://cdn.chatapp.com'
        
    FUNCTION upload_media(user_id, file_data, file_type):
        // Generate unique file name
        file_id = generate_unique_id()
        file_extension = get_extension(file_type)
        storage_key = "media/" + user_id + "/" + file_id + "." + file_extension
        
        // Compress/optimize based on type
        processed_data = process_media(file_data, file_type)
        
        // Upload to cloud storage with encryption
        cloud_storage_client.upload_object({
            bucket: 'chatapp-media',
            key: storage_key,
            data: processed_data,
            content_type: file_type,
            encryption: 'AES256',
            metadata: {
                uploaded_by: user_id,
                upload_time: current_timestamp()
            }
        })
        
        // Generate CDN URL
        media_url = cdn_url + "/" + storage_key
        
        // Store metadata in database
        media_record = database.store_media_metadata(
            file_id, user_id, storage_key, media_url, file_type, SIZE(processed_data)
        )
        
        RETURN media_record
    
    FUNCTION process_media(file_data, file_type):
        IF file_type STARTS_WITH 'image/':
            RETURN compress_image(file_data)
        ELSE IF file_type STARTS_WITH 'video/':
            RETURN compress_video(file_data)
        ELSE:
            RETURN file_data  // Documents, audio - no compression
```

**2. Media Message Handling**
```
FUNCTION send_media_message(sender_id, recipient_id, file_data, file_type):
    // Upload media first
    media_record = media_service.upload_media(sender_id, file_data, file_type)
    
    // Create message with media reference
    message = {
        id: generate_unique_id(),
        conversation_id: get_conversation_id(sender_id, recipient_id),
        sender_id: sender_id,
        message_type: 'media',
        media_id: media_record.id,
        media_url: media_record.url,
        media_type: file_type,
        file_size: media_record.size,
        thumbnail_url: media_record.thumbnail_url,  // For images/videos
        timestamp: current_timestamp()
    }
    
    RETURN send_message(message)
```

**3. Progressive Media Loading**
```
CLASS MediaMessageHandler:
    FUNCTION display_media_message(message):
        media_container = CREATE_UI_ELEMENT('div')
        
        IF message.media_type STARTS_WITH 'image/':
            // Show thumbnail first, full image on click
            thumbnail = CREATE_UI_ELEMENT('img')
            thumbnail.source = message.thumbnail_url
            thumbnail.on_click = show_full_image(message.media_url)
            media_container.ADD_CHILD(thumbnail)
            
        ELSE IF message.media_type STARTS_WITH 'video/':
            // Show video player with poster
            video = CREATE_UI_ELEMENT('video')
            video.poster = message.thumbnail_url
            video.controls = true
            video.preload = 'metadata'  // Only load metadata initially
            video.source = message.media_url
            media_container.ADD_CHILD(video)
        
        RETURN media_container
    
    FUNCTION preload_media(conversation_id):
        // Preload media for recent messages in background
        recent_messages = get_recent_media_messages(conversation_id, 10)
        
        FOR EACH message IN recent_messages:
            IF message.media_type STARTS_WITH 'image/':
                // Triggers browser/client caching
                PRELOAD_IMAGE(message.media_url)
```

### Q5: How do you implement end-to-end encryption?

**Answer**: Signal Protocol implementation with key management:

**1. Key Generation and Exchange**
```
CLASS E2EEncryption:
    INITIALIZE:
        identity_key = GENERATE_PRIVATE_KEY(X25519)
        public_identity_key = GET_PUBLIC_KEY(identity_key)
    
    FUNCTION generate_prekeys(count):
        prekeys = []
        FOR i = 0 TO count:
            private_key = GENERATE_PRIVATE_KEY(X25519)
            public_key = GET_PUBLIC_KEY(private_key)
            
            prekey_record = {
                id: i,
                private_key: private_key,
                public_key: public_key,
                used: false
            }
            prekeys.ADD(prekey_record)
        
        RETURN prekeys
    
    FUNCTION initiate_session(recipient_identity_key, recipient_prekey):
        // Generate ephemeral key pair
        ephemeral_key = GENERATE_PRIVATE_KEY(X25519)
        
        // Perform Triple Diffie-Hellman
        dh1 = DIFFIE_HELLMAN_EXCHANGE(identity_key, recipient_prekey)
        dh2 = DIFFIE_HELLMAN_EXCHANGE(ephemeral_key, recipient_identity_key)
        dh3 = DIFFIE_HELLMAN_EXCHANGE(ephemeral_key, recipient_prekey)
        
        // Derive root key
        root_key_material = CONCATENATE(dh1, dh2, dh3)
        root_key = DERIVE_KEY_HKDF(root_key_material, algorithm: SHA256, length: 32)
        
        RETURN {
            root_key: root_key,
            ephemeral_public: GET_PUBLIC_KEY(ephemeral_key)
        }
```

**2. Message Encryption/Decryption**
```
CLASS MessageEncryption:
    INITIALIZE:
        session_key = PROVIDED_SESSION_KEY
        cipher = CREATE_CIPHER(session_key)
    
    FUNCTION encrypt_message(plaintext):
        encrypted_data = cipher.encrypt(plaintext)
        RETURN {
            ciphertext: BASE64_ENCODE(encrypted_data),
            message_keys: get_current_message_keys()
        }
    
    FUNCTION decrypt_message(encrypted_message):
        TRY:
            ciphertext = BASE64_DECODE(encrypted_message.ciphertext)
            plaintext = cipher.decrypt(ciphertext)
            RETURN plaintext
        CATCH decryption_error:
            THROW DecryptionError("Failed to decrypt message")
    
    FUNCTION get_current_message_keys():
        // Implement Double Ratchet algorithm
        // This is simplified - real implementation would be more complex
        RETURN {
            chain_key: derive_chain_key(),
            message_key: derive_message_key()
        }
```

### Q6: How do you handle message status updates efficiently?

**Answer**: Batch processing and real-time status propagation:

**1. Status Update Batching**
```
CLASS StatusUpdateService:
    INITIALIZE:
        status_batch = MAP<string, status_update>
        batch_size = 1000
        flush_interval = 5 seconds
        
    FUNCTION update_message_status(message_id, user_id, status):
        key = message_id + ":" + user_id
        status_batch[key] = {
            message_id: message_id,
            user_id: user_id,
            status: status,
            timestamp: current_timestamp()
        }
        
        IF SIZE(status_batch) >= batch_size:
            flush_status_updates()
    
    FUNCTION flush_status_updates():
        IF status_batch IS EMPTY:
            RETURN
            
        updates = VALUES(status_batch)
        CLEAR status_batch
        
        // Batch update database
        database.batch_update_status(updates)
        
        // Notify senders about status changes
        notify_status_changes(updates)
    
    FUNCTION notify_status_changes(updates):
        // Group by message sender for efficient notifications
        sender_updates = MAP<sender_id, LIST<update>>
        FOR EACH update IN updates:
            message = database.get_message(update.message_id)
            sender_id = message.sender_id
            
            IF sender_id NOT IN sender_updates:
                sender_updates[sender_id] = []
            sender_updates[sender_id].ADD(update)
        
        // Send status updates to message senders
        FOR EACH (sender_id, user_updates) IN sender_updates:
            websocket_manager.send_status_update(sender_id, user_updates)
```

**2. Read Receipt Handling**
```
CLASS ReadReceiptManager:
    FUNCTION mark_conversation_read(user_id, conversation_id, last_read_message_id):
        // Update user's read position
        database.update_read_position(user_id, conversation_id, last_read_message_id)
        
        // Find all unread messages up to this point
        unread_messages = database.get_unread_messages(
            user_id, conversation_id, last_read_message_id
        )
        
        // Batch mark as read
        message_ids = EXTRACT_IDS(unread_messages)
        status_service.batch_mark_read(message_ids, user_id)
        
        // Notify other participants in group chats
        IF is_group_conversation(conversation_id):
            notify_group_read_status(conversation_id, user_id, last_read_message_id)
```

### Q7: How do you implement push notifications for offline users?

**Answer**: Multi-provider notification system with smart delivery:

**1. Notification Service Architecture**
```
CLASS PushNotificationService:
    INITIALIZE:
        apns_client = APNSClient()  // iOS
        fcm_client = FCMClient()   // Android
        web_push_client = WebPushClient()  // Web browsers
        
    FUNCTION send_message_notification(user_id, message):
        user_devices = database.get_user_devices(user_id)
        
        IF user_devices IS EMPTY:
            RETURN false
            
        // Prepare notification content
        notification = prepare_notification(message)
        
        // Send to all user devices
        delivery_tasks = []
        FOR EACH device IN user_devices:
            task = send_to_device(device, notification)
            delivery_tasks.ADD(task)
        
        results = EXECUTE_ALL_PARALLEL(delivery_tasks)
        
        // Track delivery success rates
        successful = COUNT_SUCCESSFUL(results)
        metrics.record_notification_delivery(user_id, SIZE(user_devices), successful)
        
        RETURN successful > 0
    
    FUNCTION prepare_notification(message):
        sender_info = database.get_user_info(message.sender_id)
        
        // Customize notification based on message type
        IF message.message_type == 'text':
            body = TRUNCATE(message.content, 100)
        ELSE IF message.message_type == 'media':
            body = "📸 " + sender_info.name + " sent a photo"
        ELSE:
            body = sender_info.name + " sent a message"
        
        RETURN {
            title: sender_info.name,
            body: body,
            badge: get_unread_count(message.recipient_id),
            data: {
                conversation_id: message.conversation_id,
                message_id: message.id,
                type: 'new_message'
            }
        }
    
    FUNCTION send_to_device(device, notification):
        TRY:
            IF device.platform == 'ios':
                RETURN apns_client.send_notification(device.token, notification)
            ELSE IF device.platform == 'android':
                RETURN fcm_client.send_notification(device.token, notification)
            ELSE IF device.platform == 'web':
                RETURN web_push_client.send_notification(device.token, notification)
        CATCH exception:
            // Log error and potentially remove invalid tokens
            handle_notification_error(device, exception)
            RETURN false
```

**2. Smart Notification Delivery**
```
CLASS SmartNotificationManager:
    FUNCTION should_send_notification(user_id, message):
        // Check user notification preferences
        prefs = database.get_notification_preferences(user_id)
        
        IF NOT prefs.enabled:
            RETURN false
            
        // Check do not disturb hours
        user_timezone = prefs.timezone OR 'UTC'
        current_time = GET_CURRENT_TIME(user_timezone)
        
        IF prefs.do_not_disturb:
            dnd_start = prefs.dnd_start_time
            dnd_end = prefs.dnd_end_time
            
            IF is_in_dnd_period(current_time, dnd_start, dnd_end):
                RETURN false
        
        // Check if user is currently active
        last_activity = presence_service.get_last_activity(user_id)
        IF last_activity AND (current_time - last_activity) < 30 seconds:
            RETURN false  // User is likely actively using the app
        
        // Check message priority (e.g., group mentions)
        IF is_high_priority_message(message):
            RETURN true
            
        RETURN true
    
    FUNCTION batch_process_notifications():
        // Process notifications in batches to avoid overwhelming the system
        pending_notifications = database.get_pending_notifications(limit: 10000)
        
        FOR EACH batch IN CHUNKS(pending_notifications, 100):
            process_notification_batch(batch)
            WAIT 0.1 seconds  // Rate limiting
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