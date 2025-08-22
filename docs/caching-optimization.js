// Optimized Caching Implementation for Al-Quran API
// This is an example of how to implement differentiated caching

// Cache strategy configuration
const CACHE_STRATEGIES = {
  // Static content that rarely changes - cache for 24 hours
  STATIC: {
    maxAge: 86400, // 24 hours
    endpoints: [
      '/api/info',
      '/api/chapters',
      '/api/stats', 
      '/api/translations',
      '/api/LLM',
      '/api/spec'
    ]
  },
  
  // Quran content that never changes - cache for 7 days
  CONTENT: {
    maxAge: 604800, // 7 days
    endpoints: [
      '/api/chapters/{id}',
      '/api/verses/{chapter}/{verse}',
      '/api/compare/{chapter}/{verse}'
    ]
  },
  
  // Search results that may vary - cache for 1 hour
  SEARCH: {
    maxAge: 3600, // 1 hour
    endpoints: [
      '/api/search',
      '/api/search/translation'
    ]
  }
};

// Determine cache strategy for endpoint
function getCacheStrategy(path) {
  // Check for exact matches first
  for (const [strategy, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.endpoints.includes(path)) {
      return config;
    }
  }
  
  // Check for pattern matches
  if (path.match(/^\/api\/chapters\/\d+$/)) {
    return CACHE_STRATEGIES.CONTENT;
  }
  
  if (path.match(/^\/api\/verses\/\d+\/\d+$/)) {
    return CACHE_STRATEGIES.CONTENT;
  }
  
  if (path.match(/^\/api\/compare\/\d+\/\d+$/)) {
    return CACHE_STRATEGIES.CONTENT;
  }
  
  // Default to search strategy
  return CACHE_STRATEGIES.SEARCH;
}

// Generate ETag for content
function generateETag(content) {
  // Simple hash-based ETag
  const hash = btoa(JSON.stringify(content)).slice(0, 16);
  return `"${hash}"`;
}

// Enhanced CORS headers with optimized caching
function addOptimizedCorsHeaders(response, path, content) {
  const strategy = getCacheStrategy(path);
  const etag = generateETag(content);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Cache-Control, If-None-Match',
    'Access-Control-Expose-Headers': 'ETag, Cache-Control, Last-Modified',
    
    // Optimized cache headers
    'Cache-Control': `public, max-age=${strategy.maxAge}, s-maxage=${strategy.maxAge}`,
    'ETag': etag,
    'Last-Modified': 'Wed, 22 Aug 2024 00:00:00 GMT', // API deployment date
    'Vary': 'Accept-Encoding',
    
    // Additional performance headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
  
  // Add headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Handle conditional requests
function handleConditionalRequest(request, content) {
  const ifNoneMatch = request.headers.get('If-None-Match');
  const ifModifiedSince = request.headers.get('If-Modified-Since');
  
  if (ifNoneMatch) {
    const etag = generateETag(content);
    if (ifNoneMatch === etag) {
      return new Response(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  }
  
  if (ifModifiedSince) {
    const lastModified = new Date('2024-08-22T00:00:00Z');
    const ifModifiedSinceDate = new Date(ifModifiedSince);
    
    if (lastModified <= ifModifiedSinceDate) {
      return new Response(null, { 
        status: 304,
        headers: {
          'Last-Modified': lastModified.toUTCString(),
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  }
  
  return null; // No conditional response needed
}

// Example usage in main handler
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle conditional requests first
  const conditionalResponse = handleConditionalRequest(request, null);
  if (conditionalResponse) {
    return conditionalResponse;
  }
  
  // Process normal request
  let response;
  
  if (path === '/api/info') {
    const data = {
      name: "Al-Quran API",
      chapterCount: 114,
      verseCount: 6236,
      // ... other data
    };
    
    response = new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Add optimized caching headers
  return addOptimizedCorsHeaders(response, path, response.body);
}

// Client-side caching recommendations
const CLIENT_SIDE_CACHING = {
  // Browser localStorage caching
  localStorage: {
    key: 'al-quran-api-cache',
    duration: 3600000, // 1 hour in milliseconds
    
    set(endpoint, data) {
      const cacheData = {
        data,
        timestamp: Date.now(),
        endpoint
      };
      localStorage.setItem(`${this.key}-${endpoint}`, JSON.stringify(cacheData));
    },
    
    get(endpoint) {
      const cached = localStorage.getItem(`${this.key}-${endpoint}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.duration) {
        localStorage.removeItem(`${this.key}-${endpoint}`);
        return null;
      }
      
      return data;
    }
  },
  
  // Memory caching for applications
  memory: {
    cache: new Map(),
    duration: 3600000, // 1 hour
    
    set(key, data) {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    },
    
    get(key) {
      const cached = this.cache.get(key);
      if (!cached) return null;
      
      if (Date.now() - cached.timestamp > this.duration) {
        this.cache.delete(key);
        return null;
      }
      
      return cached.data;
    }
  }
};

export {
  CACHE_STRATEGIES,
  getCacheStrategy,
  generateETag,
  addOptimizedCorsHeaders,
  handleConditionalRequest,
  CLIENT_SIDE_CACHING
};
