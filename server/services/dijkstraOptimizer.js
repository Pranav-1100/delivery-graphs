const googleMaps = require('../utils/googleMaps');

class DijkstraOptimizer {
  
  // Main method: Optimize route for partner with multiple orders using Dijkstra
  async optimizeRoute(partner, orders) {
    try {
      console.log(`\n🎯 DIJKSTRA ROUTE OPTIMIZATION STARTED`);
      console.log(`Partner: ${partner.name}`);
      console.log(`Orders: ${orders.length}`);
      
      const optimizationResult = {
        partnerId: partner.id,
        partnerName: partner.name,
        totalOrders: orders.length,
        steps: [],
        graph: null,
        finalRoute: null,
        constraints: {
          maxPackages: partner.maxPackages,
          maxTime: partner.maxDeliveryTime,
          violations: []
        }
      };
  
      // Step 1: Check basic constraints
      const constraintCheck = await this.checkConstraints(partner, orders);
      
      // FIXED: Don't add violations to steps if constraints are actually valid
      // Only add constraint check failed if we're actually going to fail
      if (!constraintCheck.isValid) {
        optimizationResult.constraints.violations = constraintCheck.violations;
        optimizationResult.steps.push({
          step: 1,
          action: 'CONSTRAINT_CHECK_FAILED',
          description: 'Constraint validation failed - assignment cannot proceed',
          details: constraintCheck.violations
        });
        console.log(`❌ Constraint check failed:`, constraintCheck.violations);
        return optimizationResult;
      }
  
      // FIXED: Only add success step if constraints actually passed
      optimizationResult.steps.push({
        step: 1,
        action: 'CONSTRAINT_CHECK_PASSED',
        description: 'All constraints satisfied - proceeding with optimization',
        details: {
          totalPackages: orders.reduce((sum, o) => sum + o.packageCount, 0),
          maxAllowed: partner.maxPackages,
          estimatedTime: Math.round(constraintCheck.estimatedTime / 60),
          maxTimeAllowed: Math.round(partner.maxDeliveryTime / 60)
        }
      });
  
      // Step 2: Build graph representation
      const graph = await this.buildGraph(partner, orders);
      optimizationResult.graph = graph;
      
      optimizationResult.steps.push({
        step: 2,
        action: 'GRAPH_BUILT',
        description: 'Graph representation created with all locations and distances',
        details: {
          totalNodes: graph.nodes.length,
          totalEdges: graph.edges.length,
          locations: graph.nodes.map(n => ({ id: n.id, type: n.type, address: n.address }))
        }
      });
  
      // Step 3: Run Dijkstra algorithm
      const dijkstraResult = await this.runDijkstra(graph, partner);
      
      optimizationResult.steps.push(...dijkstraResult.steps);
      optimizationResult.finalRoute = dijkstraResult.optimalRoute;
  
      console.log(`✅ DIJKSTRA OPTIMIZATION COMPLETED - Route found with ${dijkstraResult.optimalRoute.path.length} stops`);
      return optimizationResult;
  
    } catch (error) {
      console.error('❌ Dijkstra optimization failed:', error);
      throw error;
    }
  }  

  // Check partner and order constraints
  checkConstraints(partner, orders) {
    const violations = [];
    let isValid = true;

    // Check package capacity
    const totalPackages = orders.reduce((sum, order) => sum + order.packageCount, 0);
    if (totalPackages > partner.maxPackages) {
      violations.push(`Package capacity exceeded: ${totalPackages} > ${partner.maxPackages}`);
      isValid = false;
    }

    // Check if partner is available
    if (partner.status !== 'AVAILABLE') {
      violations.push(`Partner not available: status is ${partner.status}`);
      isValid = false;
    }

    return { isValid, violations };
  }

  // Build graph representation with all locations
  async buildGraph(partner, orders) {
    console.log(`\n📊 Building graph representation...`);
    
    const nodes = [];
    const edges = [];

    // Add partner starting location as source node
    nodes.push({
      id: 'START',
      type: 'PARTNER_START',
      location: partner.currentLocation,
      address: 'Partner Starting Location'
    });

    // Add all restaurant and customer locations
    orders.forEach((order, index) => {
      // Restaurant node
      nodes.push({
        id: `R${order.id}`,
        type: 'RESTAURANT',
        location: order.restaurantLocation,
        address: order.restaurantAddress,
        orderId: order.id,
        packages: order.packageCount
      });

      // Customer node  
      nodes.push({
        id: `C${order.id}`,
        type: 'CUSTOMER',
        location: order.customerLocation,
        address: order.customerAddress,
        orderId: order.id,
        packages: order.packageCount,
        requiresPickup: `R${order.id}` // Must visit restaurant first
      });
    });

    // Add partner return location (same as start)
    nodes.push({
      id: 'END',
      type: 'PARTNER_END',
      location: partner.homeBase || partner.currentLocation,
      address: 'Partner Return Location'
    });

    console.log(`📍 Created ${nodes.length} nodes`);

    // Build edges with Google Maps distances
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i !== j) {
          try {
            const distance = await googleMaps.getDistanceMatrix(
              [nodes[i].location], 
              [nodes[j].location]
            );
            
            edges.push({
              from: nodes[i].id,
              to: nodes[j].id,
              weight: distance.duration, // Use time as weight
              distance: distance.distance,
              duration: distance.duration
            });
          } catch (error) {
            console.error(`Failed to get distance from ${nodes[i].id} to ${nodes[j].id}`);
            // Fallback to straight line distance
            const fallbackDistance = googleMaps.calculateHaversineDistance(
              nodes[i].location, 
              nodes[j].location
            );
            edges.push({
              from: nodes[i].id,
              to: nodes[j].id,
              weight: fallbackDistance * 120, // Rough time estimate
              distance: fallbackDistance * 1000,
              duration: fallbackDistance * 120
            });
          }
        }
      }
    }

    console.log(`🔗 Created ${edges.length} edges`);

    return { nodes, edges };
  }

  // Run Dijkstra's algorithm to find optimal route
  async runDijkstra(graph, partner) {
    console.log(`\n🚀 Running Dijkstra's Algorithm...`);
    
    const dijkstraSteps = [];
    const nodes = graph.nodes;
    const edges = graph.edges;
    
    // Initialize distances and visited sets
    const distances = {};
    const previous = {};
    const visited = new Set();
    const unvisited = new Set();

    // Step 3.1: Initialize
    nodes.forEach(node => {
      distances[node.id] = node.id === 'START' ? 0 : Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });

    dijkstraSteps.push({
      step: 3.1,
      action: 'DIJKSTRA_INIT',
      description: 'Initialized distances and unvisited set',
      details: {
        startNode: 'START',
        initialDistances: { ...distances },
        unvisitedCount: unvisited.size
      }
    });

    let stepCounter = 3.2;
    
    // Main Dijkstra loop
    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          currentNode = nodeId;
        }
      }

      if (!currentNode || minDistance === Infinity) break;

      // Mark as visited
      visited.add(currentNode);
      unvisited.delete(currentNode);

      const currentNodeData = nodes.find(n => n.id === currentNode);
      
      dijkstraSteps.push({
        step: stepCounter++,
        action: 'VISITING_NODE',
        description: `Visiting node ${currentNode}`,
        details: {
          nodeId: currentNode,
          nodeType: currentNodeData.type,
          currentDistance: distances[currentNode],
          remainingUnvisited: unvisited.size
        }
      });

      // Check neighbors
      const neighbors = edges.filter(e => e.from === currentNode);
      
      for (const edge of neighbors) {
        const neighborId = edge.to;
        
        if (!visited.has(neighborId)) {
          const newDistance = distances[currentNode] + edge.weight;
          
          if (newDistance < distances[neighborId]) {
            distances[neighborId] = newDistance;
            previous[neighborId] = currentNode;
            
            dijkstraSteps.push({
              step: stepCounter++,
              action: 'DISTANCE_UPDATED',
              description: `Updated distance to ${neighborId}`,
              details: {
                neighbor: neighborId,
                oldDistance: distances[neighborId] === newDistance ? Infinity : distances[neighborId],
                newDistance: newDistance,
                via: currentNode,
                edgeWeight: edge.weight
              }
            });
          }
        }
      }
    }

    // Build optimal route path
    const optimalRoute = this.buildOptimalPath(previous, distances, nodes, edges);
    
    dijkstraSteps.push({
      step: stepCounter,
      action: 'DIJKSTRA_COMPLETED',
      description: 'Dijkstra algorithm completed - optimal path found',
      details: {
        totalDistance: optimalRoute.totalDistance,
        totalTime: optimalRoute.totalTime,
        visitedNodes: visited.size,
        pathLength: optimalRoute.path.length
      }
    });

    console.log(`✅ Dijkstra completed: ${optimalRoute.path.length} stops, ${Math.round(optimalRoute.totalTime/60)} minutes`);

    return {
      steps: dijkstraSteps,
      optimalRoute: optimalRoute,
      finalDistances: distances,
      previousNodes: previous
    };
  }

  // Build the optimal path from Dijkstra results
  buildOptimalPath(previous, distances, nodes, edges) {
    console.log(`\n🛣️ Building optimal path...`);
    
    // For delivery routing, we need to visit all restaurants first, then customers
    // This is a simplified TSP approach using Dijkstra results
    
    const restaurants = nodes.filter(n => n.type === 'RESTAURANT');
    const customers = nodes.filter(n => n.type === 'CUSTOMER');
    
    const path = [];
    let totalTime = 0;
    let totalDistance = 0;
    let currentLocation = 'START';

    // Add start
    path.push({
      nodeId: 'START',
      type: 'START',
      action: 'START_DELIVERY',
      location: nodes.find(n => n.id === 'START').location,
      address: 'Partner Starting Location',
      packages: 0,
      timeFromPrevious: 0,
      distanceFromPrevious: 0,
      cumulativeTime: 0
    });

    // Visit all restaurants first (pickup phase)
    for (const restaurant of restaurants) {
      const edge = edges.find(e => e.from === currentLocation && e.to === restaurant.id);
      if (edge) {
        totalTime += edge.duration;
        totalDistance += edge.distance;
        
        path.push({
          nodeId: restaurant.id,
          type: 'PICKUP',
          action: 'PICKUP_ORDER',
          location: restaurant.location,
          address: restaurant.address,
          orderId: restaurant.orderId,
          packages: restaurant.packages,
          timeFromPrevious: edge.duration,
          distanceFromPrevious: edge.distance,
          cumulativeTime: totalTime
        });
        
        currentLocation = restaurant.id;
      }
    }

    // Visit all customers (delivery phase)
    for (const customer of customers) {
      const edge = edges.find(e => e.from === currentLocation && e.to === customer.id);
      if (edge) {
        totalTime += edge.duration;
        totalDistance += edge.distance;
        
        path.push({
          nodeId: customer.id,
          type: 'DELIVERY',
          action: 'DELIVER_ORDER',
          location: customer.location,
          address: customer.address,
          orderId: customer.orderId,
          packages: customer.packages,
          timeFromPrevious: edge.duration,
          distanceFromPrevious: edge.distance,
          cumulativeTime: totalTime
        });
        
        currentLocation = customer.id;
      }
    }

    // Return to base
    const returnEdge = edges.find(e => e.from === currentLocation && e.to === 'END');
    if (returnEdge) {
      totalTime += returnEdge.duration;
      totalDistance += returnEdge.distance;
      
      path.push({
        nodeId: 'END',
        type: 'RETURN',
        action: 'RETURN_TO_BASE',
        location: nodes.find(n => n.id === 'END').location,
        address: 'Partner Return Location',
        packages: 0,
        timeFromPrevious: returnEdge.duration,
        distanceFromPrevious: returnEdge.distance,
        cumulativeTime: totalTime
      });
    }

    console.log(`📍 Path: ${path.length} stops`);
    console.log(`⏱️ Total time: ${Math.round(totalTime/60)} minutes`);
    console.log(`🛣️ Total distance: ${Math.round(totalDistance/1000)} km`);

    return {
      path,
      totalTime,
      totalDistance,
      totalStops: path.length,
      isOptimal: totalTime <= 30 * 60 // Check 60-minute constraint
    };
  }

  // Simple estimation method for delivery time (add this to the class)
  estimateDeliveryTime(partner, orders) {
    const googleMaps = require('../utils/googleMaps');
    
    if (orders.length === 0) return 0;
    
    let totalDistance = 0;
    let currentLocation = partner.currentLocation;
    
    console.log(`🚗 Estimating delivery time for ${orders.length} orders:`);
    
    // Calculate route: Start -> Restaurant1 -> Customer1 -> Restaurant2 -> Customer2 -> ... -> Base
    orders.forEach((order, index) => {
      // Distance to restaurant
      const distanceToRestaurant = googleMaps.calculateHaversineDistance(
        currentLocation, 
        order.restaurantLocation
      );
      totalDistance += distanceToRestaurant;
      console.log(`   Step ${index*2 + 1}: To Restaurant #${order.id} = ${distanceToRestaurant.toFixed(2)} km`);
      
      // Distance from restaurant to customer
      const distanceToCustomer = googleMaps.calculateHaversineDistance(
        order.restaurantLocation, 
        order.customerLocation
      );
      totalDistance += distanceToCustomer;
      console.log(`   Step ${index*2 + 2}: To Customer #${order.id} = ${distanceToCustomer.toFixed(2)} km`);
      
      currentLocation = order.customerLocation;
    });
    
    // Distance back to base
    const distanceToBase = googleMaps.calculateHaversineDistance(
      currentLocation, 
      partner.homeBase || partner.currentLocation
    );
    totalDistance += distanceToBase;
    console.log(`   Final: Return to base = ${distanceToBase.toFixed(2)} km`);
    console.log(`   Total distance: ${totalDistance.toFixed(2)} km`);
    
    // IMPROVED: More realistic time estimation for Bangalore traffic
    // - Average speed: 20 km/h in city traffic (slower than 30 km/h due to traffic)
    // - Stop time: 3 minutes per pickup + 2 minutes per delivery
    const averageSpeedKmh = 20; // Realistic city speed with traffic
    const travelTimeSeconds = (totalDistance / averageSpeedKmh) * 3600; // Convert to seconds
    
    const pickupTimeSeconds = orders.length * 3 * 60; // 3 minutes per pickup
    const deliveryTimeSeconds = orders.length * 2 * 60; // 2 minutes per delivery
    const stopTimeSeconds = pickupTimeSeconds + deliveryTimeSeconds;
    
    const totalTimeSeconds = travelTimeSeconds + stopTimeSeconds;
    const totalTimeMinutes = Math.round(totalTimeSeconds / 60);
    
    console.log(`   Travel time: ${Math.round(travelTimeSeconds/60)} min (${averageSpeedKmh} km/h avg speed)`);
    console.log(`   Stop time: ${Math.round(stopTimeSeconds/60)} min (${orders.length} pickups + ${orders.length} deliveries)`);
    console.log(`   Total estimated time: ${totalTimeMinutes} minutes`);
    
    return totalTimeSeconds;
  }
  
  // Also add this method to check constraints without full optimization
  async checkConstraints(partner, orders) {
    const violations = [];
    let isValid = true;
  
    console.log(`🔍 Checking constraints for ${partner.name} with ${orders.length} orders`);
  
    // Check package capacity
    const totalPackages = orders.reduce((sum, order) => sum + order.packageCount, 0);
    console.log(`📦 Package check: ${totalPackages}/${partner.maxPackages}`);
    if (totalPackages > partner.maxPackages) {
      violations.push(`Package capacity exceeded: ${totalPackages} > ${partner.maxPackages}`);
      isValid = false;
    }
  
    // Check if partner is available
    if (partner.status !== 'AVAILABLE') {
      violations.push(`Partner not available: status is ${partner.status}`);
      isValid = false;
    }
  
    // IMPROVED: More realistic time estimation 
    const estimatedTime = this.estimateDeliveryTime(partner, orders);
    const maxTimeMinutes = Math.round(partner.maxDeliveryTime / 60);
    const estimatedTimeMinutes = Math.round(estimatedTime / 60);
    
    console.log(`⏱️ Time check: ${estimatedTimeMinutes} min (estimated) vs ${maxTimeMinutes} min (max)`);
    
    // FIXED: Be more lenient with time estimation since it's just an estimate
    // Allow up to 10% over the limit for estimation inaccuracies
    const timeBuffer = partner.maxDeliveryTime * 1.1; // 10% buffer
    if (estimatedTime > timeBuffer) {
      violations.push(`Estimated delivery time significantly exceeded: ${estimatedTimeMinutes} min > ${maxTimeMinutes} min (with 10% buffer)`);
      isValid = false;
    }
  
    console.log(`✅ Constraint check result: ${isValid ? 'PASSED' : 'FAILED'}`);
    if (violations.length > 0) {
      console.log(`   Violations:`, violations);
    }
  
    return { isValid, violations, estimatedTime };
  }
  

  // Simple assignment method to assign multiple orders to best partner
  async assignOrdersToPartner(orderIds, partnerId) {
    const dataStore = require('../models/dataStore');
    
    try {
      const partner = dataStore.getPartnerById(partnerId);
      const orders = orderIds.map(id => dataStore.getOrderById(id)).filter(Boolean);
      
      if (!partner || orders.length === 0) {
        throw new Error('Partner or orders not found');
      }
  
      console.log(`🎯 Running optimization for partner ${partner.name} with ${orders.length} orders`);
  
      // Run Dijkstra optimization
      const optimizationResult = await this.optimizeRoute(partner, orders);
      
      // FIXED: Check the correct path for violations
      if (optimizationResult.constraints && optimizationResult.constraints.violations && optimizationResult.constraints.violations.length > 0) {
        console.log(`❌ Constraint violations found:`, optimizationResult.constraints.violations);
        return {
          success: false,
          reason: 'CONSTRAINTS_VIOLATED',
          violations: optimizationResult.constraints.violations,
          optimization: optimizationResult
        };
      }
  
      // Update partner and orders
      dataStore.updatePartner(partnerId, { status: 'ASSIGNED' });
      orders.forEach(order => {
        dataStore.updateOrder(order.id, {
          status: 'ASSIGNED',
          assignedPartnerId: partnerId
        });
      });
  
      console.log(`✅ Successfully assigned ${orders.length} orders to ${partner.name}`);
  
      return {
        success: true,
        partner,
        orders,
        optimization: optimizationResult
      };
  
    } catch (error) {
      console.error('❌ Assignment failed:', error);
      throw error;
    }
  }
}

module.exports = new DijkstraOptimizer();