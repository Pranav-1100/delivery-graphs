const express = require('express');
const router = express.Router();
const dataStore = require('../models/dataStore');
const dijkstraOptimizer = require('../services/dijkstraOptimizer');
const googleMaps = require('../utils/googleMaps');

// GET /api/orders/stats/overview - Get order statistics (MUST BE BEFORE /:id)
router.get('/stats/overview', (req, res) => {
  try {
    const orders = dataStore.getOrders();
    
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      assignedOrders: orders.filter(o => o.status === 'ASSIGNED').length,
      optimizedOrders: orders.filter(o => o.status === 'OPTIMIZED').length,
      totalPackages: orders.reduce((sum, o) => sum + o.packageCount, 0),
      averagePackagesPerOrder: orders.length > 0 ? 
        orders.reduce((sum, o) => sum + o.packageCount, 0) / orders.length : 0,
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'PENDING').map(o => ({ id: o.id, packages: o.packageCount })),
        assigned: orders.filter(o => o.status === 'ASSIGNED').map(o => ({ id: o.id, partnerId: o.assignedPartnerId, packages: o.packageCount }))
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get order stats',
      error: error.message
    });
  }
});

// POST /api/orders/auto-assign - IMPROVED Auto assign with better distribution
router.post('/auto-assign', async (req, res) => {
  try {
    console.log(`\n🤖 IMPROVED AUTO ASSIGNMENT with 30-minute constraints`);
    
    const availablePartners = dataStore.getAvailablePartners();
    const pendingOrders = dataStore.getPendingOrders();
    
    if (availablePartners.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available partners for auto assignment'
      });
    }
    
    if (pendingOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending orders for auto assignment'
      });
    }

    console.log(`Available partners: ${availablePartners.length}`);
    console.log(`Pending orders: ${pendingOrders.length}`);

    // IMPROVED DISTRIBUTION ALGORITHM
    const assignments = [];
    const remainingOrders = [...pendingOrders];
    
    // Try to assign orders to each partner fairly
    for (const partner of availablePartners) {
      if (remainingOrders.length === 0) break;
      
      console.log(`\n🔍 Evaluating partner: ${partner.name}`);
      
      // Find best combination of orders for this partner within constraints
      const bestCombination = await router.findBestOrderCombination(partner, remainingOrders);
      
      if (bestCombination.orders.length > 0) {
        console.log(`✅ Assigning ${bestCombination.orders.length} orders to ${partner.name} (${bestCombination.totalPackages}/${partner.maxPackages} packages, ~${Math.round(bestCombination.estimatedTime/60)} min)`);
        
        assignments.push({
          partnerId: partner.id,
          partnerName: partner.name,
          orderIds: bestCombination.orders.map(o => o.id),
          totalPackages: bestCombination.totalPackages,
          estimatedTime: bestCombination.estimatedTime
        });
        
        // Remove assigned orders from remaining pool
        bestCombination.orders.forEach(assignedOrder => {
          const index = remainingOrders.findIndex(o => o.id === assignedOrder.id);
          if (index > -1) {
            remainingOrders.splice(index, 1);
          }
        });
      } else {
        console.log(`❌ No suitable orders found for ${partner.name} within 30-minute constraints`);
      }
    }

    if (assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid assignments found within 30-minute time constraints. Consider adding more partners or reducing order complexity.'
      });
    }

    console.log(`\n📊 ASSIGNMENT SUMMARY:`);
    console.log(`   Partners used: ${assignments.length}/${availablePartners.length}`);
    console.log(`   Orders assigned: ${assignments.reduce((sum, a) => sum + a.orderIds.length, 0)}/${pendingOrders.length}`);
    console.log(`   Remaining orders: ${remainingOrders.length}`);

    // Execute the best assignment (prioritize the one with most orders)
    const bestAssignment = assignments.sort((a, b) => b.orderIds.length - a.orderIds.length)[0];
    
    console.log(`\n🚀 Executing assignment: ${bestAssignment.partnerName} with ${bestAssignment.orderIds.length} orders`);

    // Run Dijkstra optimization for the best assignment
    const result = await dijkstraOptimizer.assignOrdersToPartner(
      bestAssignment.orderIds, 
      bestAssignment.partnerId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Auto assignment optimization failed - time constraints too strict',
        data: result
      });
    }

    // FIXED: Store the optimization result for future retrieval
    dataStore.storeOptimizationResult(bestAssignment.partnerId, result.optimization);

    res.json({
      success: true,
      message: `Assigned ${bestAssignment.orderIds.length} orders to ${bestAssignment.partnerName} (${remainingOrders.length} orders remaining due to 30-min constraints)`,
      data: {
        ...result,
        autoAssignmentInfo: bestAssignment,
        distributionSummary: {
          totalPartners: availablePartners.length,
          partnersUsed: assignments.length,
          totalOrders: pendingOrders.length,
          ordersAssigned: bestAssignment.orderIds.length,
          ordersRemaining: remainingOrders.length,
          reasonForRemaining: remainingOrders.length > 0 ? '30-minute time constraints' : null
        }
      }
    });

  } catch (error) {
    console.error('❌ Auto assignment failed:', error);
    res.status(500).json({
      success: false,
      message: 'Auto assignment failed',
      error: error.message
    });
  }
});

// Helper method to find best order combination for a partner
router.findBestOrderCombination = async function(partner, availableOrders) {
  let bestCombination = {
    orders: [],
    totalPackages: 0,
    estimatedTime: 0
  };

  // Try different combinations of orders, starting with single orders
  for (let orderCount = 1; orderCount <= Math.min(availableOrders.length, 3); orderCount++) {
    const combinations = router.getCombinations(availableOrders, orderCount);
    
    for (const combination of combinations) {
      const totalPackages = combination.reduce((sum, order) => sum + order.packageCount, 0);
      
      // Quick package check
      if (totalPackages > partner.maxPackages) {
        continue;
      }
      
      // Check constraints using dijkstra optimizer
      const constraints = await dijkstraOptimizer.checkConstraints(partner, combination);
      
      if (constraints.isValid && combination.length > bestCombination.orders.length) {
        bestCombination = {
          orders: combination,
          totalPackages: totalPackages,
          estimatedTime: dijkstraOptimizer.estimateDeliveryTime(partner, combination)
        };
      }
    }
  }

  return bestCombination;
};

// Generate combinations of orders
router.getCombinations = function(array, size) {
  if (size === 1) return array.map(item => [item]);
  if (size > array.length) return [];
  
  const combinations = [];
  for (let i = 0; i <= array.length - size; i++) {
    const head = array[i];
    const tailCombinations = router.getCombinations(array.slice(i + 1), size - 1);
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail]);
    }
  }
  return combinations;
};

// POST /api/orders/optimize-route - MAIN DIJKSTRA OPTIMIZATION ENDPOINT
router.post('/optimize-route', async (req, res) => {
  try {
    const { partnerId, orderIds } = req.body;

    if (!partnerId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID and order IDs array are required'
      });
    }

    console.log(`\n🎯 ROUTE OPTIMIZATION REQUEST`);
    console.log(`Partner ID: ${partnerId}`);
    console.log(`Order IDs: [${orderIds.join(', ')}]`);

    // Run Dijkstra optimization
    const result = await dijkstraOptimizer.assignOrdersToPartner(orderIds, partnerId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Route optimization failed',
        data: result
      });
    }

    // FIXED: Store the optimization result for future retrieval
    dataStore.storeOptimizationResult(partnerId, result.optimization);

    res.json({
      success: true,
      message: 'Route optimized successfully using Dijkstra algorithm',
      data: result
    });

  } catch (error) {
    console.error('❌ Route optimization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Route optimization failed',
      error: error.message
    });
  }
});

// GET /api/orders/optimization/:partnerId - FIXED: Get stored optimization details
router.get('/optimization/:partnerId', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.partnerId);
    const partner = dataStore.getPartnerById(partnerId);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    console.log(`\n📊 RETRIEVING OPTIMIZATION for Partner: ${partner.name} (ID: ${partnerId})`);

    // FIXED: Try to get stored optimization result first
    const storedOptimization = dataStore.getOptimizationResult(partnerId);
    
    if (storedOptimization) {
      console.log(`✅ Found stored optimization for ${partner.name}`);
      
      // Get current assigned orders for this partner
      const assignedOrders = dataStore.getPartnerOrders(partnerId);
      
      return res.json({
        success: true,
        message: 'Retrieved stored optimization details',
        data: {
          partner,
          orders: assignedOrders,
          optimization: storedOptimization
        }
      });
    }

    // If no stored optimization, check if partner has assigned orders
    const assignedOrders = dataStore.getPartnerOrders(partnerId);
    
    if (assignedOrders.length === 0) {
      return res.json({
        success: true,
        message: 'No orders assigned to this partner',
        data: {
          partner,
          orders: [],
          optimization: null
        }
      });
    }

    // If partner has orders but no stored optimization, return basic info
    console.log(`⚠️ No stored optimization found for ${partner.name}, but partner has ${assignedOrders.length} assigned orders`);
    
    res.json({
      success: true,
      message: 'Partner has assigned orders but no stored optimization. Try running auto-assign or manual optimization again.',
      data: {
        partner,
        orders: assignedOrders,
        optimization: null,
        needsOptimization: true
      }
    });

  } catch (error) {
    console.error('❌ Failed to get optimization details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimization details',
      error: error.message
    });
  }
});

// GET /api/orders - Get all orders
router.get('/', (req, res) => {
  try {
    const orders = dataStore.getOrders();
    const ordersWithPartners = orders.map(order => ({
      ...order,
      assignedPartner: order.assignedPartnerId ? 
        dataStore.getPartnerById(order.assignedPartnerId) : null
    }));

    res.json({
      success: true,
      data: ordersWithPartners,
      count: orders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', (req, res) => {
  try {
    const order = dataStore.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderWithPartner = {
      ...order,
      assignedPartner: order.assignedPartnerId ? 
        dataStore.getPartnerById(order.assignedPartnerId) : null
    };

    res.json({
      success: true,
      data: orderWithPartner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { 
      restaurantAddress, 
      customerAddress, 
      packageCount, 
      specialInstructions 
    } = req.body;

    if (!restaurantAddress || !customerAddress || !packageCount) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant address, customer address, and package count are required'
      });
    }

    if (packageCount <= 0 || packageCount > 5) {
      return res.status(400).json({
        success: false,
        message: 'Package count must be between 1 and 5'
      });
    }

    // Geocode addresses
    let restaurantLocation, customerLocation;

    const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    
    // Handle restaurant address
    const restaurantCoordMatch = restaurantAddress.match(coordPattern);
    if (restaurantCoordMatch) {
      restaurantLocation = {
        lat: parseFloat(restaurantCoordMatch[1]),
        lng: parseFloat(restaurantCoordMatch[2])
      };
    } else {
      const restaurantGeocode = await googleMaps.geocodeAddress(restaurantAddress);
      restaurantLocation = restaurantGeocode.location;
    }

    // Handle customer address
    const customerCoordMatch = customerAddress.match(coordPattern);
    if (customerCoordMatch) {
      customerLocation = {
        lat: parseFloat(customerCoordMatch[1]),
        lng: parseFloat(customerCoordMatch[2])
      };
    } else {
      const customerGeocode = await googleMaps.geocodeAddress(customerAddress);
      customerLocation = customerGeocode.location;
    }

    const orderData = {
      restaurantAddress,
      customerAddress,
      restaurantLocation,
      customerLocation,
      packageCount: parseInt(packageCount),
      specialInstructions: specialInstructions || ''
    };

    const newOrder = dataStore.addOrder(orderData);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// POST /api/orders/optimize-route - MAIN DIJKSTRA OPTIMIZATION ENDPOINT
router.post('/optimize-route', async (req, res) => {
  try {
    const { partnerId, orderIds } = req.body;

    if (!partnerId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID and order IDs array are required'
      });
    }

    console.log(`\n🎯 ROUTE OPTIMIZATION REQUEST`);
    console.log(`Partner ID: ${partnerId}`);
    console.log(`Order IDs: [${orderIds.join(', ')}]`);

    // Run Dijkstra optimization
    const result = await dijkstraOptimizer.assignOrdersToPartner(orderIds, partnerId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Route optimization failed',
        data: result
      });
    }

    res.json({
      success: true,
      message: 'Route optimized successfully using Dijkstra algorithm',
      data: result
    });

  } catch (error) {
    console.error('❌ Route optimization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Route optimization failed',
      error: error.message
    });
  }
});

// GET /api/orders/optimization/:partnerId - Get optimization details for partner
router.get('/optimization/:partnerId', async (req, res) => {
  try {
    const partner = dataStore.getPartnerById(req.params.partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    const assignedOrders = dataStore.getPartnerOrders(req.params.partnerId);
    
    if (assignedOrders.length === 0) {
      return res.json({
        success: true,
        message: 'No orders assigned to this partner',
        data: {
          partner,
          orders: [],
          optimization: null
        }
      });
    }

    // Run optimization analysis
    const optimization = await dijkstraOptimizer.optimizeRoute(partner, assignedOrders);

    res.json({
      success: true,
      data: {
        partner,
        orders: assignedOrders,
        optimization
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get optimization details',
      error: error.message
    });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const order = dataStore.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow updates if order is still pending
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only update pending orders'
      });
    }

    const updates = {};
    const { 
      restaurantAddress, 
      customerAddress, 
      packageCount, 
      specialInstructions 
    } = req.body;

    // Handle address updates with geocoding
    if (restaurantAddress) {
      const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
      const coordMatch = restaurantAddress.match(coordPattern);
      
      if (coordMatch) {
        updates.restaurantAddress = restaurantAddress;
        updates.restaurantLocation = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      } else {
        const geocode = await googleMaps.geocodeAddress(restaurantAddress);
        updates.restaurantAddress = geocode.address;
        updates.restaurantLocation = geocode.location;
      }
    }

    if (customerAddress) {
      const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
      const coordMatch = customerAddress.match(coordPattern);
      
      if (coordMatch) {
        updates.customerAddress = customerAddress;
        updates.customerLocation = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      } else {
        const geocode = await googleMaps.geocodeAddress(customerAddress);
        updates.customerAddress = geocode.address;
        updates.customerLocation = geocode.location;
      }
    }

    if (packageCount) updates.packageCount = parseInt(packageCount);
    if (specialInstructions !== undefined) updates.specialInstructions = specialInstructions;

    const updatedOrder = dataStore.updateOrder(req.params.id, updates);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', (req, res) => {
  try {
    const order = dataStore.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'ASSIGNED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete assigned order'
      });
    }

    const orderIndex = dataStore.orders.findIndex(o => o.id === parseInt(req.params.id));
    if (orderIndex !== -1) {
      dataStore.orders.splice(orderIndex, 1);
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

module.exports = router;