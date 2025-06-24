import axios from 'axios';

// FIXED: Point to your actual backend URL
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://graphs.trou.hackclub.app/api'  // Your actual backend
  : 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error Details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            baseURL: error.config?.baseURL
          }
        });

        // Create more descriptive error messages
        let errorMessage = 'API request failed';
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          errorMessage = `Cannot connect to backend server at ${API_BASE}. Make sure the server is running.`;
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout - server took too long to respond';
        } else if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const serverMessage = error.response.data?.message || error.response.statusText;
          
          switch (status) {
            case 404:
              errorMessage = `API endpoint not found: ${error.config?.url}`;
              break;
            case 500:
              errorMessage = `Server error: ${serverMessage}`;
              break;
            case 400:
              errorMessage = `Bad request: ${serverMessage}`;
              break;
            default:
              errorMessage = `HTTP ${status}: ${serverMessage}`;
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = `No response from server at ${API_BASE}. Check if backend is running and accessible.`;
        }

        const enhancedError = new Error(errorMessage);
        enhancedError.originalError = error;
        enhancedError.isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK';
        
        throw enhancedError;
      }
    );

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request setup error:', error);
        return Promise.reject(error);
      }
    );
  }

  // System endpoints
  async getSystemInfo() {
    try {
      const response = await this.client.get('/system/info');
      return response.data;
    } catch (error) {
      // Provide fallback data for offline mode
      if (error.isNetworkError) {
        console.warn('Using fallback system info due to network error');
        return {
          success: true,
          data: {
            totalPartners: 0,
            availablePartners: 0,
            totalOrders: 0,
            pendingOrders: 0,
            assignedOrders: 0
          }
        };
      }
      throw error;
    }
  }

  async initDemoData() {
    const response = await this.client.post('/system/init-demo');
    return response.data;
  }

  async resetSystem() {
    const response = await this.client.post('/system/reset');
    return response.data;
  }

  async clearSystem() {
    const response = await this.client.post('/system/clear');
    return response.data;
  }

  // Partners endpoints
  async getPartners() {
    try {
      const response = await this.client.get('/partners');
      return response.data;
    } catch (error) {
      if (error.isNetworkError) {
        console.warn('Using empty partners array due to network error');
        return { success: true, data: [], count: 0 };
      }
      throw error;
    }
  }

  async getPartner(id) {
    const response = await this.client.get(`/partners/${id}`);
    return response.data;
  }

  async createPartner(partnerData) {
    const response = await this.client.post('/partners', partnerData);
    return response.data;
  }

  async updatePartner(id, updates) {
    const response = await this.client.put(`/partners/${id}`, updates);
    return response.data;
  }

  async deletePartner(id) {
    const response = await this.client.delete(`/partners/${id}`);
    return response.data;
  }

  async getPartnerStats() {
    const response = await this.client.get('/partners/stats/overview');
    return response.data;
  }

  // Orders endpoints
  async getOrders() {
    try {
      const response = await this.client.get('/orders');
      return response.data;
    } catch (error) {
      if (error.isNetworkError) {
        console.warn('Using empty orders array due to network error');
        return { success: true, data: [], count: 0 };
      }
      throw error;
    }
  }

  async getOrder(id) {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(orderData) {
    const response = await this.client.post('/orders', orderData);
    return response.data;
  }

  async updateOrder(id, updates) {
    const response = await this.client.put(`/orders/${id}`, updates);
    return response.data;
  }

  async deleteOrder(id) {
    const response = await this.client.delete(`/orders/${id}`);
    return response.data;
  }

  async getOrderStats() {
    const response = await this.client.get('/orders/stats/overview');
    return response.data;
  }

  // MAIN DIJKSTRA OPTIMIZATION ENDPOINT
  async optimizeRoute(partnerId, orderIds) {
    const response = await this.client.post('/orders/optimize-route', {
      partnerId,
      orderIds
    });
    return response.data;
  }

  // AUTO ASSIGNMENT ENDPOINT
  async autoAssignOrders() {
    const response = await this.client.post('/orders/auto-assign');
    return response.data;
  }

  // Get optimization details for a partner
  async getOptimizationDetails(partnerId) {
    const response = await this.client.get(`/orders/optimization/${partnerId}`);
    return response.data;
  }

  // Debug endpoints
  async getGraphData() {
    const response = await this.client.get('/debug/graph-data');
    return response.data;
  }

  async getHealthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  // Test connection method
  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return {
        connected: true,
        message: 'Backend connection successful',
        data: response.data
      };
    } catch (error) {
      return {
        connected: false,
        message: error.message,
        error: error
      };
    }
  }

  // Get current API base URL
  getApiBaseUrl() {
    return API_BASE;
  }

  // Utility methods
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

  formatDistance(meters) {
    if (meters < 1000) {
      return `${meters} m`;
    } else {
      const kilometers = (meters / 1000).toFixed(1);
      return `${kilometers} km`;
    }
  }

  formatCoordinates(location) {
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  }
}

export const apiService = new ApiService();
export default apiService;