-- Insert sample problems
INSERT INTO problems (title, description, difficulty, categories, tags, sample_requirements, evaluation_criteria)
VALUES
  (
    'Design a URL Shortener',
    'Design a URL shortening service like bit.ly that takes long URLs and converts them to short URLs.',
    'easy',
    ARRAY['web services', 'storage'],
    ARRAY['url', 'shortener', 'hashing', 'database'],
    ARRAY['Shorten long URLs', 'Redirect short URLs to original URLs', 'Track click analytics', 'Custom short URLs'],
    '[{"dimension": "API Design", "description": "Clear REST API design", "weight": 0.25}, {"dimension": "Data Storage", "description": "Efficient storage strategy", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle high traffic", "weight": 0.25}, {"dimension": "Collision Handling", "description": "Handle hash collisions", "weight": 0.25}]'::jsonb
  ),
  (
    'Design Instagram',
    'Design a photo-sharing social media platform like Instagram.',
    'medium',
    ARRAY['social media', 'storage', 'real-time'],
    ARRAY['photos', 'feed', 'followers', 'cdn'],
    ARRAY['Upload and store photos', 'Follow/unfollow users', 'News feed generation', 'Like and comment on photos', 'Search users and hashtags'],
    '[{"dimension": "Architecture", "description": "Overall system design", "weight": 0.3}, {"dimension": "Storage", "description": "Photo and metadata storage", "weight": 0.25}, {"dimension": "Feed Generation", "description": "News feed algorithm", "weight": 0.25}, {"dimension": "Scalability", "description": "Handle millions of users", "weight": 0.2}]'::jsonb
  ),
  (
    'Design Netflix',
    'Design a video streaming service like Netflix.',
    'hard',
    ARRAY['streaming', 'storage', 'cdn'],
    ARRAY['video', 'streaming', 'encoding', 'cdn', 'recommendations'],
    ARRAY['Stream videos with minimal buffering', 'Upload and encode videos', 'Recommendation system', 'Support multiple devices', 'Handle millions of concurrent users'],
    '[{"dimension": "Video Delivery", "description": "CDN and streaming strategy", "weight": 0.3}, {"dimension": "Encoding", "description": "Video encoding and quality", "weight": 0.2}, {"dimension": "Recommendations", "description": "Content recommendation system", "weight": 0.2}, {"dimension": "Scalability", "description": "Global scale architecture", "weight": 0.3}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

