# Client-Side Caching Guide for Al-Quran API

## Overview

The Al-Quran API implements server-side caching, but implementing client-side caching can dramatically improve performance and reduce API calls.

## Current Server-Side Caching

- **Cache Duration**: 1 hour for all endpoints
- **Cache Type**: Public (CDN + browser caching)
- **Global CDN**: Cloudflare edge locations (200+ worldwide)
- **Response Time**: 50-100ms for cached requests

## Recommended Client-Side Strategies

### 1. Browser localStorage Caching

```javascript
class QuranAPICache {
  constructor(baseURL = 'https://quran-api.asrulmunir.workers.dev') {
    this.baseURL = baseURL;
    this.cachePrefix = 'quran-api-cache';
    this.defaultTTL = 3600000; // 1 hour in milliseconds
  }

  // Cache durations by endpoint type
  getCacheDuration(endpoint) {
    if (endpoint.includes('/chapters') || endpoint.includes('/verses') || endpoint.includes('/compare')) {
      return 86400000; // 24 hours for Quran content
    }
    if (endpoint.includes('/info') || endpoint.includes('/stats') || endpoint.includes('/translations')) {
      return 43200000; // 12 hours for static data
    }
    return this.defaultTTL; // 1 hour for search results
  }

  // Get from cache
  get(endpoint) {
    try {
      const cacheKey = `${this.cachePrefix}-${endpoint}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  // Set cache
  set(endpoint, data) {
    try {
      const cacheKey = `${this.cachePrefix}-${endpoint}`;
      const ttl = this.getCacheDuration(endpoint);
      
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
        endpoint
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  // API call with caching
  async fetch(endpoint) {
    // Try cache first
    const cached = this.get(endpoint);
    if (cached) {
      console.log(`Cache hit: ${endpoint}`);
      return cached;
    }

    // Fetch from API
    console.log(`Cache miss: ${endpoint}`);
    const response = await fetch(`${this.baseURL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    this.set(endpoint, data);
    
    return data;
  }

  // Clear cache
  clear(pattern = null) {
    if (!pattern) {
      // Clear all cache
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.cachePrefix))
        .forEach(key => localStorage.removeItem(key));
    } else {
      // Clear specific pattern
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.cachePrefix) && key.includes(pattern))
        .forEach(key => localStorage.removeItem(key));
    }
  }
}

// Usage example
const api = new QuranAPICache();

// Get Al-Fatihah (will cache for 24 hours)
const chapter1 = await api.fetch('/api/chapters/1');

// Get API info (will cache for 12 hours)
const info = await api.fetch('/api/info');

// Search (will cache for 1 hour)
const searchResults = await api.fetch('/api/search?q=الله&limit=10');
```

### 2. React Hook for Caching

```javascript
import { useState, useEffect, useCallback } from 'react';

function useQuranAPI(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { 
    cache = true, 
    cacheDuration = 3600000,
    baseURL = 'https://quran-api.asrulmunir.workers.dev'
  } = options;

  const fetchData = useCallback(async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (cache) {
        const cacheKey = `quran-api-${endpoint}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheDuration) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }
      }

      // Fetch from API
      const response = await fetch(`${baseURL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);

      // Cache the result
      if (cache) {
        const cacheKey = `quran-api-${endpoint}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, cache, cacheDuration, baseURL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Usage in React component
function ChapterComponent({ chapterNumber }) {
  const { data: chapter, loading, error } = useQuranAPI(
    `/api/chapters/${chapterNumber}`,
    { cacheDuration: 86400000 } // 24 hours
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>{chapter.name}</h2>
      {chapter.verses.map(verse => (
        <p key={verse.number}>{verse.text}</p>
      ))}
    </div>
  );
}
```

### 3. Service Worker Caching

```javascript
// sw.js - Service Worker for offline caching
const CACHE_NAME = 'quran-api-v1';
const API_BASE = 'https://quran-api.asrulmunir.workers.dev';

// Cache strategies by endpoint
const CACHE_STRATEGIES = {
  // Long-term cache for Quran content
  LONG_TERM: [
    '/api/chapters',
    '/api/chapters/',
    '/api/verses/',
    '/api/compare/',
    '/api/info',
    '/api/stats',
    '/api/translations'
  ],
  
  // Short-term cache for search
  SHORT_TERM: [
    '/api/search'
  ]
};

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle API requests
  if (!url.href.startsWith(API_BASE)) {
    return;
  }

  const path = url.pathname;
  
  // Determine cache strategy
  let strategy = 'SHORT_TERM';
  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => path.startsWith(pattern))) {
      strategy = strategyName;
      break;
    }
  }

  if (strategy === 'LONG_TERM') {
    // Cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(response => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
              return response;
            });
        })
    );
  } else {
    // Network first, then cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});
```

## Performance Benefits

### Without Client-Side Caching
- **First request**: 200-500ms
- **Subsequent requests**: 50-100ms (CDN cache)
- **API calls**: Every request hits the API

### With Client-Side Caching
- **First request**: 200-500ms
- **Cached requests**: 0-5ms (localStorage/memory)
- **API calls**: Reduced by 80-95%

## Cache Invalidation Strategies

### 1. Time-Based (Current)
```javascript
// Automatic expiration after TTL
if (Date.now() - timestamp > ttl) {
  cache.delete(key);
}
```

### 2. Version-Based
```javascript
// Include API version in cache key
const cacheKey = `quran-api-v1.0.0-${endpoint}`;
```

### 3. Manual Invalidation
```javascript
// Clear cache when needed
api.clear(); // Clear all
api.clear('/search'); // Clear search cache only
```

## Best Practices

### 1. Cache Duration Guidelines
- **Quran content**: 24 hours (content never changes)
- **API metadata**: 12 hours (rarely changes)
- **Search results**: 1 hour (may vary by user)

### 2. Storage Limits
- **localStorage**: ~5-10MB limit
- **Memory cache**: Limited by available RAM
- **Service Worker**: ~50MB+ (varies by browser)

### 3. Error Handling
```javascript
try {
  const data = await api.fetch('/api/chapters/1');
} catch (error) {
  // Fallback to cache even if expired
  const cached = api.get('/api/chapters/1', { ignoreExpiry: true });
  if (cached) {
    return cached;
  }
  throw error;
}
```

### 4. Cache Warming
```javascript
// Pre-load frequently accessed content
async function warmCache() {
  const commonEndpoints = [
    '/api/info',
    '/api/chapters',
    '/api/chapters/1', // Al-Fatihah
    '/api/chapters/2', // Al-Baqarah
    '/api/translations'
  ];
  
  await Promise.all(
    commonEndpoints.map(endpoint => api.fetch(endpoint))
  );
}
```

## Monitoring Cache Performance

```javascript
class CacheMetrics {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }

  recordHit() { this.hits++; }
  recordMiss() { this.misses++; }
  recordError() { this.errors++; }

  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total * 100).toFixed(2) : 0;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: `${this.getHitRate()}%`,
      total: this.hits + this.misses
    };
  }
}

// Usage
const metrics = new CacheMetrics();
console.log('Cache performance:', metrics.getStats());
```

## Conclusion

Implementing client-side caching can dramatically improve the performance of applications using the Al-Quran API:

- **Reduced latency**: 0-5ms for cached requests vs 50-500ms for API calls
- **Reduced bandwidth**: 80-95% fewer API requests
- **Offline capability**: Content available without internet connection
- **Better UX**: Instant responses for frequently accessed content
- **Cost efficiency**: Reduced API usage within rate limits

Choose the caching strategy that best fits your application architecture and user needs.
