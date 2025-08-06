/**
 * Example client library for Cloudflare Location Lookup Worker
 * 
 * Usage:
 * const locationClient = new LocationClient('https://your-worker.workers.dev');
 * const location = await locationClient.getLocation();
 */

class LocationClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = options.timeout || 5000;
    this.cache = options.cache !== false; // Enable cache by default
    this.cacheKey = 'cf-location-data';
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes
  }

  /**
   * Get user location information
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Location data
   */
  async getLocation(options = {}) {
    // Check cache first
    if (this.cache && !options.fresh) {
      const cached = this.getCachedLocation();
      if (cached) {
        return cached;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/location`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the result
      if (this.cache) {
        this.setCachedLocation(data);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Check if the service is healthy
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Health check timeout');
      }
      throw error;
    }
  }

  /**
   * Get cached location data
   * @returns {Object|null} Cached location data or null
   */
  getCachedLocation() {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp > this.cacheTTL) {
        localStorage.removeItem(this.cacheKey);
        return null;
      }

      return data.location;
    } catch (error) {
      localStorage.removeItem(this.cacheKey);
      return null;
    }
  }

  /**
   * Cache location data
   * @param {Object} location - Location data to cache
   */
  setCachedLocation(location) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data = {
        location,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch (error) {
      // Ignore cache errors
    }
  }

  /**
   * Clear cached location data
   */
  clearCache() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.cacheKey);
    }
  }

  /**
   * Get simplified location string
   * @param {Object} location - Location data
   * @returns {string} Formatted location string
   */
  static formatLocation(location) {
    const parts = [];
    
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ') || 'Unknown Location';
  }

  /**
   * Check if location data indicates EU region
   * @param {Object} location - Location data
   * @returns {boolean} True if in EU
   */
  static isEU(location) {
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    return euCountries.includes(location.country);
  }

  /**
   * Get distance between two coordinates
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude  
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  static getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// React Hook example
function useLocation(workerUrl, options = {}) {
  const [location, setLocation] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const client = new LocationClient(workerUrl, options);
    
    client.getLocation()
      .then(data => {
        setLocation(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setLocation(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workerUrl]);

  const refresh = React.useCallback(() => {
    setLoading(true);
    setError(null);
    
    const client = new LocationClient(workerUrl, options);
    client.getLocation({ fresh: true })
      .then(data => {
        setLocation(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workerUrl, options]);

  return { location, loading, error, refresh };
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocationClient, useLocation };
}

if (typeof window !== 'undefined') {
  window.LocationClient = LocationClient;
  if (typeof window.React !== 'undefined') {
    window.useLocation = useLocation;
  }
}
