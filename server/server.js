require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const partnersRouter = require('./routes/partners');
const ordersRouter = require('./routes/orders');

// Import data store for initialization
const dataStore = require('./models/dataStore');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// API Routes
app.use('/api/partners', partnersRouter);
app.use('/api/orders', ordersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dijkstra Route Optimization API is running',
    timestamp: new Date(),
    version: '1.0.0',
    algorithms: ['Dijkstra', 'Haversine Distance'],
    features: ['Route Optimization', 'Constraint Validation', 'Google Maps Integration']
  });
});

// System info endpoint
app.get('/api/system/info', (req, res) => {
    const stats = dataStore.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        constraints: {
          maxPackagesPerPartner: 5,
          maxDeliveryTimeMinutes: 30,
          algorithmUsed: 'Dijkstra\'s Algorithm'
        },
        googleMapsEnabled: !!process.env.GOOGLE_MAPS_API_KEY
      }
    });
  });  

// Initialize demo data endpoint with EXACT coordinates
app.post('/api/system/init-demo', async (req, res) => {
  try {
    // Clear existing data including optimizations
    dataStore.clearAll();

    console.log('🧪 Initializing EXACT coordinate demo data...');

    // Add demo delivery partners with EXACT coordinates (NO GEOCODING)
    const demoPartners = [
      { 
        name: 'Pranav Aggarwal', 
        phone: '1', 
        exactLocation: {
          lat: 12.848231,
          lng: 77.657729
        }
      },
      { 
        name: 'Krishan Kumar', 
        phone: '2', 
        exactLocation: {
          lat: 12.848231,
          lng: 77.657729
        }
      }
    ];

    // Add partners with EXACT coordinates (bypass geocoding)
    for (const partnerData of demoPartners) {
      const partner = {
        id: dataStore.nextPartnerId++,
        name: partnerData.name,
        phone: partnerData.phone,
        currentLocation: partnerData.exactLocation,
        homeBase: partnerData.exactLocation,
        status: 'AVAILABLE',
        maxPackages: 5,
        maxDeliveryTime: 60 * 60, // 60 minutes in seconds
        createdAt: new Date()
      };
      dataStore.partners.push(partner);
      console.log(`✅ Added partner: ${partner.name} at EXACT location (${partnerData.exactLocation.lat}, ${partnerData.exactLocation.lng})`);
    }

    // Add demo orders with EXACT coordinates (NO GEOCODING) 
    const demoOrders = [
      {
        restaurantAddress: 'Restaurant A - Koramangala (12.854277, 77.657815)',
        customerAddress: 'Customer 1 - BTM Layout (12.850616, 77.647665)',
        exactRestaurantLocation: {
          lat: 12.854277,
          lng: 77.657815
        },
        exactCustomerLocation: {
          lat: 12.850616,
          lng: 77.647665
        },
        packageCount: 1,
        specialInstructions: 'Ring doorbell twice'
      },
      {
        restaurantAddress: 'Restaurant A - Koramangala (12.854277, 77.657815)',
        customerAddress: 'Customer 2 - HSR Layout (12.851118, 77.664016)',
        exactRestaurantLocation: {
          lat: 12.854277,
          lng: 77.657815
        },
        exactCustomerLocation: {
          lat: 12.851118,
          lng: 77.664016
        },
        packageCount: 1,
        specialInstructions: 'Call before delivery'
      },
      {
        restaurantAddress: 'Restaurant B - Indiranagar (12.850867, 77.653867)',
        customerAddress: 'Customer 2 - HSR Layout (12.851118, 77.664016)',
        exactRestaurantLocation: {
          lat: 12.850867,
          lng: 77.653867
        },
        exactCustomerLocation: {
          lat: 12.851118,
          lng: 77.664016
        },
        packageCount: 1,
        specialInstructions: 'Leave at door'
      },
      {
        restaurantAddress: 'Restaurant C - Jayanagar (12.845010, 77.646485)',
        customerAddress: 'Customer 3 - JP Nagar (12.845407, 77.660669)',
        exactRestaurantLocation: {
          lat: 12.845010,
          lng: 77.646485
        },
        exactCustomerLocation: {
          lat: 12.845407,
          lng: 77.660669
        },
        packageCount: 1,
        specialInstructions: 'Apartment 4B, 2nd floor'
      }
    ];

    // Add orders with EXACT coordinates (bypass geocoding completely)
    for (const orderData of demoOrders) {
      const order = {
        id: dataStore.nextOrderId++,
        restaurantAddress: orderData.restaurantAddress,
        customerAddress: orderData.customerAddress,
        restaurantLocation: orderData.exactRestaurantLocation,
        customerLocation: orderData.exactCustomerLocation,
        packageCount: orderData.packageCount,
        specialInstructions: orderData.specialInstructions || '',
        status: 'PENDING',
        assignedPartnerId: null,
        estimatedDeliveryTime: null,
        createdAt: new Date()
      };
      dataStore.orders.push(order);
      
      console.log(`✅ Added Order #${order.id}:`);
      console.log(`   Restaurant: (${order.restaurantLocation.lat}, ${order.restaurantLocation.lng}) - ${order.restaurantAddress}`);
      console.log(`   Customer: (${order.customerLocation.lat}, ${order.customerLocation.lng}) - ${order.customerAddress}`);
    }

    const stats = dataStore.getStats();

    console.log('\n🎯 EXACT coordinate demo data initialized successfully!');
    console.log(`Created ${stats.totalPartners} partners and ${stats.totalOrders} orders`);
    
    // Validate coordinates are correct
    console.log('\n🔍 COORDINATE VALIDATION:');
    dataStore.orders.forEach(order => {
      console.log(`Order #${order.id}:`);
      console.log(`  Restaurant: ${order.restaurantLocation.lat}, ${order.restaurantLocation.lng}`);
      console.log(`  Customer: ${order.customerLocation.lat}, ${order.customerLocation.lng}`);
    });

    res.json({
      success: true,
      message: 'EXACT coordinate demo data initialized successfully!',
      data: {
        partnersCreated: stats.totalPartners,
        ordersCreated: stats.totalOrders,
        stats,
        coordinateValidation: {
          order1: { restaurant: '12.854277, 77.657815', customer: '12.850616, 77.647665' },
          order2: { restaurant: '12.854277, 77.657815', customer: '12.851118, 77.664016' },
          order3: { restaurant: '12.850867, 77.653867', customer: '12.851118, 77.664016' },
          order4: { restaurant: '12.845010, 77.646485', customer: '12.845407, 77.660669' },
          expectedGroupings: [
            'Order 1 & 2: Same restaurant (0m apart)',
            'Order 2 & 3: Same customer (0m apart)',
            'Order 4: Independent (no grouping)'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Failed to initialize exact coordinate demo data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize exact coordinate demo data',
      error: error.message
    });
  }
});

// Clear all data endpoint
app.post('/api/system/clear', (req, res) => {
  try {
    dataStore.clearAll();
    
    res.json({
      success: true,
      message: 'All data cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear data',
      error: error.message
    });
  }
});

// FIXED: Reset system endpoint - properly clear optimization data
app.post('/api/system/reset', (req, res) => {
  try {
    console.log('🔄 Resetting system...');
    
    // Count optimizations before clearing
    const optimizationsBefore = Object.keys(dataStore.getAllOptimizations()).length;
    
    // Use the improved reset method that clears optimizations
    dataStore.resetAssignments();

    const stats = dataStore.getStats();
    console.log(`✅ Reset completed: ${stats.totalPartners} partners, ${stats.totalOrders} orders`);
    console.log(`📊 Cleared ${optimizationsBefore} stored optimization results`);

    res.json({
      success: true,
      message: 'System reset successfully - all partners available, all orders pending, optimization data cleared',
      data: {
        partnersReset: stats.totalPartners,
        ordersReset: stats.totalOrders,
        optimizationsCleared: optimizationsBefore,
        stats: stats
      }
    });
  } catch (error) {
    console.error('❌ Failed to reset system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset system',
      error: error.message
    });
  }
});

// Debug endpoint to view current graph state
app.get('/api/debug/graph-data', (req, res) => {
  try {
    const partners = dataStore.getPartners();
    const orders = dataStore.getOrders();
    const optimizations = dataStore.getAllOptimizations();
    
    const graphData = {
      nodes: [
        ...partners.map(p => ({
          id: `P${p.id}`,
          type: 'PARTNER',
          name: p.name,
          location: p.currentLocation,
          status: p.status,
          maxPackages: p.maxPackages
        })),
        ...orders.flatMap(o => [
          {
            id: `R${o.id}`,
            type: 'RESTAURANT',
            orderId: o.id,
            location: o.restaurantLocation,
            address: o.restaurantAddress,
            packages: o.packageCount
          },
          {
            id: `C${o.id}`,
            type: 'CUSTOMER', 
            orderId: o.id,
            location: o.customerLocation,
            address: o.customerAddress,
            packages: o.packageCount
          }
        ])
      ],
      orders: orders,
      partners: partners,
      assignments: orders.filter(o => o.assignedPartnerId).map(o => ({
        orderId: o.id,
        partnerId: o.assignedPartnerId,
        status: o.status
      })),
      optimizations: Object.keys(optimizations).map(partnerId => ({
        partnerId: parseInt(partnerId),
        hasOptimization: true,
        timestamp: optimizations[partnerId].timestamp
      }))
    };

    res.json({
      success: true,
      data: graphData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get graph data',
      error: error.message
    });
  }
});

// NEW: Debug endpoint to view stored optimizations
app.get('/api/debug/optimizations', (req, res) => {
  try {
    const optimizations = dataStore.getAllOptimizations();
    
    res.json({
      success: true,
      data: {
        count: Object.keys(optimizations).length,
        optimizations: Object.keys(optimizations).map(partnerId => {
          const opt = optimizations[partnerId];
          return {
            partnerId: parseInt(partnerId),
            partnerName: opt.partnerName,
            totalOrders: opt.totalOrders,
            timestamp: opt.timestamp,
            hasSteps: opt.steps ? opt.steps.length : 0,
            hasRoute: opt.finalRoute ? opt.finalRoute.path.length : 0
          };
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get optimizations data',
      error: error.message
    });
  }
});

// Serve React app for any non-API routes (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dijkstra Route Optimization Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  
  console.log('\n📋 System Configuration:');
  console.log(`   Algorithm: Dijkstra's Algorithm for Route Optimization`);
  console.log(`   Max packages per partner: 5`);
  console.log(`   Max delivery time: 30 minutes`);
  console.log(`   Google Maps API: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Not configured (using fallback)'}`);
  
  console.log('\n🎯 Quick Start:');
  console.log('   1. Initialize demo data: POST /api/system/init-demo');
  console.log('   2. Optimize routes: POST /api/orders/optimize-route');
  console.log('   3. View optimization steps for educational purposes!');
  console.log('   4. Click on assigned partners to view their stored optimization details!');
});

module.exports = app;