const axios = require('axios');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Convert address to coordinates
  async geocodeAddress(address) {
    try {
      // Check if input is already coordinates (lat, lng format)
      const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
      const coordMatch = address.match(coordPattern);
      
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return {
            address: `Location (${lat}, ${lng})`,
            location: { lat, lng }
          };
        }
      }

      // If not coordinates, geocode the address
      if (!this.apiKey) {
        console.warn('Google Maps API key not found, using fallback coordinates');
        return {
          address: address,
          location: { lat: 12.8482, lng: 77.6577 } // Default Bangalore location
        };
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          address: response.data.results[0].formatted_address,
          location: {
            lat: location.lat,
            lng: location.lng
          }
        };
      } else {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return {
        address: address,
        location: { lat: 12.8482, lng: 77.6577 } // Fallback to Bangalore
      };
    }
  }

  // Get distance and duration between two points (CORE METHOD FOR DIJKSTRA)
  async getDistanceMatrix(origins, destinations) {
    try {
      if (!this.apiKey) {
        console.warn('Google Maps API key not found, using Haversine distance calculation');
        return this.calculateFallbackDistance(origins[0], destinations[0]);
      }

      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: originsStr,
          destinations: destinationsStr,
          units: 'metric',
          mode: 'driving',
          traffic_model: 'best_guess',
          departure_time: 'now',
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK') {
        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          return {
            distance: element.distance.value, // in meters
            duration: element.duration.value, // in seconds
            distanceText: element.distance.text,
            durationText: element.duration.text
          };
        } else {
          console.warn(`Distance calculation failed for specific route: ${element.status}`);
          return this.calculateFallbackDistance(origins[0], destinations[0]);
        }
      } else {
        console.warn(`Distance Matrix API error: ${response.data.status}`);
        return this.calculateFallbackDistance(origins[0], destinations[0]);
      }
    } catch (error) {
      console.error('Distance calculation error:', error.message);
      return this.calculateFallbackDistance(origins[0], destinations[0]);
    }
  }

  // Fallback distance calculation using Haversine formula
  calculateFallbackDistance(origin, destination) {
    const distance = this.calculateHaversineDistance(origin, destination);
    return {
      distance: distance * 1000, // convert km to meters
      duration: Math.round(distance * 120), // rough estimate: 2 minutes per km
      distanceText: `${distance.toFixed(1)} km`,
      durationText: `${Math.round(distance * 2)} mins`
    };
  }

  // Haversine distance calculation (km)
  calculateHaversineDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Batch distance calculation for multiple destinations
  async getMultipleDistances(origin, destinations) {
    try {
      const results = [];
      
      // Process in smaller batches to avoid API limits
      const batchSize = 10;
      for (let i = 0; i < destinations.length; i += batchSize) {
        const batch = destinations.slice(i, i + batchSize);
        
        for (const destination of batch) {
          const result = await this.getDistanceMatrix([origin], [destination]);
          results.push(result);
          
          // Small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Multiple distances calculation error:', error);
      return destinations.map(dest => this.calculateFallbackDistance(origin, dest));
    }
  }

  // Format duration from seconds to readable format
  formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  // Format distance from meters to readable format
  formatDistance(meters) {
    if (meters < 1000) {
      return `${meters} m`;
    } else {
      const kilometers = (meters / 1000).toFixed(1);
      return `${kilometers} km`;
    }
  }

  // Validate coordinates
  isValidCoordinate(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Get bounding box for a set of coordinates (useful for map visualization)
  getBoundingBox(locations) {
    if (locations.length === 0) return null;

    let minLat = locations[0].lat;
    let maxLat = locations[0].lat;
    let minLng = locations[0].lng;
    let maxLng = locations[0].lng;

    locations.forEach(location => {
      minLat = Math.min(minLat, location.lat);
      maxLat = Math.max(maxLat, location.lat);
      minLng = Math.min(minLng, location.lng);
      maxLng = Math.max(maxLng, location.lng);
    });

    return {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng,
      center: {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2
      }
    };
  }
}

module.exports = new GoogleMapsService();