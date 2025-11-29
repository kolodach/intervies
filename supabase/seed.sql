-- Insert sample problems
INSERT INTO problems (title, description, difficulty, categories, tags, sample_requirements, evaluation_criteria, requirements)
VALUES
  (
    'Design a URL Shortener',
    'Design a URL shortening service like bit.ly that takes long URLs and converts them to short URLs.',
    'easy',
    ARRAY['web services', 'storage'],
    ARRAY['url', 'shortener', 'hashing', 'database'],
    ARRAY['Shorten long URLs', 'Redirect short URLs to original URLs', 'Track click analytics', 'Custom short URLs'],
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
        "Analytics data can be eventually consistent"
      ],
      "constraints": [
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
    ARRAY['social media', 'storage', 'real-time'],
    ARRAY['photos', 'feed', 'followers', 'cdn'],
    ARRAY['Upload and store photos', 'Follow/unfollow users', 'News feed generation', 'Like and comment on photos', 'Search users and hashtags'],
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
        "Feed can be eventually consistent (few seconds delay acceptable)"
      ],
      "constraints": [
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
    ARRAY['streaming', 'storage', 'cdn'],
    ARRAY['video', 'streaming', 'encoding', 'cdn', 'recommendations'],
    ARRAY['Stream videos with minimal buffering', 'Upload and encode videos', 'Recommendation system', 'Support multiple devices', 'Handle millions of concurrent users'],
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
        "Encoding pipeline should process uploaded video within 24 hours"
      ],
      "constraints": [
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
  )
ON CONFLICT (id) DO NOTHING;

