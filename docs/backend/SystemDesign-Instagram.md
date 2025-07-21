# Instagram System Design - Photo Sharing Platform

## Problem Statement
Design a photo-sharing social media platform that allows users to upload, share, and discover photos with features like feeds, likes, comments, and following relationships.

## Requirements

### Functional Requirements
- User registration and authentication
- Photo upload with filters and editing
- User feed (timeline) with photos from followed users
- Like and comment on photos
- Follow/unfollow users
- Photo discovery and search
- User profiles and photo galleries
- Real-time notifications
- Direct messaging (basic)

### Non-Functional Requirements
- **Users**: 1B registered users, 500M daily active users
- **Photos**: 100M photos uploaded per day
- **Reads**: 4.6B photo views per day (100:1 read/write ratio)
- **Availability**: 99.9% uptime
- **Performance**: Feed generation < 200ms, Photo upload < 5s
- **Storage**: Petabyte scale photo storage
- **Consistency**: Eventual consistency acceptable for feeds

## Capacity Estimation

### Traffic
- **500M DAU**, each user views 50 photos = **25B photo views/day**
- **Peak traffic**: 3x average = **867K photo views/second**
- **Photo uploads**: 100M photos/day = **1,157 uploads/second**
- **Peak uploads**: **3,470 uploads/second**

### Storage
- **Average photo size**: 2MB (after compression)
- **Multiple formats**: Original + 4 different sizes = 3MB total per photo
- **Daily storage**: 100M × 3MB = **300TB/day**
- **5 years**: 300TB × 365 × 5 = **547PB**

### Bandwidth
- **Uploads**: 1,157 × 3MB = **3.47GB/second**
- **Views**: 289K × 0.5MB (avg view size) = **145GB/second**
- **Total peak**: ~**150GB/second**

## High-Level Architecture

```
[CDN] ← → [Load Balancer] ← → [API Gateway]
                                    ↓
[Photo Service] ← → [Feed Service] ← → [User Service]
        ↓                   ↓              ↓
[Media Storage] ← → [Feed Cache] ← → [User Database]
        ↓                   ↓              ↓
[Image Processing] [Notification Service] [Search Service]
```

## Core Components

### 1. Photo Service
```python
class PhotoService:
    def __init__(self):
        self.s3_client = S3Client()
        self.image_processor = ImageProcessor()
        self.cdn = CDNManager()
        
    async def upload_photo(self, user_id, photo_data, caption, location=None):
        # Generate unique photo ID
        photo_id = str(uuid.uuid4())
        
        # Process image in different sizes
        processed_images = await self.image_processor.process_image(
            photo_data, 
            sizes=['thumbnail', 'medium', 'large', 'original']
        )
        
        # Upload to distributed storage
        upload_tasks = []
        for size, image_data in processed_images.items():
            s3_key = f"photos/{user_id}/{photo_id}_{size}.jpg"
            task = self.s3_client.upload(
                bucket='instagram-photos',
                key=s3_key,
                data=image_data
            )
            upload_tasks.append(task)
        
        await asyncio.gather(*upload_tasks)
        
        # Save metadata to database
        photo_metadata = {
            'id': photo_id,
            'user_id': user_id,
            'caption': caption,
            'location': location,
            'created_at': datetime.now(),
            'like_count': 0,
            'comment_count': 0,
            'urls': {
                size: f"{self.cdn.base_url}/photos/{user_id}/{photo_id}_{size}.jpg"
                for size in processed_images.keys()
            }
        }
        
        await self.db.save_photo_metadata(photo_metadata)
        
        # Trigger feed generation for followers
        await self.feed_service.add_photo_to_followers_feed(user_id, photo_id)
        
        return photo_metadata
```

### 2. Feed Service
```python
class FeedService:
    def __init__(self):
        self.cache = RedisClient()
        self.db = DatabaseClient()
        
    async def generate_user_feed(self, user_id, limit=20, cursor=None):
        # Try cache first
        cache_key = f"feed:{user_id}"
        cached_feed = await self.cache.get(cache_key)
        
        if cached_feed and not cursor:
            return json.loads(cached_feed)
        
        # Generate feed from database
        following_users = await self.db.get_following_users(user_id)
        
        # Get recent photos from followed users
        feed_photos = await self.db.query("""
            SELECT p.*, u.username, u.profile_pic_url
            FROM photos p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id IN ({})
            AND p.created_at > NOW() - INTERVAL 7 DAY
            ORDER BY p.created_at DESC, p.like_count DESC
            LIMIT %s
        """.format(','.join(['%s'] * len(following_users))), 
        following_users + [limit])
        
        # Enrich with user interactions
        for photo in feed_photos:
            photo['user_liked'] = await self.db.has_user_liked(user_id, photo['id'])
            photo['recent_likes'] = await self.db.get_recent_likes(photo['id'], 3)
        
        # Cache feed for 15 minutes
        await self.cache.setex(cache_key, 900, json.dumps(feed_photos))
        
        return feed_photos
    
    async def add_photo_to_followers_feed(self, user_id, photo_id):
        # Get all followers
        followers = await self.db.get_followers(user_id)
        
        # Add to each follower's feed asynchronously
        tasks = []
        for follower_id in followers:
            task = self.add_to_user_feed(follower_id, photo_id)
            tasks.append(task)
        
        await asyncio.gather(*tasks, return_exceptions=True)
```

### 3. Database Schema
```sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    profile_pic_url TEXT,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    post_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- Photos table (partitioned by user_id)
CREATE TABLE photos (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    caption TEXT,
    location VARCHAR(100),
    original_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    medium_url TEXT NOT NULL,
    large_url TEXT NOT NULL,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_created_likes (created_at DESC, like_count DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) PARTITION BY HASH(user_id) PARTITIONS 100;

-- Follows relationship table
CREATE TABLE follows (
    follower_id BIGINT,
    following_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_following (following_id)
);

-- Likes table (partitioned by photo_id)
CREATE TABLE likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    photo_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_photo (user_id, photo_id),
    INDEX idx_photo_created (photo_id, created_at DESC),
    INDEX idx_user_created (user_id, created_at DESC),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) PARTITION BY HASH(photo_id) PARTITIONS 100;

-- Comments table
CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    photo_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    reply_to BIGINT NULL,  -- For nested comments
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_photo_created (photo_id, created_at),
    INDEX idx_user_created (user_id, created_at DESC),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to) REFERENCES comments(id) ON DELETE CASCADE
);
```

## Detailed Questions & Answers

### Q1: How do you handle photo upload and storage at scale?

**Answer**: Multi-tier storage strategy with CDN distribution:

**1. Image Processing Pipeline**
```python
class ImageProcessor:
    def __init__(self):
        self.sizes = {
            'thumbnail': (150, 150),
            'medium': (640, 640),
            'large': (1080, 1080),
            'original': None  # Keep original size
        }
    
    async def process_image(self, image_data, sizes):
        from PIL import Image
        import io
        
        # Load original image
        original = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if original.mode in ('RGBA', 'LA', 'P'):
            original = original.convert('RGB')
        
        processed_images = {}
        
        for size_name in sizes:
            if size_name == 'original':
                # Compress original but keep size
                processed_images[size_name] = self.compress_image(original, quality=85)
            else:
                # Resize and compress
                target_size = self.sizes[size_name]
                resized = self.smart_resize(original, target_size)
                processed_images[size_name] = self.compress_image(resized, quality=80)
        
        return processed_images
    
    def smart_resize(self, image, target_size):
        # Maintain aspect ratio while fitting in target size
        image.thumbnail(target_size, Image.Resampling.LANCZOS)
        return image
    
    def compress_image(self, image, quality=80):
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=quality, optimize=True)
        return output.getvalue()
```

**2. Distributed Storage Strategy**
```python
class PhotoStorageService:
    def __init__(self):
        self.primary_storage = S3Client(region='us-east-1')
        self.replica_storage = S3Client(region='eu-west-1')
        self.cdn = CloudFrontDistribution()
    
    async def store_photo(self, user_id, photo_id, image_variants):
        storage_tasks = []
        
        for size, image_data in image_variants.items():
            # Store in multiple regions for redundancy
            s3_key = f"photos/{user_id[:2]}/{user_id}/{photo_id}_{size}.jpg"
            
            # Primary storage
            primary_task = self.primary_storage.put_object(
                bucket='instagram-primary',
                key=s3_key,
                body=image_data,
                content_type='image/jpeg',
                cache_control='public, max-age=31536000'  # 1 year
            )
            
            # Replica storage
            replica_task = self.replica_storage.put_object(
                bucket='instagram-replica',
                key=s3_key,
                body=image_data,
                content_type='image/jpeg'
            )
            
            storage_tasks.extend([primary_task, replica_task])
        
        await asyncio.gather(*storage_tasks)
        
        # Invalidate CDN cache for immediate availability
        await self.cdn.invalidate_cache([
            f"/photos/{user_id}/{photo_id}_*.jpg"
        ])
```

**3. Progressive Upload for Better UX**
```javascript
class ProgressiveUploader {
    async uploadPhoto(file, onProgress) {
        // Upload thumbnail first for immediate preview
        const thumbnail = await this.generateThumbnail(file);
        const thumbnailResult = await this.uploadChunk(thumbnail, 'thumbnail', onProgress);
        
        // Show thumbnail immediately
        this.displayThumbnail(thumbnailResult.url);
        
        // Upload full image in background
        const fullImage = await this.compressImage(file);
        const fullResult = await this.uploadChunk(fullImage, 'full', onProgress);
        
        return {
            thumbnail: thumbnailResult.url,
            full: fullResult.url
        };
    }
    
    async uploadChunk(data, type, onProgress) {
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(data.size / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, data.size);
            const chunk = data.slice(start, end);
            
            await this.uploadSingleChunk(chunk, i, totalChunks, type);
            onProgress((i + 1) / totalChunks * 100);
        }
    }
}
```

### Q2: How do you generate and cache user feeds efficiently?

**Answer**: Multi-layer feed generation with push/pull hybrid model:

**1. Feed Generation Strategies**
```python
class FeedGenerationService:
    def __init__(self):
        self.cache = RedisCluster()
        self.db = DatabaseClient()
        
    async def get_user_feed(self, user_id, strategy='hybrid'):
        if strategy == 'pull':
            return await self.pull_model_feed(user_id)
        elif strategy == 'push':
            return await self.push_model_feed(user_id)
        else:
            return await self.hybrid_model_feed(user_id)
    
    async def hybrid_model_feed(self, user_id):
        # For users with < 1000 followers: push model
        # For celebrities with > 1000 followers: pull model
        
        follower_count = await self.db.get_follower_count(user_id)
        
        if follower_count < 1000:
            return await self.push_model_feed(user_id)
        else:
            return await self.pull_model_feed(user_id)
    
    async def push_model_feed(self, user_id):
        # Pre-computed feed stored in cache
        feed_key = f"feed:push:{user_id}"
        cached_feed = await self.cache.lrange(feed_key, 0, 19)  # Top 20
        
        if cached_feed:
            # Enrich with real-time data
            return await self.enrich_feed_items(cached_feed)
        
        # Fallback to pull model if cache miss
        return await self.pull_model_feed(user_id)
    
    async def pull_model_feed(self, user_id):
        # Generate feed on-demand
        following = await self.db.get_following_users(user_id)
        
        if not following:
            return await self.get_discover_feed(user_id)
        
        # Merge timeline from multiple users (merge k sorted lists)
        feed_posts = await self.merge_user_timelines(following, limit=20)
        
        # Cache for 10 minutes
        cache_key = f"feed:pull:{user_id}"
        await self.cache.setex(cache_key, 600, json.dumps(feed_posts))
        
        return feed_posts
```

**2. Real-time Feed Updates**
```python
class FeedUpdateService:
    async def on_new_post(self, user_id, post_id):
        # Get user's followers
        followers = await self.db.get_active_followers(user_id, limit=10000)
        
        post_data = await self.db.get_post_data(post_id)
        
        # Update feeds in batches to avoid overwhelming Redis
        batch_size = 1000
        for i in range(0, len(followers), batch_size):
            batch = followers[i:i + batch_size]
            await self.update_followers_feeds(batch, post_data)
            await asyncio.sleep(0.1)  # Prevent Redis overload
    
    async def update_followers_feeds(self, followers, post_data):
        pipeline = self.cache.pipeline()
        
        for follower_id in followers:
            feed_key = f"feed:push:{follower_id}"
            
            # Add to beginning of feed
            pipeline.lpush(feed_key, json.dumps(post_data))
            
            # Keep only latest 1000 posts
            pipeline.ltrim(feed_key, 0, 999)
            
            # Set expiration (7 days)
            pipeline.expire(feed_key, 604800)
        
        await pipeline.execute()
```

**3. Feed Ranking Algorithm**
```python
class FeedRankingService:
    def __init__(self):
        self.ml_model = MachineLearningModel()
    
    async def rank_feed_posts(self, user_id, posts):
        # Calculate engagement score for each post
        scored_posts = []
        
        for post in posts:
            score = await self.calculate_engagement_score(user_id, post)
            scored_posts.append({
                'post': post,
                'score': score
            })
        
        # Sort by score (highest first)
        scored_posts.sort(key=lambda x: x['score'], reverse=True)
        
        return [item['post'] for item in scored_posts]
    
    async def calculate_engagement_score(self, user_id, post):
        # Time decay factor (newer posts get higher score)
        time_diff = (datetime.now() - post['created_at']).total_seconds()
        time_factor = max(0, 1 - time_diff / (24 * 3600))  # Decay over 24 hours
        
        # Engagement metrics
        like_rate = post['like_count'] / max(1, time_diff / 3600)  # Likes per hour
        comment_rate = post['comment_count'] / max(1, time_diff / 3600)
        
        # User affinity (how much user interacts with this poster)
        affinity_score = await self.get_user_affinity(user_id, post['user_id'])
        
        # Combine factors
        base_score = (like_rate * 0.3 + comment_rate * 0.5 + affinity_score * 0.2)
        final_score = base_score * time_factor
        
        return final_score
    
    async def get_user_affinity(self, user_id, poster_id):
        # Calculate based on past interactions
        interactions = await self.db.query("""
            SELECT COUNT(*) as interaction_count
            FROM (
                SELECT 1 FROM likes WHERE user_id = %s AND photo_id IN (
                    SELECT id FROM photos WHERE user_id = %s
                )
                UNION ALL
                SELECT 1 FROM comments WHERE user_id = %s AND photo_id IN (
                    SELECT id FROM photos WHERE user_id = %s
                )
            ) as interactions
        """, [user_id, poster_id, user_id, poster_id])
        
        return min(1.0, interactions['interaction_count'] / 10.0)  # Cap at 1.0
```

### Q3: How do you handle the hot user problem (celebrities with millions of followers)?

**Answer**: Specialized handling for high-fanout users:

**1. Celebrity User Detection and Handling**
```python
class CelebrityUserService:
    def __init__(self):
        self.celebrity_threshold = 100000  # 100K followers
        self.cache = RedisCluster()
        
    async def is_celebrity_user(self, user_id):
        # Cache celebrity status
        cache_key = f"celebrity:{user_id}"
        is_celebrity = await self.cache.get(cache_key)
        
        if is_celebrity is None:
            follower_count = await self.db.get_follower_count(user_id)
            is_celebrity = follower_count >= self.celebrity_threshold
            await self.cache.setex(cache_key, 3600, str(is_celebrity))  # Cache 1 hour
        
        return is_celebrity == 'True'
    
    async def handle_celebrity_post(self, user_id, post_id):
        # Don't push to all followers immediately
        # Instead, use pull model with aggressive caching
        
        post_data = await self.db.get_post_data(post_id)
        
        # Cache the post globally for fast access
        global_cache_key = f"celebrity_post:{post_id}"
        await self.cache.setex(global_cache_key, 1800, json.dumps(post_data))  # 30 min
        
        # Update celebrity's own timeline cache
        celebrity_timeline_key = f"user_timeline:{user_id}"
        await self.cache.lpush(celebrity_timeline_key, post_id)
        await self.cache.ltrim(celebrity_timeline_key, 0, 99)  # Keep 100 latest
        
        # Queue for gradual follower notification
        await self.queue_follower_notifications(user_id, post_id)
```

**2. Gradual Fanout Strategy**
```python
class GradualFanoutService:
    async def queue_follower_notifications(self, celebrity_id, post_id):
        # Get followers in chunks
        total_followers = await self.db.get_follower_count(celebrity_id)
        chunk_size = 10000
        
        for offset in range(0, total_followers, chunk_size):
            # Queue each chunk for background processing
            fanout_job = {
                'celebrity_id': celebrity_id,
                'post_id': post_id,
                'offset': offset,
                'limit': chunk_size,
                'priority': 'low'  # Background processing
            }
            
            await self.job_queue.enqueue('celebrity_fanout', fanout_job)
    
    async def process_celebrity_fanout(self, job):
        followers = await self.db.get_followers_chunk(
            job['celebrity_id'], 
            job['offset'], 
            job['limit']
        )
        
        # Update feeds in smaller batches
        batch_size = 1000
        for i in range(0, len(followers), batch_size):
            batch = followers[i:i + batch_size]
            await self.update_feeds_batch(batch, job['post_id'])
            
            # Rate limiting to prevent overloading
            await asyncio.sleep(0.5)
```

**3. Celebrity Feed Optimization**
```python
class CelebrityFeedOptimization:
    async def get_celebrity_posts_for_feed(self, user_id, celebrity_users):
        # Get latest posts from celebrities user follows
        celebrity_posts = []
        
        for celebrity_id in celebrity_users:
            # Use cached timeline
            timeline_key = f"user_timeline:{celebrity_id}"
            recent_post_ids = await self.cache.lrange(timeline_key, 0, 4)  # 5 latest
            
            for post_id in recent_post_ids:
                post_data = await self.get_cached_post(post_id)
                if post_data:
                    celebrity_posts.append(post_data)
        
        # Sort by timestamp and take top posts
        celebrity_posts.sort(key=lambda x: x['created_at'], reverse=True)
        return celebrity_posts[:10]  # Top 10 celebrity posts
    
    async def get_cached_post(self, post_id):
        # Try global cache first (for celebrity posts)
        global_key = f"celebrity_post:{post_id}"
        cached = await self.cache.get(global_key)
        
        if cached:
            return json.loads(cached)
        
        # Fall back to database
        post_data = await self.db.get_post_data(post_id)
        
        # Cache if it's a popular post
        if post_data and post_data['like_count'] > 1000:
            await self.cache.setex(global_key, 900, json.dumps(post_data))
        
        return post_data
```

### Q4: How do you implement photo search and discovery?

**Answer**: Multi-faceted search with ML-powered recommendations:

**1. Search Service Architecture**
```python
class PhotoSearchService:
    def __init__(self):
        self.elasticsearch = ElasticsearchClient()
        self.ml_service = MLRecommendationService()
        
    async def search_photos(self, query, user_id, filters=None):
        search_results = []
        
        # Text-based search (captions, hashtags)
        if query:
            text_results = await self.text_search(query, filters)
            search_results.extend(text_results)
        
        # Visual similarity search (if image provided)
        if filters and 'similar_to_image' in filters:
            visual_results = await self.visual_search(
                filters['similar_to_image'], user_id
            )
            search_results.extend(visual_results)
        
        # Location-based search
        if filters and 'location' in filters:
            location_results = await self.location_search(
                filters['location'], filters.get('radius', 10)
            )
            search_results.extend(location_results)
        
        # Remove duplicates and rank
        unique_results = self.deduplicate_results(search_results)
        ranked_results = await self.rank_search_results(unique_results, user_id)
        
        return ranked_results
    
    async def text_search(self, query, filters):
        search_body = {
            "query": {
                "bool": {
                    "should": [
                        {"match": {"caption": {"query": query, "boost": 2}}},
                        {"match": {"hashtags": {"query": query, "boost": 3}}},
                        {"match": {"location": {"query": query, "boost": 1}}}
                    ],
                    "filter": []
                }
            },
            "size": 100,
            "sort": [
                {"like_count": {"order": "desc"}},
                {"created_at": {"order": "desc"}}
            ]
        }
        
        # Add filters
        if filters:
            if 'date_range' in filters:
                search_body["query"]["bool"]["filter"].append({
                    "range": {
                        "created_at": {
                            "gte": filters['date_range']['start'],
                            "lte": filters['date_range']['end']
                        }
                    }
                })
        
        results = await self.elasticsearch.search(
            index='photos', 
            body=search_body
        )
        
        return [hit['_source'] for hit in results['hits']['hits']]
```

**2. Visual Search Implementation**
```python
class VisualSearchService:
    def __init__(self):
        self.feature_extractor = CNNFeatureExtractor()
        self.vector_db = PineconeClient()  # Vector database for similarity
        
    async def index_photo_features(self, photo_id, image_url):
        # Extract visual features using pre-trained CNN
        image_data = await self.download_image(image_url)
        features = await self.feature_extractor.extract_features(image_data)
        
        # Store in vector database
        await self.vector_db.upsert(
            vectors=[{
                'id': photo_id,
                'values': features.tolist(),
                'metadata': {
                    'photo_id': photo_id,
                    'indexed_at': datetime.now().isoformat()
                }
            }]
        )
    
    async def find_similar_photos(self, query_image, top_k=20):
        # Extract features from query image
        query_features = await self.feature_extractor.extract_features(query_image)
        
        # Search for similar vectors
        results = await self.vector_db.query(
            vector=query_features.tolist(),
            top_k=top_k,
            include_metadata=True
        )
        
        similar_photos = []
        for match in results['matches']:
            photo_id = match['metadata']['photo_id']
            similarity_score = match['score']
            
            # Get full photo data
            photo_data = await self.db.get_photo_data(photo_id)
            photo_data['similarity_score'] = similarity_score
            similar_photos.append(photo_data)
        
        return similar_photos
```

**3. Personalized Discovery Feed**
```python
class DiscoveryService:
    async def generate_discovery_feed(self, user_id, limit=20):
        user_preferences = await self.get_user_preferences(user_id)
        
        # Multiple discovery strategies
        discovery_posts = []
        
        # 1. Trending posts in user's interests
        trending_posts = await self.get_trending_posts(
            user_preferences['interests'], limit//4
        )
        discovery_posts.extend(trending_posts)
        
        # 2. Posts from suggested users
        suggested_users = await self.get_suggested_users(user_id)
        for user in suggested_users[:5]:
            recent_posts = await self.db.get_user_recent_posts(user['id'], 2)
            discovery_posts.extend(recent_posts)
        
        # 3. Location-based discovery
        if user_preferences.get('location'):
            location_posts = await self.get_location_based_posts(
                user_preferences['location'], limit//4
            )
            discovery_posts.extend(location_posts)
        
        # 4. ML-recommended posts
        ml_recommendations = await self.ml_service.get_recommendations(
            user_id, limit//4
        )
        discovery_posts.extend(ml_recommendations)
        
        # Rank and deduplicate
        unique_posts = self.deduplicate_posts(discovery_posts)
        ranked_posts = await self.rank_discovery_posts(unique_posts, user_id)
        
        return ranked_posts[:limit]
    
    async def get_user_preferences(self, user_id):
        # Analyze user behavior to infer preferences
        recent_interactions = await self.db.query("""
            SELECT p.*, COUNT(*) as interaction_count
            FROM photos p
            JOIN (
                SELECT photo_id FROM likes WHERE user_id = %s
                UNION ALL
                SELECT photo_id FROM comments WHERE user_id = %s
            ) interactions ON p.id = interactions.photo_id
            WHERE p.created_at > NOW() - INTERVAL 30 DAY
            GROUP BY p.id
            ORDER BY interaction_count DESC
            LIMIT 100
        """, [user_id, user_id])
        
        # Extract hashtags, locations, etc.
        interests = self.extract_interests(recent_interactions)
        
        return {
            'interests': interests,
            'location': await self.get_user_location(user_id)
        }
```

### Q5: How do you handle real-time likes and comments?

**Answer**: Event-driven architecture with optimistic updates:

**1. Real-time Interaction Service**
```python
class InteractionService:
    def __init__(self):
        self.cache = RedisCluster()
        self.pubsub = RedisPubSub()
        self.websocket_manager = WebSocketManager()
        
    async def like_photo(self, user_id, photo_id):
        # Check if already liked
        like_key = f"like:{photo_id}:{user_id}"
        already_liked = await self.cache.exists(like_key)
        
        if already_liked:
            return await self.unlike_photo(user_id, photo_id)
        
        # Optimistic update - update cache immediately
        await self.cache.setex(like_key, 3600, "1")  # Cache for 1 hour
        
        # Increment like count in cache
        count_key = f"likes:{photo_id}"
        new_count = await self.cache.incr(count_key)
        
        # Queue for database persistence
        await self.queue_like_persistence(user_id, photo_id, 'like')
        
        # Real-time notification
        await self.notify_like(user_id, photo_id, new_count)
        
        return {'liked': True, 'count': new_count}
    
    async def queue_like_persistence(self, user_id, photo_id, action):
        interaction_event = {
            'type': action,
            'user_id': user_id,
            'photo_id': photo_id,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.message_queue.enqueue('interactions', interaction_event)
    
    async def notify_like(self, liker_id, photo_id, like_count):
        # Get photo owner
        photo_data = await self.db.get_photo_basic_data(photo_id)
        photo_owner_id = photo_data['user_id']
        
        if liker_id != photo_owner_id:  # Don't notify self
            # Real-time WebSocket notification
            notification = {
                'type': 'like',
                'photo_id': photo_id,
                'liker_id': liker_id,
                'like_count': like_count,
                'timestamp': datetime.now().isoformat()
            }
            
            await self.websocket_manager.send_to_user(photo_owner_id, notification)
            
            # Publish to all users viewing this photo
            await self.pubsub.publish(f"photo:{photo_id}:likes", json.dumps({
                'like_count': like_count,
                'latest_liker': liker_id
            }))
```

**2. Comment System with Threading**
```python
class CommentService:
    async def add_comment(self, user_id, photo_id, content, reply_to=None):
        comment_id = str(uuid.uuid4())
        
        # Create comment object
        comment = {
            'id': comment_id,
            'photo_id': photo_id,
            'user_id': user_id,
            'content': content,
            'reply_to': reply_to,
            'created_at': datetime.now(),
            'like_count': 0
        }
        
        # Store in database immediately (comments need persistence)
        await self.db.create_comment(comment)
        
        # Update comment count cache
        count_key = f"comments:{photo_id}"
        new_count = await self.cache.incr(count_key)
        
        # Cache comment for fast retrieval
        comment_key = f"comment:{comment_id}"
        await self.cache.setex(comment_key, 3600, json.dumps(comment))
        
        # Add to photo's comment list cache
        photo_comments_key = f"photo_comments:{photo_id}"
        await self.cache.lpush(photo_comments_key, comment_id)
        await self.cache.ltrim(photo_comments_key, 0, 99)  # Keep latest 100
        
        # Real-time notifications
        await self.notify_new_comment(comment, new_count)
        
        return comment
    
    async def get_photo_comments(self, photo_id, limit=20, offset=0):
        # Try cache first
        comments_key = f"photo_comments:{photo_id}"
        cached_comment_ids = await self.cache.lrange(
            comments_key, offset, offset + limit - 1
        )
        
        if cached_comment_ids:
            comments = []
            for comment_id in cached_comment_ids:
                comment_data = await self.cache.get(f"comment:{comment_id}")
                if comment_data:
                    comments.append(json.loads(comment_data))
                else:
                    # Cache miss, get from DB
                    db_comment = await self.db.get_comment(comment_id)
                    if db_comment:
                        comments.append(db_comment)
            
            return comments
        
        # Fall back to database
        return await self.db.get_photo_comments(photo_id, limit, offset)
```

**3. WebSocket Real-time Updates**
```javascript
// Client-side WebSocket handling
class RealTimeUpdates {
    constructor(userId) {
        this.userId = userId;
        this.ws = new WebSocket(`wss://api.instagram.com/realtime/${userId}`);
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'like':
                    this.updateLikeCount(data.photo_id, data.like_count);
                    break;
                case 'comment':
                    this.addNewComment(data.photo_id, data.comment);
                    break;
                case 'notification':
                    this.showNotification(data);
                    break;
            }
        };
    }
    
    updateLikeCount(photoId, newCount) {
        const likeButton = document.querySelector(`[data-photo="${photoId}"] .like-count`);
        if (likeButton) {
            likeButton.textContent = newCount;
            likeButton.classList.add('updated');
            setTimeout(() => likeButton.classList.remove('updated'), 1000);
        }
    }
    
    addNewComment(photoId, comment) {
        const commentsContainer = document.querySelector(`[data-photo="${photoId}"] .comments`);
        if (commentsContainer) {
            const commentElement = this.createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        }
    }
}
```

## Advanced Scenarios

### Scenario 1: Viral Photo (Sudden Traffic Spike)
**Challenge**: A photo goes viral and receives millions of views in minutes.

**Solution**:
1. **Auto-scaling**: Horizontal pod autoscaler based on CPU/memory
2. **CDN Caching**: Aggressive caching at edge locations
3. **Database Protection**: Circuit breakers and connection pooling
4. **Graceful Degradation**: Show cached data when live data unavailable

### Scenario 2: Celebrity Account Hack
**Challenge**: Fake content posted from verified celebrity account.

**Solution**:
1. **Anomaly Detection**: ML models to detect unusual posting patterns
2. **Content Moderation**: Automated and human review for high-profile accounts
3. **Rollback Capability**: Quick content removal and feed cleanup
4. **Security Alerts**: Real-time notifications for suspicious activity

### Scenario 3: Regional Data Compliance
**Challenge**: GDPR requires EU user data to stay in EU.

**Solution**:
1. **Geographic Sharding**: Route users to region-specific databases
2. **Data Residency**: Ensure photos stored in compliant regions
3. **Cross-border Replication**: Limited replication for disaster recovery
4. **Compliance Monitoring**: Audit trails for data movement

This Instagram system design covers photo sharing, social features, search, real-time interactions, and handles the unique challenges of a visual social media platform at scale.