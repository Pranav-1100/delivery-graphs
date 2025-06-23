class DataStore {
  constructor() {
    this.partners = [];
    this.orders = [];
    this.nextPartnerId = 1;
    this.nextOrderId = 1;
  }

  // Partner Methods
  addPartner(partnerData) {
    const partner = {
      id: this.nextPartnerId++,
      name: partnerData.name,
      phone: partnerData.phone,
      currentLocation: partnerData.startLocation,
      homeBase: partnerData.startLocation,
      status: 'AVAILABLE', // AVAILABLE, ASSIGNED
      maxPackages: parseInt(process.env.MAX_PACKAGES_PER_PARTNER) || 5,
      maxDeliveryTime: (parseInt(process.env.MAX_DELIVERY_TIME_MINUTES) || 30) * 60, // 30 minutes in seconds
      maxWorkingTime: (parseInt(process.env.MAX_PARTNER_WORKING_TIME_MINUTES) || 30) * 60, // 30 minutes in seconds
      createdAt: new Date()
    };
    this.partners.push(partner);
    return partner;
  }

  getPartners() {
    return this.partners;
  }

  getPartnerById(id) {
    return this.partners.find(p => p.id === parseInt(id));
  }

  updatePartner(id, updates) {
    const partnerIndex = this.partners.findIndex(p => p.id === parseInt(id));
    if (partnerIndex !== -1) {
      this.partners[partnerIndex] = { ...this.partners[partnerIndex], ...updates };
      return this.partners[partnerIndex];
    }
    return null;
  }

  // Order Methods
  addOrder(orderData) {
    const order = {
      id: this.nextOrderId++,
      restaurantAddress: orderData.restaurantAddress,
      customerAddress: orderData.customerAddress,
      restaurantLocation: orderData.restaurantLocation,
      customerLocation: orderData.customerLocation,
      packageCount: orderData.packageCount,
      specialInstructions: orderData.specialInstructions || '',
      status: 'PENDING', // PENDING, ASSIGNED, OPTIMIZED
      assignedPartnerId: null,
      createdAt: new Date()
    };
    this.orders.push(order);
    return order;
  }

  getOrders() {
    return this.orders;
  }

  getOrderById(id) {
    return this.orders.find(o => o.id === parseInt(id));
  }

  updateOrder(id, updates) {
    const orderIndex = this.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex !== -1) {
      this.orders[orderIndex] = { ...this.orders[orderIndex], ...updates };
      return this.orders[orderIndex];
    }
    return null;
  }

  // Get orders assigned to a specific partner
  getPartnerOrders(partnerId) {
    return this.orders.filter(o => o.assignedPartnerId === parseInt(partnerId));
  }

  // Get available partners
  getAvailablePartners() {
    return this.partners.filter(p => p.status === 'AVAILABLE');
  }

  // Get pending orders
  getPendingOrders() {
    return this.orders.filter(o => o.status === 'PENDING');
  }

  // Reset all data
  clearAll() {
    this.partners = [];
    this.orders = [];
    this.nextPartnerId = 1;
    this.nextOrderId = 1;
  }

  // Get system stats
  getStats() {
    return {
      totalPartners: this.partners.length,
      availablePartners: this.getAvailablePartners().length,
      totalOrders: this.orders.length,
      pendingOrders: this.getPendingOrders().length,
      assignedOrders: this.orders.filter(o => o.status === 'ASSIGNED').length
    };
  }

  // Get delivery stats (alias for getStats - for compatibility)
  getDeliveryStats() {
    return this.getStats();
  }
}

// Create singleton instance
const dataStore = new DataStore();

module.exports = dataStore;