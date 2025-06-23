import axios from 'axios';

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw new Error(error.response?.data?.message || error.message || 'API request failed');
      }
    );
  }

  // System endpoints
  async getSystemInfo() {
    const response = await this.client.get('/system/info');
    return response.data;
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
    const response = await this.client.get('/partners');
    return response.data;
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
    const response = await this.client.get('/orders');
    return response.data;
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
    const response = await this.client.get('/health');
    return response.data;
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