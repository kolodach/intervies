-- Insert sample problems
INSERT INTO problems (title, description, difficulty, industries, evaluation_criteria, requirements)
VALUES
  (
    'Design a URL Shortener',
    'Design a URL shortening service like bit.ly that takes long URLs and converts them to short URLs.',
    'easy',
    ARRAY['SaaS', 'Marketing']::text[],
    '[{"dimension": "API Design", "description": "Clear REST API design", "weight": 0.25}, {"dimension": "Data Storage", "description": "Efficient storage strategy", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle high traffic", "weight": 0.25}, {"dimension": "Collision Handling", "description": "Handle hash collisions", "weight": 0.25}]'::jsonb,
    '{
      "functional": [
        "Shorten long URLs to short codes (random generation)",
        "Support custom aliases (user-defined short codes)",
        "Redirect short URLs to original URLs using HTTP 307 redirect",
        "Track click analytics (count per URL, timestamps)",
        "Validate input URLs before shortening",
        "Return 404 for non-existent short codes",
        "Ensure short codes are unique"
      ],
      "non_functional": [
        "10 million daily active users (DAU)",
        "50,000 URL creation requests per second (peak)",
        "500,000 redirect requests per second (peak)",
        "Support hundreds of billions of URLs over system lifetime",
        "99.99% availability for redirect operations",
        "p95 latency under 50ms for redirects",
        "p99 latency under 100ms for redirects",
        "p95 latency under 200ms for URL creation",
        "Multi-region deployment required",
        "Once created, short URL must never be lost (durability guarantee)",
        "Analytics data can be eventually consistent",
        "Short codes must use URL-safe characters only (alphanumeric, no special chars)",
        "Short codes should be 6-8 characters in length",
        "No adult content or spam URLs allowed"
      ],
      "out_of_scope": [
        "URL preview or link unfurling",
        "QR code generation",
        "Link-in-bio pages",
        "A/B testing for different destination URLs",
        "Email notifications for click milestones"
      ]
    }'::jsonb
  ),
  (
    'Design Instagram',
    'Design a photo-sharing social media platform like Instagram.',
    'medium',
    ARRAY['Social Media', 'Consumer']::text[],
    '[{"dimension": "Architecture", "description": "Overall system design", "weight": 0.3}, {"dimension": "Storage", "description": "Photo and metadata storage", "weight": 0.25}, {"dimension": "Feed Generation", "description": "News feed algorithm", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of users", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Upload and store photos (JPEG, PNG up to 10MB)",
        "Follow and unfollow other users",
        "Generate personalized news feed showing photos from followed users",
        "Like photos (with like count visible)",
        "Comment on photos (nested comments not required)",
        "Search for users by username",
        "Search for photos by hashtags",
        "View user profiles with their photo grid",
        "Direct messaging between users (text only, photos optional)"
      ],
      "non_functional": [
        "500 million daily active users",
        "100 million photos uploaded per day",
        "Average of 50MB per user for photo storage",
        "Feed generation under 500ms (p95)",
        "Photo upload under 3 seconds for 5MB photo",
        "99.9% uptime for core features (feed, upload, view)",
        "Global CDN for photo delivery with <200ms latency worldwide",
        "Photos must be durable (never lost after upload confirmation)",
        "Feed can be eventually consistent (few seconds delay acceptable)",
        "Photos must be resized to multiple resolutions (thumbnail, medium, full)",
        "Maximum 30 hashtags per photo",
        "Inappropriate content must be flagged (manual review acceptable)"
      ],
      "out_of_scope": [
        "Video support (Reels, Stories)",
        "Live streaming",
        "Shopping and checkout",
        "Advanced photo editing filters",
        "Algorithmic recommendations beyond followed users"
      ]
    }'::jsonb
  ),
  (
    'Design Netflix',
    'Design a video streaming service like Netflix.',
    'hard',
    ARRAY['Entertainment', 'Streaming', 'Media']::text[],
    '[{"dimension": "Video Delivery", "description": "CDN and streaming strategy", "weight": 0.3}, {"dimension": "Encoding", "description": "Video encoding and quality", "weight": 0.2}, {"dimension": "Recommendations", "description": "Content recommendation system", "weight": 0.2}, {"dimension": "Scalability", "description": "Global scale architecture", "weight": 0.3}]'::jsonb,
    '{
      "functional": [
        "Stream videos with adaptive bitrate (auto-adjust quality based on bandwidth)",
        "Support multiple resolutions (480p, 720p, 1080p, 4K)",
        "Upload and encode videos in multiple formats",
        "Pause, resume, and seek within videos",
        "Personalized recommendation system based on viewing history",
        "Search for content by title, genre, actors",
        "User profiles with watch history and preferences",
        "Continue watching from where user left off (across devices)",
        "Subtitles and multiple audio tracks support"
      ],
      "non_functional": [
        "200 million daily active users",
        "10 million concurrent streaming sessions during peak hours",
        "Support 4K video streaming at 25 Mbps",
        "Buffer and start playback within 2 seconds",
        "Less than 0.1% buffering ratio during playback",
        "99.99% availability for streaming service",
        "Global CDN with 95% of users served from edge location within 50ms",
        "Recommendation updates can be batch processed (1-hour delay acceptable)",
        "Store exabytes of video content",
        "Encoding pipeline should process uploaded video within 24 hours",
        "Videos must be encoded in multiple bitrates for adaptive streaming",
        "DRM (Digital Rights Management) required for content protection",
        "Cost optimization crucial due to CDN and storage expenses",
        "Compliance with regional content licensing restrictions"
      ],
      "out_of_scope": [
        "Live TV streaming",
        "User-generated content (YouTube-style)",
        "Social features (sharing, commenting)",
        "Offline download for mobile (out of scope for this design)",
        "Content creation and video editing tools"
      ]
    }'::jsonb
  ),
  (
    'Design a Chat Application',
    'Design a real-time chat application like Slack or Discord.',
    'medium',
    ARRAY['Communication', 'Collaboration', 'Enterprise']::text[],
    '[{"dimension": "Real-time Communication", "description": "WebSocket and message delivery", "weight": 0.3}, {"dimension": "Message Storage", "description": "Efficient message history storage", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of concurrent connections", "weight": 0.25}, {"dimension": "Presence System", "description": "User online/offline status", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Send and receive text messages in real-time",
        "Create public and private channels",
        "Direct messaging between users",
        "Message history with pagination",
        "User presence indicators (online, away, offline)",
        "File attachments (images, documents up to 10MB)",
        "Message reactions (emoji)",
        "Search messages by content",
        "Mention users with @username",
        "Read receipts for direct messages"
      ],
      "non_functional": [
        "10 million daily active users",
        "1 million concurrent connections",
        "100,000 messages per second",
        "Message delivery latency under 100ms (p95)",
        "99.9% uptime for messaging service",
        "Store 5 years of message history",
        "Search results returned within 200ms",
        "Support file uploads up to 10MB",
        "Messages must be delivered in order within a channel",
        "Message history must be retained for at least 1 year",
        "Maximum 1000 members per channel",
        "Rate limiting: 10 messages per second per user"
      ],
      "out_of_scope": [
        "Voice and video calls",
        "Screen sharing",
        "Bot integrations",
        "Message encryption (end-to-end)",
        "Message editing after 24 hours"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Cache',
    'Design a distributed caching system like Redis or Memcached.',
    'hard',
    ARRAY['Infrastructure', 'Cloud', 'Database']::text[],
    '[{"dimension": "Architecture", "description": "Distributed system design", "weight": 0.3}, {"dimension": "Eviction Policies", "description": "LRU, LFU, TTL handling", "weight": 0.25}, {"dimension": "Consistency", "description": "Cache coherence across nodes", "weight": 0.25}, {"dimension": "Performance", "description": "Low latency operations", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Store key-value pairs in memory",
        "Support TTL (time-to-live) for keys",
        "Implement LRU (Least Recently Used) eviction",
        "Implement LFU (Least Frequently Used) eviction",
        "Support atomic operations (increment, decrement)",
        "Support data structures (lists, sets, hashes)",
        "Cache invalidation by key or pattern",
        "Distributed caching across multiple nodes",
        "Replication for high availability"
      ],
      "non_functional": [
        "1 million operations per second per node",
        "Sub-millisecond latency for get/set operations",
        "Support 100GB memory per node",
        "99.99% availability",
        "Automatic failover within 1 second",
        "Linear scalability up to 100 nodes",
        "Consistent hashing for key distribution",
        "Keys limited to 250 characters",
        "Values limited to 512MB",
        "Maximum 1 million keys per node",
        "TTL precision: 1 second"
      ],
      "out_of_scope": [
        "Persistence to disk",
        "Transactions (multi-key atomicity)",
        "Pub/sub messaging",
        "Lua scripting",
        "Geospatial queries"
      ]
    }'::jsonb
  ),
  (
    'Design a Rate Limiter',
    'Design a rate limiting system to control API request rates.',
    'easy',
    ARRAY['Infrastructure', 'Security', 'API']::text[],
    '[{"dimension": "Algorithm Design", "description": "Token bucket vs sliding window", "weight": 0.3}, {"dimension": "Distributed Design", "description": "Consistent rate limiting across servers", "weight": 0.3}, {"dimension": "Performance", "description": "Low overhead on each request", "weight": 0.2}, {"dimension": "Accuracy", "description": "Precise rate limit enforcement", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Limit requests per user ID",
        "Limit requests per IP address",
        "Support token bucket algorithm",
        "Support sliding window algorithm",
        "Support fixed window algorithm",
        "Return rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset)",
        "Different limits for different API endpoints",
        "Whitelist certain users/IPs"
      ],
      "non_functional": [
        "Handle 1 million requests per second",
        "Rate limit check overhead under 1ms",
        "99.99% availability",
        "Support 100 million unique users/IPs",
        "Distributed across 100 servers",
        "Rate limit accuracy within 1%",
        "Rate limits must be consistent across all servers",
        "No false positives (rejecting valid requests)",
        "Graceful degradation if rate limiter is down"
      ],
      "out_of_scope": [
        "Dynamic rate limit adjustment based on load",
        "Rate limit analytics dashboard",
        "Custom rate limit rules per user tier",
        "Geographic rate limiting"
      ]
    }'::jsonb
  ),
  (
    'Design a Search Engine',
    'Design a web search engine like Google that indexes and searches billions of web pages.',
    'hard',
    ARRAY['Search', 'Advertising', 'Information']::text[],
    '[{"dimension": "Crawling", "description": "Web crawler design", "weight": 0.25}, {"dimension": "Indexing", "description": "Inverted index and storage", "weight": 0.3}, {"dimension": "Ranking", "description": "Search result ranking algorithm", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle billions of documents", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Crawl web pages from the internet",
        "Parse HTML and extract text content",
        "Build inverted index for fast lookup",
        "Rank search results by relevance",
        "Handle search queries with multiple keywords",
        "Support phrase search (quoted strings)",
        "Handle typos and spelling corrections",
        "Support pagination of results",
        "Return snippets with highlighted keywords"
      ],
      "non_functional": [
        "Index 100 billion web pages",
        "Handle 100,000 search queries per second",
        "Search results returned within 100ms (p95)",
        "Crawl 1 billion pages per day",
        "Store 100TB of index data",
        "99.9% uptime",
        "Index freshness: pages re-crawled within 7 days",
        "Respect robots.txt",
        "Rate limit crawling per domain",
        "Maximum 10MB per page",
        "Support 50 languages"
      ],
      "out_of_scope": [
        "Image search",
        "Video search",
        "Real-time search (Twitter-style)",
        "Personalized search results",
        "Search history and suggestions"
      ]
    }'::jsonb
  ),
  (
    'Design a Notification System',
    'Design a notification system that sends push notifications, emails, and SMS to users.',
    'medium',
    ARRAY['Communication', 'SaaS', 'Messaging']::text[],
    '[{"dimension": "Multi-channel Delivery", "description": "Push, email, SMS integration", "weight": 0.3}, {"dimension": "Reliability", "description": "Guaranteed delivery and retries", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of notifications", "weight": 0.25}, {"dimension": "User Preferences", "description": "Opt-in/opt-out management", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Send push notifications to mobile devices",
        "Send emails via SMTP",
        "Send SMS via third-party providers",
        "User preference management (opt-in/opt-out per channel)",
        "Template-based notifications",
        "Batch notifications",
        "Delivery status tracking",
        "Retry failed deliveries (exponential backoff)",
        "Rate limiting per user",
        "Notification history"
      ],
      "non_functional": [
        "100 million notifications per day",
        "10,000 notifications per second (peak)",
        "Delivery within 5 seconds (p95)",
        "99.9% delivery success rate",
        "Support 50 million users",
        "Store 90 days of notification history",
        "Handle 10 different notification types",
        "Maximum 3 retries per notification",
        "Rate limit: 10 notifications per minute per user",
        "Email size limited to 10MB",
        "SMS limited to 160 characters"
      ],
      "out_of_scope": [
        "Rich media in push notifications",
        "In-app notification center",
        "Notification scheduling",
        "A/B testing notification content",
        "Analytics dashboard"
      ]
    }'::jsonb
  ),
  (
    'Design a Payment Processing System',
    'Design a payment processing system that handles credit card transactions securely.',
    'hard',
    ARRAY['Fintech', 'E-commerce', 'Payments']::text[],
    '[{"dimension": "Security", "description": "PCI compliance and encryption", "weight": 0.3}, {"dimension": "Transaction Processing", "description": "Payment flow and idempotency", "weight": 0.3}, {"dimension": "Reliability", "description": "Guaranteed transaction processing", "weight": 0.25}, {"dimension": "Fraud Detection", "description": "Basic fraud prevention", "weight": 0.15}]'::jsonb,
    '{
      "functional": [
        "Process credit card payments",
        "Handle payment refunds",
        "Store encrypted payment methods (tokenization)",
        "Support multiple payment methods (credit card, debit card)",
        "Transaction history and receipts",
        "Idempotent payment processing",
        "Basic fraud detection (velocity checks)",
        "Payment method validation",
        "Support partial refunds"
      ],
      "non_functional": [
        "Process 1 million transactions per day",
        "Transaction processing latency under 2 seconds",
        "99.99% availability",
        "PCI DSS Level 1 compliance",
        "Zero data loss guarantee",
        "Support 10 million stored payment methods",
        "Fraud detection check under 500ms",
        "Never store full credit card numbers",
        "All payment data encrypted at rest",
        "PCI compliance required",
        "Maximum transaction amount: $10,000",
        "Refunds must be processed within 7 days"
      ],
      "out_of_scope": [
        "Cryptocurrency payments",
        "Bank transfers (ACH)",
        "Advanced fraud detection (ML models)",
        "Recurring payments/subscriptions",
        "Multi-currency support"
      ]
    }'::jsonb
  ),
  (
    'Design a File Storage System',
    'Design a distributed file storage system like Dropbox or Google Drive.',
    'hard',
    ARRAY['Cloud Storage', 'SaaS', 'Enterprise']::text[],
    '[{"dimension": "Storage Architecture", "description": "Distributed storage design", "weight": 0.3}, {"dimension": "Synchronization", "description": "Multi-device file sync", "weight": 0.25}, {"dimension": "Versioning", "description": "File version history", "weight": 0.2}, {"dimension": "Scalability", "description": "Handle petabytes of data", "weight": 0.25}]'::jsonb,
    '{
      "functional": [
        "Upload files up to 10GB",
        "Download files",
        "File versioning (keep last 10 versions)",
        "Synchronize files across multiple devices",
        "Share files with other users (read-only or read-write)",
        "Create folders and organize files",
        "Search files by name",
        "Delete files (soft delete for 30 days)",
        "Resume interrupted uploads"
      ],
      "non_functional": [
        "Store 1 petabyte of data",
        "Support 100 million users",
        "Upload 10GB file within 1 hour",
        "Download latency under 200ms for small files",
        "99.9% availability",
        "Replicate files across 3 data centers",
        "Sync changes within 5 seconds",
        "Maximum file size: 10GB",
        "Maximum 100,000 files per user",
        "Files stored with 3x replication",
        "Version history retained for 90 days"
      ],
      "out_of_scope": [
        "Real-time collaborative editing",
        "File preview generation",
        "Advanced search (full-text search)",
        "File encryption (client-side)",
        "Bandwidth throttling"
      ]
    }'::jsonb
  ),
  (
    'Design a Task Queue System',
    'Design a distributed task queue system like Celery or BullMQ.',
    'medium',
    ARRAY['Infrastructure', 'Cloud', 'Messaging']::text[],
    '[{"dimension": "Queue Design", "description": "Queue architecture and persistence", "weight": 0.3}, {"dimension": "Task Processing", "description": "Worker pool and task execution", "weight": 0.3}, {"dimension": "Reliability", "description": "Task guarantees and retries", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of tasks", "weight": 0.15}]'::jsonb,
    '{
      "functional": [
        "Enqueue tasks with payload",
        "Dequeue tasks for processing",
        "Support priority queues",
        "Schedule tasks for future execution",
        "Task retry with exponential backoff",
        "Task status tracking (pending, processing, completed, failed)",
        "Task cancellation",
        "Multiple queues (different task types)",
        "Task result storage"
      ],
      "non_functional": [
        "Process 1 million tasks per day",
        "10,000 tasks per second throughput",
        "Task processing latency under 100ms",
        "99.9% availability",
        "Support 1000 concurrent workers",
        "Store 1 million pending tasks",
        "Task retry within 1 minute of failure",
        "Maximum task payload: 1MB",
        "Maximum retry attempts: 3",
        "Task timeout: 5 minutes",
        "Priority levels: 0-10"
      ],
      "out_of_scope": [
        "Task dependencies (DAG)",
        "Task result streaming",
        "Task rate limiting",
        "Distributed locks",
        "Task analytics dashboard"
      ]
    }'::jsonb
  ),
  (
    'Design a Leaderboard System',
    'Design a leaderboard system for games or competitions that ranks users by score.',
    'easy',
    ARRAY['Gaming', 'Sports', 'Entertainment']::text[],
    '[{"dimension": "Data Structure", "description": "Efficient ranking data structure", "weight": 0.3}, {"dimension": "Performance", "description": "Fast updates and queries", "weight": 0.3}, {"dimension": "Scalability", "description": "Handle millions of users", "weight": 0.25}, {"dimension": "Time Windows", "description": "Daily, weekly, all-time leaderboards", "weight": 0.15}]'::jsonb,
    '{
      "functional": [
        "Update user scores",
        "Get top N users",
        "Get user rank",
        "Get users around a specific rank",
        "Support multiple leaderboards (daily, weekly, all-time)",
        "Get user score",
        "Reset time-based leaderboards"
      ],
      "non_functional": [
        "Support 10 million users",
        "100,000 score updates per second",
        "Get top 100 users within 10ms",
        "Get user rank within 50ms",
        "99.9% availability",
        "Store scores for 1 year",
        "Scores are non-negative integers",
        "Maximum score: 2^63 - 1",
        "Leaderboard reset at midnight UTC"
      ],
      "out_of_scope": [
        "Tie-breaking rules",
        "Score history tracking",
        "Regional leaderboards",
        "Score verification/anti-cheat",
        "Rewards distribution"
      ]
    }'::jsonb
  ),
  (
    'Design a URL Crawler',
    'Design a web crawler that systematically browses and indexes web pages.',
    'medium',
    ARRAY['Search', 'Data', 'Web']::text[],
    '[{"dimension": "Crawling Strategy", "description": "BFS vs DFS, politeness", "weight": 0.3}, {"dimension": "Deduplication", "description": "Avoid crawling same URL twice", "weight": 0.25}, {"dimension": "Politeness", "description": "Respect robots.txt and rate limits", "weight": 0.25}, {"dimension": "Scalability", "description": "Crawl millions of pages", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Crawl web pages starting from seed URLs",
        "Extract links from HTML pages",
        "Respect robots.txt rules",
        "Parse and follow sitemap.xml",
        "Avoid crawling duplicate URLs",
        "Rate limit requests per domain",
        "Handle different content types (HTML, PDF, etc.)",
        "Store crawled content",
        "Handle redirects (301, 302)"
      ],
      "non_functional": [
        "Crawl 10 million pages per day",
        "Support 1000 concurrent crawlers",
        "Respect 1 request per second per domain",
        "99% success rate for valid URLs",
        "Handle 1 million unique domains",
        "Store 100TB of crawled content",
        "Maximum 10MB per page",
        "Timeout: 30 seconds per request",
        "Maximum 10 redirects per URL",
        "Respect crawl-delay in robots.txt"
      ],
      "out_of_scope": [
        "JavaScript rendering",
        "Image and video crawling",
        "Authentication/login flows",
        "CAPTCHA solving",
        "Crawl scheduling optimization"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Lock',
    'Design a distributed locking mechanism for coordinating access to shared resources.',
    'hard',
    ARRAY['Infrastructure', 'Cloud', 'Database']::text[],
    '[{"dimension": "Consistency", "description": "Mutual exclusion guarantee", "weight": 0.3}, {"dimension": "Reliability", "description": "Handle node failures", "weight": 0.3}, {"dimension": "Performance", "description": "Low latency lock acquisition", "weight": 0.2}, {"dimension": "Deadlock Prevention", "description": "Avoid deadlocks", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Acquire exclusive lock on a resource",
        "Release lock",
        "Lock expiration (TTL)",
        "Lock renewal (extend lease)",
        "Try-lock (non-blocking)",
        "Support read-write locks",
        "Lock hierarchy to prevent deadlocks"
      ],
      "non_functional": [
        "Lock acquisition within 10ms (p95)",
        "Support 1 million locks",
        "99.99% availability",
        "Handle network partitions",
        "Automatic lock release on node failure",
        "Support 10,000 lock operations per second",
        "Lock TTL: 1 second to 1 hour",
        "Maximum lock name length: 256 characters",
        "Locks automatically expire if not renewed"
      ],
      "out_of_scope": [
        "Distributed transactions",
        "Lock priority",
        "Lock queuing",
        "Lock analytics",
        "Cross-region locking"
      ]
    }'::jsonb
  ),
  (
    'Design a Metrics Collection System',
    'Design a system to collect, store, and query application metrics and time-series data.',
    'medium',
    ARRAY['Observability', 'Infrastructure', 'DevOps']::text[],
    '[{"dimension": "Storage", "description": "Time-series database design", "weight": 0.3}, {"dimension": "Query Performance", "description": "Fast metric queries", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle billions of data points", "weight": 0.25}, {"dimension": "Data Retention", "description": "Efficient data compression", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Collect metrics (counters, gauges, histograms)",
        "Store time-series data with timestamps",
        "Query metrics by time range",
        "Aggregate metrics (sum, avg, min, max)",
        "Group metrics by tags/labels",
        "Downsample old data",
        "Retention policies (delete old data)"
      ],
      "non_functional": [
        "Collect 1 million metrics per second",
        "Store 1 trillion data points",
        "Query 1 year of data within 1 second",
        "99.9% availability",
        "Support 100,000 unique metric names",
        "Data retention: 1 year for raw, 5 years for downsampled",
        "Timestamp precision: 1 second",
        "Maximum 10 tags per metric",
        "Data points older than 1 year are downsampled to 1-hour intervals"
      ],
      "out_of_scope": [
        "Real-time alerting",
        "Anomaly detection",
        "Metric visualization",
        "Distributed tracing",
        "Log aggregation"
      ]
    }'::jsonb
  ),
  (
    'Design a Key-Value Store',
    'Design a distributed key-value store like DynamoDB or Cassandra.',
    'hard',
    ARRAY['Infrastructure', 'Database', 'Cloud']::text[],
    '[{"dimension": "Partitioning", "description": "Data distribution strategy", "weight": 0.3}, {"dimension": "Replication", "description": "Data replication and consistency", "weight": 0.25}, {"dimension": "Availability", "description": "High availability design", "weight": 0.25}, {"dimension": "Performance", "description": "Low latency operations", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Store key-value pairs",
        "Get value by key",
        "Delete key-value pair",
        "Support conditional writes",
        "Batch operations",
        "Range queries (scan)",
        "TTL (time-to-live) for keys",
        "Atomic increment/decrement operations"
      ],
      "non_functional": [
        "Store 100TB of data",
        "1 million operations per second",
        "Read latency under 10ms (p95)",
        "Write latency under 20ms (p95)",
        "99.99% availability",
        "Replicate data across 3 nodes",
        "Support 1 billion keys",
        "Key size: maximum 64KB",
        "Value size: maximum 1MB",
        "Consistency: eventual consistency by default",
        "Partition tolerance required"
      ],
      "out_of_scope": [
        "ACID transactions",
        "Secondary indexes",
        "Complex queries (JOINs)",
        "Full-text search",
        "Graph queries"
      ]
    }'::jsonb
  ),
  (
    'Design a Load Balancer',
    'Design a load balancer that distributes incoming requests across multiple servers.',
    'medium',
    ARRAY['Infrastructure', 'Cloud', 'Networking']::text[],
    '[{"dimension": "Load Balancing Algorithm", "description": "Round-robin, least connections, etc.", "weight": 0.3}, {"dimension": "Health Checks", "description": "Server health monitoring", "weight": 0.25}, {"dimension": "High Availability", "description": "Load balancer redundancy", "weight": 0.25}, {"dimension": "Performance", "description": "Low latency routing", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Distribute HTTP/HTTPS requests across backend servers",
        "Support round-robin algorithm",
        "Support least connections algorithm",
        "Support weighted round-robin",
        "Health check backend servers",
        "Session affinity (sticky sessions)",
        "SSL termination",
        "Request routing based on path or domain"
      ],
      "non_functional": [
        "Handle 1 million requests per second",
        "Routing latency under 1ms",
        "99.99% availability",
        "Support 1000 backend servers",
        "Health check every 10 seconds",
        "Automatic failover within 5 seconds",
        "Maximum 1000 backend servers",
        "Health check timeout: 5 seconds",
        "Session affinity timeout: 30 minutes"
      ],
      "out_of_scope": [
        "Layer 4 load balancing",
        "Geographic routing",
        "WAF (Web Application Firewall)",
        "Rate limiting",
        "Request/response transformation"
      ]
    }'::jsonb
  ),
  (
    'Design a URL Expander',
    'Design a service that expands shortened URLs and validates their destination.',
    'easy',
    ARRAY['Security', 'SaaS', 'Web']::text[],
    '[{"dimension": "Security", "description": "Malicious URL detection", "weight": 0.3}, {"dimension": "Performance", "description": "Fast URL expansion", "weight": 0.3}, {"dimension": "Caching", "description": "Efficient caching strategy", "weight": 0.2}, {"dimension": "Reliability", "description": "Handle various redirect scenarios", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Expand short URLs to full URLs",
        "Follow redirects (301, 302)",
        "Detect malicious URLs (phishing, malware)",
        "Cache expanded URLs",
        "Return URL metadata (title, description)",
        "Validate URL format",
        "Handle timeout for slow URLs"
      ],
      "non_functional": [
        "Expand 100,000 URLs per second",
        "Expansion latency under 500ms (p95)",
        "99.9% availability",
        "Cache hit rate above 80%",
        "Support 10 million unique URLs",
        "Malicious URL detection under 100ms",
        "Maximum 10 redirects per URL",
        "Timeout: 5 seconds per expansion",
        "Cache TTL: 24 hours"
      ],
      "out_of_scope": [
        "Image preview generation",
        "Video URL handling",
        "URL screenshot capture",
        "Advanced threat intelligence",
        "URL analytics"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Counter',
    'Design a distributed counter system that can increment/decrement values across multiple servers.',
    'medium',
    ARRAY['Infrastructure', 'Analytics', 'Cloud']::text[],
    '[{"dimension": "Consistency", "description": "Strong vs eventual consistency", "weight": 0.3}, {"dimension": "Performance", "description": "Low latency operations", "weight": 0.3}, {"dimension": "Scalability", "description": "Handle millions of counters", "weight": 0.2}, {"dimension": "Reliability", "description": "Handle node failures", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Increment counter by value",
        "Decrement counter by value",
        "Get current counter value",
        "Reset counter",
        "Atomic increment operations",
        "Batch increment operations"
      ],
      "non_functional": [
        "Support 1 million counters",
        "1 million increment operations per second",
        "Read latency under 10ms",
        "Write latency under 20ms",
        "99.9% availability",
        "Eventual consistency acceptable (within 1 second)",
        "Counter values: integers from -2^63 to 2^63-1",
        "Maximum increment/decrement: 10,000 per operation",
        "Counter name: maximum 256 characters"
      ],
      "out_of_scope": [
        "Strong consistency guarantees",
        "Counter history/versioning",
        "Distributed transactions",
        "Counter expiration",
        "Counter aggregation"
      ]
    }'::jsonb
  ),
  (
    'Design a Content Delivery Network',
    'Design a CDN system that caches and delivers content from edge locations close to users.',
    'hard',
    ARRAY['Infrastructure', 'Media', 'Networking']::text[],
    '[{"dimension": "Edge Caching", "description": "Cache strategy and placement", "weight": 0.3}, {"dimension": "Geographic Distribution", "description": "Edge location selection", "weight": 0.25}, {"dimension": "Cache Invalidation", "description": "Content update propagation", "weight": 0.25}, {"dimension": "Performance", "description": "Low latency delivery", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Cache static content (images, CSS, JS)",
        "Cache dynamic content with TTL",
        "Serve content from nearest edge location",
        "Cache invalidation by URL pattern",
        "Origin server fallback on cache miss",
        "Support multiple origin servers",
        "Compress content (gzip, brotli)",
        "HTTP/2 and HTTP/3 support"
      ],
      "non_functional": [
        "Serve 10 billion requests per day",
        "Cache hit rate above 90%",
        "Latency under 50ms from edge to user",
        "99.99% availability",
        "Support 1000 edge locations",
        "Cache invalidation within 5 minutes",
        "Support 100TB cached content",
        "Maximum file size: 100MB",
        "Cache TTL: 1 hour to 1 year",
        "Maximum 100 origin servers"
      ],
      "out_of_scope": [
        "Video streaming",
        "Live content",
        "DDoS protection",
        "WAF (Web Application Firewall)",
        "Custom SSL certificates"
      ]
    }'::jsonb
  ),
  (
    'Design a Session Store',
    'Design a distributed session storage system for web applications.',
    'medium',
    ARRAY['Infrastructure', 'Security', 'Web']::text[],
    '[{"dimension": "Storage Design", "description": "Session data structure", "weight": 0.3}, {"dimension": "Expiration", "description": "TTL and cleanup", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of sessions", "weight": 0.25}, {"dimension": "Performance", "description": "Fast session access", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Store session data (key-value pairs)",
        "Get session by session ID",
        "Update session data",
        "Delete session",
        "Session expiration (TTL)",
        "Extend session expiration",
        "Session invalidation"
      ],
      "non_functional": [
        "Store 100 million active sessions",
        "100,000 session operations per second",
        "Read latency under 5ms",
        "Write latency under 10ms",
        "99.9% availability",
        "Session expiration accuracy within 1 minute",
        "Support 10MB per session",
        "Session ID: 32 characters",
        "Session TTL: 15 minutes to 30 days",
        "Maximum session size: 10MB"
      ],
      "out_of_scope": [
        "Session sharing across domains",
        "Session encryption",
        "Session analytics",
        "Multi-factor authentication",
        "Session migration"
      ]
    }'::jsonb
  ),
  (
    'Design a Message Queue',
    'Design a message queue system like RabbitMQ or Apache Kafka.',
    'hard',
    ARRAY['Infrastructure', 'Messaging', 'Cloud']::text[],
    '[{"dimension": "Message Durability", "description": "Persistent message storage", "weight": 0.3}, {"dimension": "Ordering", "description": "Message ordering guarantees", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of messages", "weight": 0.25}, {"dimension": "Reliability", "description": "At-least-once delivery", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Publish messages to topics",
        "Subscribe to topics",
        "Message durability (persist to disk)",
        "At-least-once delivery guarantee",
        "Message ordering within partition",
        "Consumer groups",
        "Message acknowledgment",
        "Dead letter queue for failed messages"
      ],
      "non_functional": [
        "Handle 1 million messages per second",
        "Store 1TB of messages",
        "Message latency under 10ms",
        "99.99% availability",
        "Support 10,000 topics",
        "Message retention: 7 days",
        "Support 1000 consumer groups",
        "Message size: maximum 1MB",
        "Maximum 1000 partitions per topic",
        "Consumer lag monitoring"
      ],
      "out_of_scope": [
        "Exactly-once delivery",
        "Transactions",
        "Message transformation",
        "Schema registry",
        "Stream processing"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Log',
    'Design a distributed logging system that aggregates logs from multiple services.',
    'medium',
    ARRAY['Observability', 'Infrastructure', 'DevOps']::text[],
    '[{"dimension": "Log Collection", "description": "Efficient log ingestion", "weight": 0.3}, {"dimension": "Storage", "description": "Log storage and indexing", "weight": 0.25}, {"dimension": "Search", "description": "Fast log search", "weight": 0.25}, {"dimension": "Retention", "description": "Log retention policies", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Collect logs from multiple services",
        "Store logs with timestamps",
        "Search logs by text",
        "Filter logs by service, level, time range",
        "Real-time log streaming",
        "Log aggregation by service",
        "Log retention policies",
        "Export logs"
      ],
      "non_functional": [
        "Ingest 1 billion log entries per day",
        "Store 100TB of logs",
        "Search 1 year of logs within 5 seconds",
        "99.9% availability",
        "Support 10,000 services",
        "Log retention: 90 days",
        "Real-time streaming latency under 1 second",
        "Maximum log entry size: 64KB",
        "Log levels: DEBUG, INFO, WARN, ERROR",
        "Maximum 1000 concurrent searches"
      ],
      "out_of_scope": [
        "Log parsing and structured extraction",
        "Log alerting",
        "Log visualization dashboards",
        "Distributed tracing",
        "Log correlation"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Lock Manager',
    'Design a system that manages distributed locks for coordinating access to shared resources.',
    'hard',
    ARRAY['Infrastructure', 'Cloud', 'Database']::text[],
    '[{"dimension": "Consensus", "description": "Distributed consensus algorithm", "weight": 0.3}, {"dimension": "Deadlock Prevention", "description": "Prevent deadlocks", "weight": 0.25}, {"dimension": "Performance", "description": "Fast lock acquisition", "weight": 0.25}, {"dimension": "Reliability", "description": "Handle failures", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Acquire exclusive lock",
        "Acquire shared lock",
        "Release lock",
        "Lock expiration (lease)",
        "Lock renewal",
        "Try-lock (non-blocking)",
        "Lock hierarchy to prevent deadlocks",
        "Deadlock detection"
      ],
      "non_functional": [
        "Support 1 million locks",
        "Lock acquisition within 50ms",
        "99.99% availability",
        "Handle network partitions",
        "Automatic lock release on failure",
        "10,000 lock operations per second",
        "Lock TTL: 1 second to 1 hour",
        "Maximum lock name: 256 characters",
        "Deadlock detection within 10 seconds"
      ],
      "out_of_scope": [
        "Distributed transactions",
        "Lock priority",
        "Lock queuing",
        "Cross-region locking",
        "Lock analytics"
      ]
    }'::jsonb
  ),
  (
    'Design a Real-time Analytics System',
    'Design a system that processes and analyzes events in real-time.',
    'hard',
    ARRAY['Analytics', 'Data', 'Infrastructure']::text[],
    '[{"dimension": "Stream Processing", "description": "Event processing pipeline", "weight": 0.3}, {"dimension": "Aggregation", "description": "Real-time aggregations", "weight": 0.25}, {"dimension": "Time Windows", "description": "Sliding and tumbling windows", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of events", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Process events in real-time",
        "Aggregate metrics (count, sum, avg, min, max)",
        "Support tumbling windows",
        "Support sliding windows",
        "Handle late-arriving events",
        "Query aggregated results",
        "Filter events",
        "Join multiple event streams"
      ],
      "non_functional": [
        "Process 10 million events per second",
        "End-to-end latency under 1 second",
        "99.9% availability",
        "Support 1000 different metrics",
        "Window size: 1 second to 1 hour",
        "Handle events up to 5 minutes late",
        "Event size: maximum 10KB",
        "Maximum 1000 concurrent queries",
        "Window size precision: 1 second"
      ],
      "out_of_scope": [
        "Complex event processing (CEP)",
        "Machine learning on streams",
        "Event replay",
        "Event sourcing",
        "Visualization dashboards"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Configuration Store',
    'Design a system to store and distribute configuration settings across services.',
    'medium',
    ARRAY['Infrastructure', 'DevOps', 'Cloud']::text[],
    '[{"dimension": "Change Distribution", "description": "Efficient config updates", "weight": 0.3}, {"dimension": "Versioning", "description": "Config version management", "weight": 0.25}, {"dimension": "Consistency", "description": "Consistent config across services", "weight": 0.25}, {"dimension": "Performance", "description": "Fast config access", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Store key-value configurations",
        "Get configuration by key",
        "Watch for configuration changes",
        "Version configurations",
        "Rollback to previous version",
        "Namespace configurations (per service)",
        "Validate configuration values",
        "Encrypt sensitive configurations"
      ],
      "non_functional": [
        "Store 1 million configuration keys",
        "Config update propagation within 1 second",
        "Read latency under 5ms",
        "99.99% availability",
        "Support 10,000 services",
        "Store 100 versions per key",
        "Config change notification within 500ms",
        "Key size: maximum 256 characters",
        "Value size: maximum 1MB",
        "Maximum 1000 watchers per key"
      ],
      "out_of_scope": [
        "Configuration templates",
        "A/B testing configurations",
        "Configuration analytics",
        "GraphQL API",
        "Configuration UI"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Tracing System',
    'Design a system to trace requests across multiple microservices.',
    'hard',
    ARRAY['Observability', 'Infrastructure', 'DevOps']::text[],
    '[{"dimension": "Span Collection", "description": "Efficient span ingestion", "weight": 0.3}, {"dimension": "Correlation", "description": "Trace correlation across services", "weight": 0.25}, {"dimension": "Storage", "description": "Trace storage and indexing", "weight": 0.25}, {"dimension": "Query Performance", "description": "Fast trace queries", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Collect spans from services",
        "Correlate spans into traces",
        "Query traces by trace ID",
        "Search traces by service, operation, tags",
        "Trace sampling (percentage-based)",
        "View trace timeline",
        "Trace visualization",
        "Export traces"
      ],
      "non_functional": [
        "Collect 100 million spans per day",
        "Store 7 days of traces",
        "Query trace within 1 second",
        "99.9% availability",
        "Support 1000 services",
        "Sampling rate: 1% to 100%",
        "Trace collection overhead under 1%",
        "Maximum span size: 64KB",
        "Maximum trace duration: 1 hour",
        "Maximum 1000 spans per trace"
      ],
      "out_of_scope": [
        "Real-time trace streaming",
        "Trace alerting",
        "Performance profiling",
        "Service dependency graphs",
        "Trace comparison"
      ]
    }'::jsonb
  ),
  (
    'Design a Feature Flag System',
    'Design a system to manage feature flags and A/B testing.',
    'medium',
    ARRAY['DevOps', 'SaaS', 'Product']::text[],
    '[{"dimension": "Targeting", "description": "User targeting logic", "weight": 0.3}, {"dimension": "Rollout", "description": "Gradual feature rollout", "weight": 0.25}, {"dimension": "Performance", "description": "Fast flag evaluation", "weight": 0.25}, {"dimension": "Real-time Updates", "description": "Flag update propagation", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Create and manage feature flags",
        "Enable/disable flags per user",
        "Target users by attributes (country, user_id, etc.)",
        "Gradual rollout (percentage-based)",
        "A/B testing (split traffic)",
        "Real-time flag updates",
        "Flag evaluation API",
        "Flag history and audit log"
      ],
      "non_functional": [
        "Evaluate 1 million flags per second",
        "Flag evaluation latency under 1ms",
        "Flag update propagation within 1 second",
        "99.99% availability",
        "Support 10,000 feature flags",
        "Support 100 million users",
        "Flag evaluation overhead under 0.1%",
        "Flag name: maximum 256 characters",
        "Maximum 100 targeting rules per flag",
        "Rollout percentage: 0-100%"
      ],
      "out_of_scope": [
        "Multi-variant testing (more than 2 variants)",
        "Flag analytics dashboard",
        "Flag dependency management",
        "Flag templates",
        "Flag scheduling"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed ID Generator',
    'Design a system to generate unique IDs across distributed systems.',
    'medium',
    ARRAY['Infrastructure', 'Database', 'Cloud']::text[],
    '[{"dimension": "Uniqueness", "description": "Guarantee unique IDs", "weight": 0.3}, {"dimension": "Performance", "description": "High ID generation rate", "weight": 0.3}, {"dimension": "Ordering", "description": "Time-ordered IDs", "weight": 0.2}, {"dimension": "Scalability", "description": "Distributed generation", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Generate unique 64-bit IDs",
        "IDs are time-ordered (roughly)",
        "No coordination between nodes",
        "Generate IDs at high rate",
        "ID format: timestamp + machine ID + sequence",
        "Handle clock skew"
      ],
      "non_functional": [
        "Generate 1 million IDs per second per node",
        "ID generation latency under 1ms",
        "Support 1000 nodes",
        "No ID collisions",
        "IDs valid for 69 years",
        "99.9% availability",
        "ID size: 64 bits",
        "Maximum 4096 IDs per millisecond per node",
        "Machine ID: 10 bits (1024 machines)"
      ],
      "out_of_scope": [
        "UUID generation",
        "Sequential IDs",
        "ID validation",
        "ID decoding",
        "ID range reservation"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Bloom Filter',
    'Design a distributed bloom filter for efficient membership testing.',
    'hard',
    ARRAY['Infrastructure', 'Data', 'Algorithms']::text[],
    '[{"dimension": "False Positive Rate", "description": "Minimize false positives", "weight": 0.3}, {"dimension": "Distributed Updates", "description": "Merge updates across nodes", "weight": 0.3}, {"dimension": "Performance", "description": "Fast add and test operations", "weight": 0.2}, {"dimension": "Memory Efficiency", "description": "Minimize memory usage", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Add element to bloom filter",
        "Test if element exists (may have false positives)",
        "Merge bloom filters from multiple nodes",
        "Clear bloom filter",
        "Get false positive rate",
        "Estimate number of elements"
      ],
      "non_functional": [
        "Support 1 billion elements",
        "Add operation latency under 10μs",
        "Test operation latency under 5μs",
        "False positive rate under 1%",
        "Memory usage: 10 bits per element",
        "99.9% availability",
        "False negatives: never",
        "False positives: configurable (0.1% to 10%)",
        "Maximum elements: 1 billion"
      ],
      "out_of_scope": [
        "Counting bloom filter",
        "Scalable bloom filter",
        "Deletion of elements",
        "Bloom filter compression",
        "Bloom filter persistence"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Graph Database',
    'Design a distributed graph database for storing and querying relationships.',
    'hard',
    ARRAY['Database', 'Social', 'Data']::text[],
    '[{"dimension": "Graph Storage", "description": "Efficient node and edge storage", "weight": 0.3}, {"dimension": "Traversal", "description": "Fast graph traversal", "weight": 0.25}, {"dimension": "Partitioning", "description": "Graph partitioning strategy", "weight": 0.25}, {"dimension": "Query Language", "description": "Graph query interface", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Store nodes with properties",
        "Store edges with properties",
        "Traverse graph (BFS, DFS)",
        "Find shortest path between nodes",
        "Query neighbors of a node",
        "Query nodes by properties",
        "Add and delete nodes/edges",
        "Support directed and undirected edges"
      ],
      "non_functional": [
        "Store 1 billion nodes",
        "Store 10 billion edges",
        "Traverse 1 million nodes within 1 second",
        "Shortest path query within 5 seconds",
        "99.9% availability",
        "Support 1000 concurrent queries",
        "Maximum node properties: 100",
        "Maximum edge properties: 50",
        "Maximum path length: 1000 hops"
      ],
      "out_of_scope": [
        "Graph algorithms (PageRank, etc.)",
        "Graph visualization",
        "Graph analytics",
        "Temporal graphs",
        "Graph versioning"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Hash Table',
    'Design a DHT (Distributed Hash Table) for peer-to-peer storage.',
    'hard',
    ARRAY['Infrastructure', 'P2P', 'Networking']::text[],
    '[{"dimension": "Routing", "description": "Efficient key lookup", "weight": 0.3}, {"dimension": "Churn Handling", "description": "Handle node failures", "weight": 0.3}, {"dimension": "Consistency", "description": "Data consistency", "weight": 0.2}, {"dimension": "Performance", "description": "Low lookup latency", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Store key-value pairs",
        "Lookup value by key",
        "Node joining the network",
        "Node leaving the network",
        "Maintain routing table",
        "Replicate data for redundancy",
        "Handle node failures"
      ],
      "non_functional": [
        "Support 1 million nodes",
        "Lookup latency: O(log N) hops",
        "Store 1TB of data",
        "Handle 10% node churn per hour",
        "Data replication: 3 copies",
        "99% data availability",
        "Key size: 256 bits",
        "Value size: maximum 1MB",
        "Routing table size: O(log N)"
      ],
      "out_of_scope": [
        "Strong consistency",
        "ACID transactions",
        "Range queries",
        "Data versioning",
        "Access control"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Scheduler',
    'Design a distributed job scheduler that schedules and executes tasks across multiple machines.',
    'hard',
    ARRAY['Infrastructure', 'Cloud', 'DevOps']::text[],
    '[{"dimension": "Scheduling Algorithm", "description": "Job scheduling strategy", "weight": 0.3}, {"dimension": "Resource Allocation", "description": "Efficient resource usage", "weight": 0.25}, {"dimension": "Reliability", "description": "Handle failures", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle thousands of jobs", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Schedule one-time jobs",
        "Schedule recurring jobs (cron-like)",
        "Execute jobs on worker nodes",
        "Job dependencies (run after other jobs)",
        "Resource allocation (CPU, memory)",
        "Job retry on failure",
        "Job cancellation",
        "Job status tracking"
      ],
      "non_functional": [
        "Schedule 1 million jobs per day",
        "Support 10,000 concurrent jobs",
        "Job scheduling latency under 100ms",
        "99.9% availability",
        "Support 1000 worker nodes",
        "Job execution overhead under 5%",
        "Maximum job duration: 24 hours",
        "Maximum job dependencies: 100",
        "Cron expression: standard format"
      ],
      "out_of_scope": [
        "Job priority",
        "Job queuing",
        "Job cost optimization",
        "Job analytics",
        "Job templates"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Consensus System',
    'Design a distributed consensus system using algorithms like Raft or Paxos.',
    'hard',
    ARRAY['Infrastructure', 'Database', 'Algorithms']::text[],
    '[{"dimension": "Leader Election", "description": "Efficient leader selection", "weight": 0.3}, {"dimension": "Log Replication", "description": "Replicate log entries", "weight": 0.3}, {"dimension": "Fault Tolerance", "description": "Handle node failures", "weight": 0.25}, {"dimension": "Performance", "description": "Low latency consensus", "weight": 0.15}]'::jsonb,
    '{
      "functional": [
        "Elect leader among nodes",
        "Replicate log entries to followers",
        "Reach consensus on values",
        "Handle leader failures",
        "Prevent split-brain",
        "Read from leader",
        "Write through leader"
      ],
      "non_functional": [
        "Support 5-100 nodes in cluster",
        "Consensus latency under 100ms",
        "Handle up to (N-1)/2 node failures",
        "99.9% availability",
        "Replicate 10,000 entries per second",
        "Leader election within 5 seconds",
        "Minimum 3 nodes for fault tolerance",
        "Majority voting required",
        "Log entries: maximum 1MB each"
      ],
      "out_of_scope": [
        "Multi-region consensus",
        "Dynamic membership",
        "Snapshot and compaction",
        "Read replicas",
        "Consensus on large values"
      ]
    }'::jsonb
  ),
  (
    'Design a Distributed Transaction System',
    'Design a system that supports distributed transactions across multiple services.',
    'hard',
    ARRAY['Infrastructure', 'Database', 'Fintech']::text[],
    '[{"dimension": "ACID Properties", "description": "Atomicity, consistency, isolation, durability", "weight": 0.3}, {"dimension": "Failure Handling", "description": "Handle node failures", "weight": 0.3}, {"dimension": "Performance", "description": "Low transaction overhead", "weight": 0.2}, {"dimension": "Scalability", "description": "Handle many transactions", "weight": 0.2}]'::jsonb,
    '{
      "functional": [
        "Begin distributed transaction",
        "Participate in two-phase commit",
        "Commit transaction",
        "Rollback transaction",
        "Handle transaction timeout",
        "Transaction isolation levels",
        "Deadlock detection",
        "Transaction logging"
      ],
      "non_functional": [
        "Support 100,000 transactions per second",
        "Transaction commit latency under 100ms",
        "99.9% availability",
        "Support 100 participating services",
        "Transaction timeout: 30 seconds",
        "Zero data loss",
        "Maximum transaction duration: 30 seconds",
        "Maximum 100 participants per transaction",
        "Two-phase commit protocol"
      ],
      "out_of_scope": [
        "Saga pattern",
        "Compensating transactions",
        "Long-running transactions",
        "Nested transactions",
        "Transaction analytics"
      ]
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
