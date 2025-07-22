# Ride Sharing System Design (like Uber)

## Problem Statement
Design a ride-sharing platform that efficiently matches riders with drivers, handles real-time location tracking, pricing, payments, and ensures scalability across multiple cities worldwide.

## Requirements

### Functional Requirements
- User registration (riders and drivers)
- Real-time driver location tracking and updates
- Ride request and matching with nearby drivers
- Dynamic pricing based on demand/supply
- Route navigation and ETA calculation
- Trip tracking and completion
- Payment processing and splitting
- Rating and review system
- Trip history and receipts
- Driver earnings and analytics

### Non-Functional Requirements
- **Users**: 100M riders, 10M drivers globally
- **Requests**: 1M ride requests per day
- **Availability**: 99.9% uptime
- **Performance**: Driver matching < 5 seconds, location updates < 1 second
- **Scalability**: Handle surge pricing during peak hours
- **Consistency**: Eventually consistent for location data, strong consistency for payments

## Capacity Estimation

### Traffic
- **1M ride requests/day** = ~12 requests/second average
- **Peak hours**: 5x average = **60 requests/second**
- **Location updates**: 10M drivers × 1 update/4 seconds = **2.5M updates/second**
- **Concurrent trips**: ~100K trips at any given time

### Storage
- **User profiles**: 110M users × 1KB = **110GB**
- **Trip records**: 1M trips/day × 2KB × 365 days × 5 years = **3.65TB**
- **Location data**: Hot data (24 hours) = 2.5M × 24 × 3600 × 100 bytes = **21.6TB/day**

### Database Operations
- **Reads**: Location queries, driver searches = **10K QPS**
- **Writes**: Location updates, trip updates = **5K QPS**

## High-Level Architecture

```
[Mobile Apps] ← → [Load Balancer] ← → [API Gateway] ← → [Microservices]
                                                           ↓
[Location Service] ← → [Matching Service] ← → [Trip Service] ← → [Payment Service]
        ↓                      ↓                   ↓                    ↓
[Redis/Geohash] ← → [QuadTree/Database] ← → [Trip Database] ← → [Payment Gateway]
        ↓                      ↓                   ↓                    ↓
[Maps Service] ← → [Pricing Service] ← → [Notification Service] ← → [Analytics]
```

## Core Components

### 1. Location Service
```
CLASS LocationService:
    INITIALIZE:
        cache_client = CacheClient()
        location_ttl = 300  // 5 minutes
        
    FUNCTION update_driver_location(driver_id, latitude, longitude, heading):
        location_data = {
            driver_id: driver_id,
            lat: latitude,
            lng: longitude,
            heading: heading,
            timestamp: current_timestamp(),
            status: get_driver_status(driver_id)
        }
        
        // Store in cache with geospatial indexing
        cache_key = "driver_locations:" + driver_id
        cache_client.set_with_expiry(
            cache_key, 
            location_ttl, 
            to_json(location_data)
        )
        
        // Add to geospatial index for nearby driver queries
        cache_client.geo_add(
            'active_drivers',
            longitude, latitude, driver_id
        )
        
        // Update in spatial index for efficient spatial queries
        spatial_index_service.update_location(driver_id, latitude, longitude)
        
        RETURN location_data
    
    FUNCTION find_nearby_drivers(latitude, longitude, radius_km, limit):
        // Use geospatial query for fast nearby driver lookup
        nearby_drivers = cache_client.geo_radius(
            'active_drivers',
            longitude, latitude,
            radius_km, unit: 'km',
            with_distance: true,
            with_coordinates: true,
            sort: 'ASC',
            count: limit
        )
        
        // Enrich with driver details
        driver_details = []
        FOR EACH driver_data IN nearby_drivers:
            driver_id = driver_data.id
            distance = driver_data.distance
            coordinates = driver_data.coordinates
            
            // Get additional driver info
            driver_info = get_driver_details(driver_id)
            driver_info.UPDATE({
                distance_km: distance,
                current_lat: coordinates.lat,
                current_lng: coordinates.lng
            })
            
            driver_details.ADD(driver_info)
        
        RETURN driver_details
```

### 2. Matching Service
```
CLASS RideMatchingService:
    INITIALIZE:
        location_service = LocationService()
        pricing_service = PricingService()
        notification_service = NotificationService()
        
    FUNCTION request_ride(rider_id, pickup_location, destination, ride_type):
        // Create ride request
        ride_request = {
            id: generate_unique_id(),
            rider_id: rider_id,
            pickup_lat: pickup_location.lat,
            pickup_lng: pickup_location.lng,
            destination_lat: destination.lat,
            destination_lng: destination.lng,
            ride_type: ride_type,
            status: 'searching',
            created_at: current_timestamp(),
            expires_at: current_timestamp() + 5 minutes
        }
        
        // Store ride request
        database.save_ride_request(ride_request)
        
        // Find available drivers
        available_drivers = find_suitable_drivers(pickup_location, ride_type)
        
        IF available_drivers IS EMPTY:
            RETURN {
                status: 'no_drivers_available',
                estimated_wait: estimate_wait_time(pickup_location)
            }
        
        // Start matching process
        match_result = match_with_drivers(ride_request, available_drivers)
        
        RETURN match_result
    
    FUNCTION find_suitable_drivers(pickup_location, ride_type):
        // Get nearby drivers
        nearby_drivers = location_service.find_nearby_drivers(
            pickup_location.lat, 
            pickup_location.lng,
            radius_km: 10,
            limit: 50
        )
        
        // Filter suitable drivers
        suitable_drivers = []
        FOR EACH driver IN nearby_drivers:
            IF is_driver_suitable(driver, ride_type):
                // Calculate ETA to pickup
                eta = maps_service.calculate_eta(
                    FROM: (driver.current_lat, driver.current_lng),
                    TO: (pickup_location.lat, pickup_location.lng)
                )
                
                driver.pickup_eta_minutes = eta
                suitable_drivers.ADD(driver)
        
        // Sort by ETA and rating
        SORT suitable_drivers BY (pickup_eta_minutes ASC, rating DESC)
        
        RETURN suitable_drivers[0:10]  // Top 10 candidates
    
    FUNCTION match_with_drivers(ride_request, drivers):
        // Sequential matching - try drivers one by one
        FOR EACH driver IN drivers:
            // Send ride request to driver
            notification_sent = notification_service.send_ride_request(
                driver.id, ride_request
            )
            
            IF notification_sent:
                // Wait for driver response (with timeout)
                response = wait_for_driver_response(
                    driver.id, 
                    ride_request.id,
                    timeout: 15 seconds
                )
                
                IF response == 'accepted':
                    // Match successful
                    RETURN finalize_match(ride_request, driver)
                ELSE IF response == 'declined':
                    // Try next driver
                    CONTINUE
                ELSE:
                    // Timeout - try next driver
                    CONTINUE
        
        // No drivers accepted
        RETURN {
            status: 'no_match_found',
            message: 'No drivers accepted the ride request'
        }
    
    FUNCTION finalize_match(ride_request, driver):
        // Create trip record
        trip = {
            id: generate_unique_id(),
            rider_id: ride_request.rider_id,
            driver_id: driver.id,
            pickup_lat: ride_request.pickup_lat,
            pickup_lng: ride_request.pickup_lng,
            destination_lat: ride_request.destination_lat,
            destination_lng: ride_request.destination_lng,
            status: 'driver_assigned',
            estimated_pickup_time: current_timestamp() + driver.pickup_eta_minutes,
            created_at: current_timestamp()
        }
        
        database.create_trip(trip)
        
        // Update driver status
        database.update_driver_status(driver.id, 'en_route_to_pickup')
        
        // Notify both parties
        notification_service.notify_match_success(trip)
        
        RETURN {
            status: 'matched',
            trip_id: trip.id,
            driver: driver,
            estimated_pickup_time: trip.estimated_pickup_time
        }
```

### 3. Pricing Service
```
CLASS PricingService:
    INITIALIZE:
        base_fare = 2.50
        per_mile_rate = 1.75
        per_minute_rate = 0.35
        surge_multiplier_cache = MAP()
        
    FUNCTION calculate_trip_price(pickup_location, destination, ride_type):
        // Calculate distance and time
        route_info = maps_service.get_route_info(pickup_location, destination)
        
        distance_miles = route_info.distance_km * 0.621371
        estimated_duration_minutes = route_info.duration_seconds / 60
        
        // Base calculation
        base_price = base_fare
        distance_price = distance_miles * per_mile_rate
        time_price = estimated_duration_minutes * per_minute_rate
        
        subtotal = base_price + distance_price + time_price
        
        // Apply ride type multiplier
        type_multiplier = get_ride_type_multiplier(ride_type)
        subtotal = subtotal * type_multiplier
        
        // Apply surge pricing
        surge_multiplier = get_surge_multiplier(pickup_location)
        final_price = subtotal * surge_multiplier
        
        RETURN {
            base_fare: base_price,
            distance_fare: distance_price,
            time_fare: time_price,
            subtotal: subtotal,
            surge_multiplier: surge_multiplier,
            total_price: final_price,
            currency: 'USD'
        }
    
    FUNCTION get_surge_multiplier(location):
        // Calculate surge based on supply/demand ratio
        grid_id = get_grid_id(location.lat, location.lng)
        
        // Check cache first
        cache_key = "surge:" + grid_id
        cached_surge = surge_multiplier_cache.get(cache_key)
        IF cached_surge EXISTS AND cached_surge.expires > current_timestamp():
            RETURN cached_surge.multiplier
        
        // Calculate current supply/demand
        supply_demand = calculate_supply_demand(grid_id)
        
        IF supply_demand.demand == 0:
            surge_multiplier = 1.0
        ELSE:
            ratio = supply_demand.supply / supply_demand.demand
            
            IF ratio >= 1.0:
                surge_multiplier = 1.0  // No surge
            ELSE IF ratio >= 0.5:
                surge_multiplier = 1.2
            ELSE IF ratio >= 0.3:
                surge_multiplier = 1.5
            ELSE IF ratio >= 0.1:
                surge_multiplier = 2.0
            ELSE:
                surge_multiplier = 3.0  // Maximum surge
        
        // Cache for 2 minutes
        surge_multiplier_cache[cache_key] = {
            multiplier: surge_multiplier,
            expires: current_timestamp() + 120
        }
        
        RETURN surge_multiplier
    
    FUNCTION calculate_supply_demand(grid_id):
        // Get grid bounds
        grid_bounds = get_grid_bounds(grid_id)
        
        // Count available drivers in grid
        available_drivers = location_service.count_drivers_in_area(
            grid_bounds, status: 'available'
        )
        
        // Count pending ride requests in grid
        pending_requests = database.count_pending_requests_in_area(grid_bounds)
        
        RETURN {
            supply: available_drivers,
            demand: pending_requests
        }
```

### 4. Database Schema
```
// Users table
TABLE users:
    id: BIGINT (PRIMARY KEY, AUTO_INCREMENT)
    phone_number: STRING(15) (UNIQUE, NOT NULL)
    email: STRING(255) (UNIQUE)
    first_name: STRING(50)
    last_name: STRING(50)
    user_type: ENUM('rider', 'driver', 'both') (DEFAULT: 'rider')
    profile_image_url: TEXT
    created_at: TIMESTAMP (DEFAULT: CURRENT_TIME)
    
    INDEXES:
        (phone_number)
        (email)

// Drivers table (additional driver-specific info)
TABLE drivers:
    user_id: BIGINT (PRIMARY KEY, FOREIGN KEY)
    license_number: STRING(50) (UNIQUE, NOT NULL)
    vehicle_make: STRING(50)
    vehicle_model: STRING(50)
    vehicle_year: YEAR
    vehicle_color: STRING(30)
    license_plate: STRING(20)
    status: ENUM('available', 'busy', 'offline') (DEFAULT: 'offline')
    current_lat: DECIMAL(10, 8)
    current_lng: DECIMAL(11, 8)
    rating: DECIMAL(3, 2) (DEFAULT: 5.00)
    total_trips: INTEGER (DEFAULT: 0)
    earnings_total: DECIMAL(10, 2) (DEFAULT: 0)
    last_location_update: TIMESTAMP
    created_at: TIMESTAMP (DEFAULT: CURRENT_TIME)
    
    INDEXES:
        (status, current_lat, current_lng)
        (rating)

// Trips table (partitioned by created_at)
TABLE trips:
    id: STRING(36) (PRIMARY KEY)
    rider_id: BIGINT (FOREIGN KEY)
    driver_id: BIGINT (FOREIGN KEY)
    pickup_lat: DECIMAL(10, 8) (NOT NULL)
    pickup_lng: DECIMAL(11, 8) (NOT NULL)
    pickup_address: TEXT
    destination_lat: DECIMAL(10, 8)
    destination_lng: DECIMAL(11, 8)
    destination_address: TEXT
    status: ENUM('requested', 'driver_assigned', 'driver_arrived', 'in_progress', 'completed', 'cancelled')
    requested_at: TIMESTAMP (DEFAULT: CURRENT_TIME)
    started_at: TIMESTAMP (NULLABLE)
    completed_at: TIMESTAMP (NULLABLE)
    distance_km: DECIMAL(8, 2)
    duration_minutes: INTEGER
    fare_amount: DECIMAL(8, 2)
    surge_multiplier: DECIMAL(3, 2) (DEFAULT: 1.00)
    payment_method: STRING(20)
    payment_status: ENUM('pending', 'completed', 'failed') (DEFAULT: 'pending')
    rider_rating: TINYINT
    driver_rating: TINYINT
    
    INDEXES:
        (rider_id, requested_at DESC)
        (driver_id, requested_at DESC)
        (status, requested_at)
    
    PARTITIONING: RANGE BY YEAR(requested_at)
        PARTITION p2023: VALUES < 2024
        PARTITION p2024: VALUES < 2025
        PARTITION p2025: VALUES < 2026

// Trip locations (for real-time tracking)
TABLE trip_locations:
    id: BIGINT (PRIMARY KEY, AUTO_INCREMENT)
    trip_id: STRING(36) (FOREIGN KEY)
    lat: DECIMAL(10, 8) (NOT NULL)
    lng: DECIMAL(11, 8) (NOT NULL)
    recorded_at: TIMESTAMP (DEFAULT: CURRENT_TIME)
    
    INDEXES:
        (trip_id, recorded_at)

// Payments table
TABLE payments:
    id: STRING(36) (PRIMARY KEY)
    trip_id: STRING(36) (FOREIGN KEY)
    amount: DECIMAL(8, 2) (NOT NULL)
    currency: STRING(3) (DEFAULT: 'USD')
    payment_method: STRING(50)
    payment_gateway_id: STRING(100)
    status: ENUM('pending', 'processing', 'completed', 'failed', 'refunded')
    created_at: TIMESTAMP (DEFAULT: CURRENT_TIME)
    completed_at: TIMESTAMP (NULLABLE)
    
    INDEXES:
        (trip_id)
        (status, created_at)
```

## Detailed Questions & Answers

### Q1: How do you efficiently find nearby drivers?

**Answer**: Multi-layered geospatial indexing approach:

**1. Redis Geospatial Index**
```python
class GeospatialIndex:
    def __init__(self):
        self.redis_client = redis.Redis()
        
    async def update_driver_location(self, driver_id, lat, lng):
        # Add/update driver location in Redis geospatial index
        await self.redis_client.geoadd('active_drivers', lng, lat, driver_id)
        
        # Set TTL for automatic cleanup of inactive drivers
        await self.redis_client.expire(f"driver:{driver_id}", 300)
    
    async def find_nearby_drivers(self, lat, lng, radius_km=10):
        # Use GEORADIUS to find drivers within radius
        nearby = await self.redis_client.georadius(
            'active_drivers', lng, lat, radius_km, 
            unit='km', withdist=True, sort='ASC'
        )
        
        return [(driver_id, distance) for driver_id, distance in nearby]
```

**2. QuadTree for Hierarchical Search**
```python
class QuadTree:
    def __init__(self, bounds, max_points=10, max_depth=6):
        self.bounds = bounds  # (min_lat, min_lng, max_lat, max_lng)
        self.max_points = max_points
        self.max_depth = max_depth
        self.points = []
        self.children = []
        self.divided = False
        
    def insert(self, point):
        # point = {'id': driver_id, 'lat': lat, 'lng': lng}
        if not self.contains(point):
            return False
            
        if len(self.points) < self.max_points and not self.divided:
            self.points.append(point)
            return True
            
        if not self.divided:
            self.subdivide()
            
        // Try to insert in children
        FOR EACH child IN children:
            IF child.insert(point):
                RETURN true
                
        RETURN false
    
    FUNCTION query_range(range_bounds):
        // Find all points within the given bounds
        found_points = []
        
        IF NOT intersects(range_bounds):
            RETURN found_points
            
        // Check points in this node
        FOR EACH point IN points:
            IF point_in_range(point, range_bounds):
                found_points.ADD(point)
        
        // Check children if divided
        IF divided:
            FOR EACH child IN children:
                found_points.EXTEND(child.query_range(range_bounds))
                
        RETURN found_points
```

**3. Database Index Optimization**
```
// Spatial index for efficient geo queries
CREATE SPATIAL INDEX idx_driver_location ON drivers(GEOSPATIAL_POINT(current_lng, current_lat))

// Query nearby drivers using spatial functions
QUERY:
    SELECT 
        user_id,
        current_lat,
        current_lng,
        DISTANCE_SPHERE(
            GEOSPATIAL_POINT(current_lng, current_lat),
            GEOSPATIAL_POINT(target_lng, target_lat)
        ) / 1000 as distance_km
    FROM drivers
    WHERE status = 'available'
        AND DISTANCE_SPHERE(
            GEOSPATIAL_POINT(current_lng, current_lat),
            GEOSPATIAL_POINT(target_lng, target_lat)
        ) <= radius_meters
    ORDER BY distance_km
    LIMIT 20
```

### Q2: How do you handle driver-rider matching at scale?

**Answer**: Intelligent matching algorithm with multiple strategies:

**1. Smart Matching Algorithm**
```python
class IntelligentMatcher:
    def __init__(self):
        self.matching_strategies = [
            'closest_driver',
            'shortest_eta',
            'highest_rated',
            'load_balancing'
        ]
    
    async def find_best_match(self, ride_request, available_drivers):
        # Score each driver based on multiple factors
        driver_scores = []
        
        for driver in available_drivers:
            score = await self.calculate_match_score(ride_request, driver)
            driver_scores.append({
                'driver': driver,
                'score': score
            })
        
        # Sort by score (highest first)
        driver_scores.sort(key=lambda x: x['score'], reverse=True)
        
        return [item['driver'] for item in driver_scores]
    
    async def calculate_match_score(self, ride_request, driver):
        score = 0
        
        # Distance factor (closer is better)
        distance_km = driver['distance_km']
        distance_score = max(0, 10 - distance_km)  # Max 10 points
        score += distance_score * 0.4  # 40% weight
        
        # ETA factor (faster pickup is better)
        eta_minutes = driver['pickup_eta_minutes']
        eta_score = max(0, 15 - eta_minutes)  # Max 15 points
        score += eta_score * 0.3  # 30% weight
        
        // Driver rating (higher rating is better)
        rating_score = driver.rating  // 0-5 scale
        score = score + (rating_score * 0.2)  // 20% weight
        
        // Driver utilization (balance load)
        utilization_score = get_utilization_bonus(driver.id)
        score = score + (utilization_score * 0.1)  // 10% weight
        
        RETURN score
    
    FUNCTION get_utilization_bonus(driver_id):
        // Give bonus to drivers with fewer recent trips (load balancing)
        recent_trips = database.count_recent_trips(driver_id, hours: 2)
        
        IF recent_trips == 0:
            RETURN 2.0  // Bonus for inactive drivers
        ELSE IF recent_trips <= 2:
            RETURN 1.0
        ELSE:
            RETURN 0.0
```

**2. Batch Matching for Efficiency**
```
CLASS BatchMatcher:
    FUNCTION process_matching_batch(pending_requests):
        // Group requests by geographic area for efficient processing
        geographic_groups = group_by_geography(pending_requests)
        
        matching_tasks = []
        FOR EACH group IN geographic_groups:
            task = process_geographic_group(group)
            matching_tasks.ADD(task)
        
        // Process all groups in parallel
        results = EXECUTE_ALL_PARALLEL(matching_tasks)
        
        RETURN flatten_results(results)
    
    FUNCTION group_by_geography(requests):
        // Use geohash to group nearby requests
        groups = MAP()
        
        FOR EACH request IN requests:
            geohash = ENCODE_GEOHASH(
                request.pickup_lat, 
                request.pickup_lng, 
                precision: 6  // ~1km precision
            )
            
            IF geohash NOT IN groups:
                groups[geohash] = []
            groups[geohash].ADD(request)
        
        RETURN VALUES(groups)
    
    FUNCTION process_geographic_group(requests):
        IF requests IS EMPTY:
            RETURN []
        
        // Find drivers for this geographic area
        center_lat = AVERAGE(r.pickup_lat FOR r IN requests)
        center_lng = AVERAGE(r.pickup_lng FOR r IN requests)
        
        available_drivers = location_service.find_nearby_drivers(
            center_lat, center_lng, radius_km: 15, limit: 100
        )
        
        // Match requests to drivers using optimal assignment algorithm
        matches = optimal_assignment(requests, available_drivers)
        
        RETURN matches
```

### Q3: How do you implement real-time trip tracking?

**Answer**: WebSocket-based real-time updates with efficient data handling:

**1. Real-time Location Updates**
```python
class TripTrackingService:
    def __init__(self):
        self.websocket_manager = WebSocketManager()
        self.location_buffer = {}
        
    async def start_trip_tracking(self, trip_id, rider_id, driver_id):
        # Create tracking session
        tracking_session = {
            'trip_id': trip_id,
            'rider_id': rider_id,
            'driver_id': driver_id,
            'started_at': datetime.now(),
            'last_update': None
        }
        
        # Store in cache for fast access
        await self.redis_client.setex(
            f"tracking:{trip_id}", 
            3600, 
            json.dumps(tracking_session)
        )
        
        # Subscribe both parties to trip updates
        await self.websocket_manager.subscribe_to_trip(rider_id, trip_id)
        await self.websocket_manager.subscribe_to_trip(driver_id, trip_id)
        
        return tracking_session
    
    async def update_trip_location(self, trip_id, driver_id, lat, lng, heading=None):
        location_update = {
            'trip_id': trip_id,
            'driver_id': driver_id,
            'lat': lat,
            'lng': lng,
            'heading': heading,
            'timestamp': time.time()
        }
        
        # Buffer location updates to avoid database overload
        if trip_id not in self.location_buffer:
            self.location_buffer[trip_id] = []
        
        self.location_buffer[trip_id].append(location_update)
        
        # Flush buffer every 10 updates or 30 seconds
        if (len(self.location_buffer[trip_id]) >= 10 or 
            time.time() - self.location_buffer[trip_id][0]['timestamp'] > 30):
            await self.flush_location_buffer(trip_id)
        
        # Real-time update to rider
        tracking_session = await self.get_tracking_session(trip_id)
        if tracking_session:
            await self.websocket_manager.send_location_update(
                tracking_session['rider_id'], location_update
            )
        
        return location_update
    
    async def flush_location_buffer(self, trip_id):
        if trip_id not in self.location_buffer:
            return
        
        locations = self.location_buffer[trip_id]
        self.location_buffer[trip_id] = []
        
        # Batch insert to database
        await self.db.batch_insert_trip_locations(locations)
```

**2. ETA Calculation and Updates**
```python
class ETAService:
    def __init__(self):
        self.maps_client = GoogleMapsClient()
        self.eta_cache = {}
        
    async def calculate_eta(self, current_location, destination, trip_id=None):
        # Check cache first (for repeated calculations)
        cache_key = f"eta:{current_location['lat']:.4f},{current_location['lng']:.4f}:{destination['lat']:.4f},{destination['lng']:.4f}"
        
        cached_eta = self.eta_cache.get(cache_key)
        if cached_eta and time.time() - cached_eta['timestamp'] < 120:  # 2 minutes
            return cached_eta['eta_seconds']
        
        # Calculate using Maps API
        route_info = await self.maps_client.get_directions(
            origin=(current_location['lat'], current_location['lng']),
            destination=(destination['lat'], destination['lng']),
            traffic_aware=True
        )
        
        eta_seconds = route_info['duration_in_traffic']
        
        # Cache result
        self.eta_cache[cache_key] = {
            'eta_seconds': eta_seconds,
            'timestamp': time.time()
        }
        
        return eta_seconds
    
    async def update_trip_eta(self, trip_id, driver_location):
        trip_info = await self.db.get_trip_info(trip_id)
        
        if trip_info['status'] == 'driver_assigned':
            # ETA to pickup
            destination = {
                'lat': trip_info['pickup_lat'],
                'lng': trip_info['pickup_lng']
            }
        elif trip_info['status'] in ['driver_arrived', 'in_progress']:
            # ETA to destination
            destination = {
                'lat': trip_info['destination_lat'],
                'lng': trip_info['destination_lng']
            }
        else:
            return None
        
        eta_seconds = await self.calculate_eta(driver_location, destination, trip_id)
        
        # Update rider with new ETA
        eta_update = {
            'trip_id': trip_id,
            'eta_seconds': eta_seconds,
            'eta_minutes': eta_seconds // 60,
            'updated_at': datetime.now().isoformat()
        }
        
        await self.websocket_manager.send_eta_update(
            trip_info['rider_id'], eta_update
        )
        
        return eta_update
```

### Q4: How do you handle payment processing securely?

**Answer**: Multi-layered payment system with fraud detection:

**1. Payment Processing Service**
```python
class PaymentService:
    def __init__(self):
        self.stripe_client = stripe
        self.fraud_detector = FraudDetectionService()
        
    async def process_trip_payment(self, trip_id, payment_method_id):
        trip = await self.db.get_trip_details(trip_id)
        
        # Calculate final fare (including any adjustments)
        final_fare = await self.calculate_final_fare(trip)
        
        # Fraud detection
        fraud_risk = await self.fraud_detector.assess_risk(trip, final_fare)
        
        if fraud_risk['risk_level'] == 'high':
            return await self.handle_high_risk_payment(trip, final_fare, fraud_risk)
        
        # Process payment
        payment_intent = await self.create_payment_intent(
            amount=int(final_fare * 100),  # Stripe uses cents
            payment_method=payment_method_id,
            metadata={
                'trip_id': trip_id,
                'rider_id': trip['rider_id'],
                'driver_id': trip['driver_id']
            }
        )
        
        try:
            # Confirm payment
            confirmed_payment = await self.stripe_client.PaymentIntent.confirm(
                payment_intent.id
            )
            
            if confirmed_payment.status == 'succeeded':
                # Payment successful
                await self.handle_successful_payment(trip, confirmed_payment, final_fare)
                
                # Initiate driver payout
                await self.schedule_driver_payout(trip['driver_id'], final_fare)
                
                return {
                    'status': 'success',
                    'payment_id': confirmed_payment.id,
                    'amount': final_fare
                }
            else:
                # Payment failed
                await self.handle_failed_payment(trip_id, confirmed_payment)
                return {
                    'status': 'failed',
                    'error': 'Payment processing failed'
                }
                
        except stripe.error.CardError as e:
            # Card was declined
            await self.handle_card_declined(trip_id, e)
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    async def calculate_final_fare(self, trip):
        base_fare = trip['fare_amount']
        
        # Add any surge multiplier
        surge_amount = base_fare * (trip['surge_multiplier'] - 1)
        
        # Add tips if any
        tip_amount = trip.get('tip_amount', 0)
        
        # Add taxes and fees
        tax_rate = 0.08  # 8% tax
        service_fee = 1.50
        
        subtotal = base_fare + surge_amount + tip_amount
        tax_amount = subtotal * tax_rate
        
        total = subtotal + tax_amount + service_fee
        
        return round(total, 2)
    
    async def schedule_driver_payout(self, driver_id, trip_fare):
        # Calculate driver earnings (85% of fare after fees)
        service_commission = 0.15  # 15% commission
        driver_earnings = trip_fare * (1 - service_commission)
        
        # Create payout record
        payout_record = {
            'driver_id': driver_id,
            'amount': driver_earnings,
            'trip_id': trip_id,
            'status': 'pending',
            'scheduled_at': datetime.now() + timedelta(hours=24)  # Daily payouts
        }
        
        await self.db.create_payout_record(payout_record)
        
        return payout_record
```

**2. Fraud Detection System**
```python
class FraudDetectionService:
    def __init__(self):
        self.ml_model = FraudDetectionModel()
        
    async def assess_risk(self, trip, fare_amount):
        risk_factors = []
        risk_score = 0
        
        # Geographic anomalies
        if await self.is_unusual_route(trip):
            risk_factors.append('unusual_route')
            risk_score += 0.3
        
        # Fare anomalies
        expected_fare = await self.calculate_expected_fare(trip)
        if abs(fare_amount - expected_fare) / expected_fare > 0.5:  # 50% deviation
            risk_factors.append('fare_anomaly')
            risk_score += 0.4
        
        # User behavior patterns
        user_risk = await self.assess_user_risk(trip['rider_id'])
        risk_score += user_risk * 0.3
        
        # Time-based patterns
        if await self.is_suspicious_timing(trip):
            risk_factors.append('suspicious_timing')
            risk_score += 0.2
        
        # ML model prediction
        ml_risk = await self.ml_model.predict_fraud_risk(trip)
        risk_score += ml_risk * 0.5
        
        # Determine risk level
        if risk_score > 0.8:
            risk_level = 'high'
        elif risk_score > 0.5:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors
        }
```

### Q5: How do you handle surge pricing during high demand?

**Answer**: Dynamic pricing algorithm with machine learning predictions:

**1. Surge Pricing Algorithm**
```python
class SurgePricingService:
    def __init__(self):
        self.demand_predictor = DemandPredictionService()
        self.supply_tracker = SupplyTrackingService()
        
    async def calculate_surge_multiplier(self, location, current_time=None):
        if not current_time:
            current_time = datetime.now()
        
        # Get geographical area (grid cell)
        grid_id = self.get_grid_id(location['lat'], location['lng'])
        
        # Calculate current supply/demand ratio
        supply_demand = await self.get_current_supply_demand(grid_id)
        
        # Predict demand for next 30 minutes
        predicted_demand = await self.demand_predictor.predict_demand(
            grid_id, current_time, horizon_minutes=30
        )
        
        # Calculate base surge multiplier
        base_multiplier = self.calculate_base_surge(
            supply_demand['supply'], 
            supply_demand['demand']
        )
        
        # Adjust for predicted demand
        demand_adjustment = self.calculate_demand_adjustment(
            predicted_demand, supply_demand['supply']
        )
        
        # Apply smoothing to prevent dramatic price swings
        current_multiplier = await self.get_current_multiplier(grid_id)
        smoothed_multiplier = self.smooth_multiplier_change(
            current_multiplier, base_multiplier * demand_adjustment
        )
        
        # Cap maximum surge
        final_multiplier = min(smoothed_multiplier, 5.0)  # Max 5x surge
        
        # Cache the result
        await self.cache_multiplier(grid_id, final_multiplier, ttl=120)  # 2 minutes
        
        return final_multiplier
    
    def calculate_base_surge(self, supply, demand):
        if demand == 0:
            return 1.0
            
        ratio = supply / demand
        
        # Surge multiplier based on supply/demand ratio
        if ratio >= 1.0:
            return 1.0  # No surge needed
        elif ratio >= 0.7:
            return 1.2
        elif ratio >= 0.5:
            return 1.5
        elif ratio >= 0.3:
            return 2.0
        elif ratio >= 0.1:
            return 3.0
        else:
            return 4.0
    
    async def get_current_supply_demand(self, grid_id):
        grid_bounds = self.get_grid_bounds(grid_id)
        
        # Count available drivers in the area
        available_drivers = await self.supply_tracker.count_available_drivers(
            grid_bounds
        )
        
        # Count pending ride requests
        pending_requests = await self.db.count_pending_requests(grid_bounds)
        
        # Count in-progress trips (these reduce effective supply)
        ongoing_trips = await self.db.count_ongoing_trips(grid_bounds)
        
        effective_supply = max(0, available_drivers - ongoing_trips * 0.5)
        
        return {
            'supply': effective_supply,
            'demand': pending_requests,
            'ratio': effective_supply / max(1, pending_requests)
        }
```

**2. Demand Prediction Service**
```python
class DemandPredictionService:
    def __init__(self):
        self.ml_model = DemandPredictionModel()
        self.weather_service = WeatherService()
        self.events_service = EventsService()
        
    async def predict_demand(self, grid_id, current_time, horizon_minutes=30):
        # Historical demand patterns
        historical_data = await self.get_historical_demand(
            grid_id, current_time, lookback_days=30
        )
        
        # Weather impact
        weather_data = await self.weather_service.get_current_weather(grid_id)
        weather_multiplier = self.calculate_weather_impact(weather_data)
        
        # Special events impact
        events = await self.events_service.get_nearby_events(
            grid_id, current_time, horizon_minutes
        )
        events_multiplier = self.calculate_events_impact(events)
        
        # Time-based patterns (rush hour, weekend, etc.)
        time_multiplier = self.calculate_time_multiplier(current_time)
        
        # Base prediction from historical data
        base_prediction = np.mean([d['demand'] for d in historical_data])
        
        # Apply multipliers
        predicted_demand = (
            base_prediction * 
            weather_multiplier * 
            events_multiplier * 
            time_multiplier
        )
        
        # Use ML model for refinement
        features = self.extract_features(
            grid_id, current_time, weather_data, events, historical_data
        )
        
        ml_prediction = await self.ml_model.predict(features)
        
        # Combine predictions (weighted average)
        final_prediction = (
            predicted_demand * 0.6 +  # 60% rule-based
            ml_prediction * 0.4       # 40% ML-based
        )
        
        return max(0, final_prediction)
    
    def calculate_weather_impact(self, weather_data):
        # Rain increases demand
        if weather_data.get('precipitation_mm', 0) > 2:
            return 1.5
        elif weather_data.get('precipitation_mm', 0) > 0.5:
            return 1.2
        
        # Extreme temperatures increase demand
        temp_c = weather_data.get('temperature_c', 20)
        if temp_c < 0 or temp_c > 35:
            return 1.3
        elif temp_c < 5 or temp_c > 30:
            return 1.1
        
        return 1.0
```

## Advanced Scenarios

### Scenario 1: Airport Surge Management
**Challenge**: Handle massive demand spikes at airports during flight arrivals.

**Solution**:
1. **Predictive Positioning**: Use flight data APIs to predict demand
2. **Driver Incentives**: Offer bonuses to attract drivers to airport areas
3. **Queue Management**: Implement virtual driver queues at pickup zones
4. **Dynamic Geofencing**: Adjust pickup/dropoff zones based on capacity

### Scenario 2: Natural Disaster Response
**Challenge**: Provide emergency transportation during natural disasters.

**Solution**:
1. **Emergency Mode**: Activate surge caps and prioritize essential trips
2. **Resource Reallocation**: Redirect drivers from low-priority areas
3. **Partnership Integration**: Coordinate with emergency services
4. **Communication System**: Broadcast emergency information to users

### Scenario 3: Multi-City Service Expansion
**Challenge**: Scale to hundreds of cities with different regulations.

**Solution**:
1. **Microservices Architecture**: City-specific service configurations
2. **Regulatory Compliance**: Automated compliance checking per jurisdiction
3. **Localized Pricing**: Region-specific pricing models and payment methods
4. **Cultural Adaptation**: Customize user experience for local preferences

This comprehensive ride-sharing system design covers location tracking, matching algorithms, pricing strategies, and handles the complex challenges of a global transportation platform.