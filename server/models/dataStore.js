class DataStore {
  constructor() {
    this.partners = [];
    this.orders = [];
    this.optimizations = {}; 
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
      status: 'AVAILABLE',
      maxPackages: parseInt(process.env.MAX_PACKAGES_PER_PARTNER) || 5,
      maxDeliveryTime: (parseInt(process.env.MAX_DELIVERY_TIME_MINUTES) || 30) * 60,
      maxWorkingTime: (parseInt(process.env.MAX_PARTNER_WORKING_TIME_MINUTES) || 30) * 60,
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
      status: 'PENDING',
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

  // NEW: Optimization Results Storage
  storeOptimizationResult(partnerId, optimizationData) {
    const partnerIdNum = parseInt(partnerId);
    this.optimizations[partnerIdNum] = {
      ...optimizationData,
      timestamp: new Date(),
      partnerId: partnerIdNum
    };
    console.log(`📊 Stored optimization result for partner ${partnerIdNum}`);
  }

  getOptimizationResult(partnerId) {
    const partnerIdNum = parseInt(partnerId);
    const result = this.optimizations[partnerIdNum];
    if (result) {
      console.log(`📊 Retrieved stored optimization for partner ${partnerIdNum}`);
      return result;
    }
    console.log(`📊 No stored optimization found for partner ${partnerIdNum}`);
    return null;
  }

  clearOptimizationResult(partnerId) {
    const partnerIdNum = parseInt(partnerId);
    delete this.optimizations[partnerIdNum];
    console.log(`📊 Cleared optimization result for partner ${partnerIdNum}`);
  }

  getAllOptimizations() {
    return this.optimizations;
  }

  // Reset all data
  clearAll() {
    this.partners = [];
    this.orders = [];
    this.optimizations = {}; // Clear optimizations too
    this.nextPartnerId = 1;
    this.nextOrderId = 1;
  }

  // Reset assignments but keep partners and orders
  resetAssignments() {
    // Reset all partners to available
    this.partners.forEach(partner => {
      partner.status = 'AVAILABLE';
    });

    // Reset all orders to pending and unassign them
    this.orders.forEach(order => {
      order.status = 'PENDING';
      order.assignedPartnerId = null;
    });

    // Clear all optimization results
    this.optimizations = {};
    
    console.log('🔄 Reset all assignments and cleared optimization results');
  }

  // Get system stats
  getStats() {
    return {
      totalPartners: this.partners.length,
      availablePartners: this.getAvailablePartners().length,
      totalOrders: this.orders.length,
      pendingOrders: this.getPendingOrders().length,
      assignedOrders: this.orders.filter(o => o.status === 'ASSIGNED').length,
      optimizationsStored: Object.keys(this.optimizations).length
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