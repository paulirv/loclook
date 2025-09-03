/**
 * Cloudflare Worker for Location Lookup
 * 
 * This worker provides an endpoint to retrieve user location information
 * using Cloudflare's request headers (cf-ipcountry, cf-region-code, etc.)
 */

/**
 * Calculate data quality score based on available location fields
 */
function calculateDataQuality(headers) {
  const fields = [
    'CF-IPCountry',
    'CF-Region', 
    'CF-IPCity',
    'CF-IPLatitude',
    'CF-IPLongitude',
    'CF-Timezone',
    'CF-IPPostalCode'
  ];
  
  const availableFields = fields.filter(field => headers.get(field)).length;
  const totalFields = fields.length;
  const percentage = Math.round((availableFields / totalFields) * 100);
  
  let quality = 'unknown';
  if (percentage >= 80) quality = 'excellent';
  else if (percentage >= 60) quality = 'good';
  else if (percentage >= 40) quality = 'fair';
  else if (percentage >= 20) quality = 'limited';
  else quality = 'minimal';
  
  return {
    score: percentage,
    level: quality,
    availableFields: availableFields,
    totalFields: totalFields
  };
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    const url = new URL(request.url);
    
    // Route handling
    if (url.pathname === '/location' || url.pathname === '/') {
      return handleLocationRequest(request);
    }
    
    // Enhanced location with fallback
    if (url.pathname === '/location-enhanced') {
      return handleEnhancedLocationRequest(request, env);
    }
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        }
      });
    }

    // 404 for unknown routes
    return new Response('Not Found', { 
      status: 404,
      headers: getCORSHeaders()
    });
  },
};

/**
 * Handle enhanced location lookup with fallback
 */
async function handleEnhancedLocationRequest(request, env) {
  try {
    const locationData = extractLocationData(request);
    
    // If we have minimal data, try to enhance it
    if (locationData.dataQuality.level === 'minimal' || locationData.dataQuality.level === 'limited') {
      try {
        // Use ipapi.co as fallback (free tier allows 1000 requests/day)
        const fallbackResponse = await fetch(`https://ipapi.co/${locationData.ip}/json/`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          // Merge fallback data where CF data is missing
          locationData.fallback = {
            source: 'ipapi.co',
            city: fallbackData.city || null,
            region: fallbackData.region || null,
            latitude: fallbackData.latitude || null,
            longitude: fallbackData.longitude || null,
            timezone: fallbackData.timezone || null,
            postalCode: fallbackData.postal || null,
            org: fallbackData.org || null
          };
          
          // Update main fields if they were null
          if (!locationData.city) locationData.city = fallbackData.city;
          if (!locationData.region) locationData.region = fallbackData.region;
          if (!locationData.latitude) locationData.latitude = fallbackData.latitude;
          if (!locationData.longitude) locationData.longitude = fallbackData.longitude;
          if (!locationData.timezone) locationData.timezone = fallbackData.timezone;
          if (!locationData.postalCode) locationData.postalCode = fallbackData.postal;
          
          // Recalculate data quality
          locationData.dataQuality.enhanced = true;
          locationData.dataQuality.enhancedScore = calculateEnhancedDataQuality(locationData);
        }
      } catch (fallbackError) {
        locationData.fallbackError = fallbackError.message;
      }
    }
    
    return new Response(JSON.stringify(locationData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to process enhanced location request',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  }
}

/**
 * Handle location lookup requests
 */
function handleLocationRequest(request) {
  try {
    const locationData = extractLocationData(request);
    
    return new Response(JSON.stringify(locationData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to process location request',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  }
}

/**
 * Extract location information from Cloudflare headers
 */
function extractLocationData(request) {
  const headers = request.headers;
  
  // Get the user's IP address
  const ip = headers.get('CF-Connecting-IP') || 
             headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
             'unknown';

  // Extract Cloudflare location headers
  const locationData = {
    ip: ip,
    country: headers.get('CF-IPCountry') || null,
    region: headers.get('CF-Region') || null,
    regionCode: headers.get('CF-Region-Code') || null,
    city: headers.get('CF-IPCity') || null,
    postalCode: headers.get('CF-postal-code') || null,
    timezone: headers.get('CF-Timezone') || null,
    latitude: headers.get('CF-IPLatitude') || null,
    longitude: headers.get('CF-IPLongitude') || null,
    metroCode: headers.get('CF-MetroCode') || null,
    continent: headers.get('CF-IPContinent') || null,
    asn: headers.get('CF-ASN') || null,
    colo: headers.get('CF-Ray')?.split('-')[1] || null, // Cloudflare data center
    
    // Additional metadata
    timestamp: new Date().toISOString(),
    userAgent: headers.get('User-Agent') || null,
    acceptLanguage: headers.get('Accept-Language') || null,
    
    // Request information
    requestId: headers.get('CF-Ray') || null,
    visitorId: headers.get('CF-Visitor') || null,
    
    // IP type detection
    ipType: ip.includes(':') ? 'IPv6' : 'IPv4',
    
    // Data completeness indicator
    dataQuality: calculateDataQuality(headers)
  };

  // Parse numeric values
  if (locationData.latitude) {
    locationData.latitude = parseFloat(locationData.latitude);
  }
  if (locationData.longitude) {
    locationData.longitude = parseFloat(locationData.longitude);
  }
  if (locationData.metroCode) {
    locationData.metroCode = parseInt(locationData.metroCode, 10);
  }
  if (locationData.asn) {
    locationData.asn = parseInt(locationData.asn, 10);
  }

  return locationData;
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: getCORSHeaders()
  });
}

/**
 * Calculate enhanced data quality score
 */
function calculateEnhancedDataQuality(locationData) {
  const mainFields = ['country', 'region', 'city', 'latitude', 'longitude', 'timezone', 'postalCode'];
  const availableFields = mainFields.filter(field => locationData[field] !== null).length;
  const percentage = Math.round((availableFields / mainFields.length) * 100);
  
  let quality = 'unknown';
  if (percentage >= 80) quality = 'excellent';
  else if (percentage >= 60) quality = 'good';
  else if (percentage >= 40) quality = 'fair';
  else if (percentage >= 20) quality = 'limited';
  else quality = 'minimal';
  
  return {
    score: percentage,
    level: quality,
    availableFields: availableFields,
    totalFields: mainFields.length
  };
}

/**
 * Get CORS headers for cross-origin requests
 */
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}
