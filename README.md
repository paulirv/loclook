# Cloudflare Location Lookup Worker

A Cloudflare Worker that provides an endpoint to look up user location information using Cloudflare's built-in location headers.

## Features

- 🌍 **Location Detection**: Extracts comprehensive location data from Cloudflare headers
- 🚀 **Fast Response**: Minimal latency as data is available in request headers
- 🔒 **CORS Support**: Ready for client-side integration
- 📍 **Rich Data**: Provides country, region, city, coordinates, timezone, and more
- 🏥 **Health Check**: Built-in health monitoring endpoint

## Available Endpoints

### `GET /location` or `GET /`
Returns comprehensive location information for the requesting IP address.

**Response Example:**
```json
{
  "ip": "203.0.113.1",
  "country": "US",
  "region": "California", 
  "regionCode": "CA",
  "city": "San Francisco",
  "postalCode": "94102",
  "timezone": "America/Los_Angeles",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "metroCode": 807,
  "continent": "NA",
  "asn": 13335,
  "colo": "SFO",
  "timestamp": "2024-08-06T12:00:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "acceptLanguage": "en-US,en;q=0.9",
  "requestId": "1234567890abcdef-SFO",
  "visitorId": null
}
```

### `GET /health`
Health check endpoint that returns service status.

**Response Example:**
```json
{
  "status": "ok",
  "timestamp": "2024-08-06T12:00:00.000Z"
}
```

## Location Data Fields

| Field | Description | Example |
|-------|-------------|---------|
| `ip` | Client IP address | `"203.0.113.1"` |
| `country` | ISO 3166-1 alpha-2 country code | `"US"` |
| `region` | Region/state name | `"California"` |
| `regionCode` | Region/state code | `"CA"` |
| `city` | City name | `"San Francisco"` |
| `postalCode` | Postal/ZIP code | `"94102"` |
| `timezone` | IANA timezone identifier | `"America/Los_Angeles"` |
| `latitude` | Latitude coordinate | `37.7749` |
| `longitude` | Longitude coordinate | `-122.4194` |
| `metroCode` | Metro area code | `807` |
| `continent` | Continent code | `"NA"` |
| `asn` | Autonomous System Number | `13335` |
| `colo` | Cloudflare data center | `"SFO"` |

## Setup & Deployment

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Deploy to staging:**
   ```bash
   npm run deploy:staging
   ```

5. **Deploy to production:**
   ```bash
   npm run deploy:production
   ```

## Usage Examples

### JavaScript/Fetch
```javascript
async function getUserLocation() {
  try {
    const response = await fetch('https://your-worker-domain.workers.dev/location');
    const location = await response.json();
    console.log('User location:', location);
    return location;
  } catch (error) {
    console.error('Failed to get location:', error);
  }
}
```

### jQuery
```javascript
$.getJSON('https://your-worker-domain.workers.dev/location')
  .done(function(location) {
    console.log('User location:', location);
  })
  .fail(function() {
    console.log('Failed to get location');
  });
```

### React Hook
```javascript
import { useState, useEffect } from 'react';

function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://your-worker-domain.workers.dev/location')
      .then(response => response.json())
      .then(data => {
        setLocation(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { location, loading, error };
}
```

## Configuration

### Environment Variables
The worker supports different environments through `wrangler.toml`:

- **Staging**: `cf-location-lookup-staging`
- **Production**: `cf-location-lookup`

### Custom Domain
To use a custom domain, add to your `wrangler.toml`:

```toml
[env.production]
name = "cf-location-lookup"
routes = [
  { pattern = "api.yourdomain.com/location/*", zone_name = "yourdomain.com" }
]
```

## Privacy & Security

- **No Data Storage**: This worker doesn't store any user data
- **Header-Based**: Uses only Cloudflare-provided headers
- **CORS Enabled**: Supports cross-origin requests
- **No Authentication**: Public endpoint (add auth if needed)

## Limitations

- Location accuracy depends on Cloudflare's IP geolocation database
- Some fields may be `null` for certain IP ranges
- Enterprise Cloudflare plans provide more detailed location data

## Development

### Local Testing
```bash
npm run dev
```

This starts a local development server with hot reloading.

### Testing Endpoints
```bash
# Test location endpoint
curl http://localhost:8787/location

# Test health endpoint  
curl http://localhost:8787/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.