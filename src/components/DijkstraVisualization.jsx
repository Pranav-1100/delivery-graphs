import React, { useState } from 'react';

const DijkstraVisualization = ({ optimizationResult, partners, orders }) => {
  const [selectedStep, setSelectedStep] = useState(null);
  const [showGraph, setShowGraph] = useState(true);

  if (!optimizationResult) {
    return (
      <div className="dijkstra-container">
        <div className="section-header">
          <h2>🧠 Dijkstra's Algorithm Visualization</h2>
          <p>Optimize a route to see step-by-step algorithm execution</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <h3>Ready for Route Optimization</h3>
          <p>Select multiple orders and assign them to a partner to see Dijkstra's algorithm in action!</p>
          <div className="algorithm-info">
            <h4>What you'll see:</h4>
            <ul>
              <li>📊 Graph representation with nodes and edges</li>
              <li>🔍 Step-by-step Dijkstra execution</li>
              <li>✅ Constraint validation</li>
              <li>🛣️ Optimal route calculation</li>
              <li>📈 Performance metrics</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: Access the correct data structure
  // The data comes as optimizationResult.data.optimization, not optimizationResult.optimization
  const optimization = optimizationResult.data?.optimization || optimizationResult.optimization;
  
  // Add safety checks for undefined values
  if (!optimization) {
    return (
      <div className="dijkstra-container">
        <div className="section-header">
          <h2>⚠️ Optimization Data Missing</h2>
          <p>The optimization result doesn't contain the expected data structure.</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>Data Structure Error</h3>
          <p>Please try running the optimization again.</p>
          <div className="debug-info">
            <pre>{JSON.stringify(optimizationResult, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dijkstra-container">
      <div className="section-header">
        <h2>🧠 Dijkstra Route Optimization Results</h2>
        <div className="optimization-info">
          <span className="partner-name">Partner: {optimization.partnerName || 'Unknown'}</span>
          <span className="order-count">{optimization.totalOrders || 0} Orders</span>
        </div>
      </div>

      {/* Toggle Controls */}
      <div className="visualization-controls">
        <button 
          className={`control-btn ${showGraph ? 'active' : ''}`}
          onClick={() => setShowGraph(!showGraph)}
        >
          {showGraph ? '📊 Hide Graph' : '📊 Show Graph'}
        </button>
        <button 
          className="control-btn"
          onClick={() => setSelectedStep(null)}
        >
          🔄 Reset View
        </button>
      </div>

      {/* Graph Representation - FIXED: Added safety checks */}
      {showGraph && optimization.graph && optimization.graph.nodes && (
        <div className="graph-section">
          <h3>📊 Graph Representation</h3>
          <div className="graph-info">
            <div className="graph-stats">
              <span>Nodes: {optimization.graph.nodes?.length || 0}</span>
              <span>Edges: {optimization.graph.edges?.length || 0}</span>
            </div>
          </div>
          
          <div className="graph-visualization">
            <div className="graph-nodes">
              <h4>Nodes (Locations)</h4>
              <div className="nodes-grid">
                {optimization.graph.nodes.map((node, index) => (
                  <div key={node.id} className={`node-item ${node.type.toLowerCase()}`}>
                    <div className="node-header">
                      <span className="node-id">{node.id}</span>
                      <span className="node-type">{node.type}</span>
                    </div>
                    <div className="node-details">
                      {node.address && <div className="node-address">{node.address}</div>}
                      {node.packages && <div className="node-packages">📦 {node.packages} pkg</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Steps - FIXED: Added safety checks */}
      {optimization.steps && optimization.steps.length > 0 && (
        <div className="algorithm-steps">
          <h3>🚀 Algorithm Execution Steps</h3>
          <div className="steps-container">
            {optimization.steps.map((step, index) => (
              <div 
                key={index} 
                className={`step-item ${selectedStep === index ? 'selected' : ''} ${step.action.toLowerCase().replace('_', '-')}`}
                onClick={() => setSelectedStep(selectedStep === index ? null : index)}
              >
                <div className="step-header">
                  <div className="step-number">Step {step.step}</div>
                  <div className="step-action">{step.action.replace(/_/g, ' ')}</div>
                </div>
                <div className="step-description">
                  {step.description}
                </div>
                
                {selectedStep === index && step.details && (
                  <div className="step-details">
                    <h4>Details:</h4>
                    {renderStepDetails(step)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Route - FIXED: Added safety checks */}
      {optimization.finalRoute && optimization.finalRoute.path && (
        <div className="final-route">
          <h3>🛣️ Optimized Route</h3>
          <div className="route-summary">
            <div className="route-stats">
              <div className="stat">
                <span className="stat-value">{optimization.finalRoute.totalStops || 0}</span>
                <span className="stat-label">Total Stops</span>
              </div>
              <div className="stat">
                <span className="stat-value">{Math.round((optimization.finalRoute.totalTime || 0) / 60)} min</span>
                <span className="stat-label">Total Time</span>
              </div>
              <div className="stat">
                <span className="stat-value">{Math.round((optimization.finalRoute.totalDistance || 0) / 1000)} km</span>
                <span className="stat-label">Total Distance</span>
              </div>
              <div className="stat">
                <span className="stat-value">{optimization.finalRoute.isOptimal ? '✅' : '❌'}</span>
                <span className="stat-label">Within 30min Constraint</span>
              </div>
            </div>
          </div>

          <div className="route-path">
            <h4>Route Sequence:</h4>
            <div className="path-steps">
              {optimization.finalRoute.path.map((pathStep, index) => (
                <div key={index} className={`path-step ${pathStep.type.toLowerCase()}`}>
                  <div className="path-step-number">{index + 1}</div>
                  <div className="path-step-content">
                    <div className="path-step-action">
                      {getStepIcon(pathStep.type)} {pathStep.action}
                    </div>
                    <div className="path-step-location">{pathStep.address}</div>
                    {pathStep.packages > 0 && (
                      <div className="path-step-packages">📦 {pathStep.packages} packages</div>
                    )}
                    {index > 0 && (
                      <div className="path-step-time">
                        ⏱️ {Math.round(pathStep.timeFromPrevious / 60)} min from previous
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Constraint Violations - FIXED: Added safety checks */}
      {optimization.constraints && optimization.constraints.violations && optimization.constraints.violations.length > 0 && (
        <div className="constraints-section">
          <h3>⚠️ Constraint Violations</h3>
          <div className="violations-list">
            {optimization.constraints.violations.map((violation, index) => (
              <div key={index} className="violation-item">
                ❌ {violation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message for Auto Assignment */}
      {optimizationResult.message && (
        <div className="success-message">
          <h3>✅ Assignment Complete</h3>
          <p>{optimizationResult.message}</p>
          
          {optimizationResult.data?.distributionSummary && (
            <div className="distribution-summary">
              <h4>📊 Distribution Summary:</h4>
              <ul>
                <li>Partners used: {optimizationResult.data.distributionSummary.partnersUsed}/{optimizationResult.data.distributionSummary.totalPartners}</li>
                <li>Orders assigned: {optimizationResult.data.distributionSummary.ordersAssigned}/{optimizationResult.data.distributionSummary.totalOrders}</li>
                <li>Orders remaining: {optimizationResult.data.distributionSummary.ordersRemaining}</li>
                {optimizationResult.data.distributionSummary.reasonForRemaining && (
                  <li>Reason: {optimizationResult.data.distributionSummary.reasonForRemaining}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to render step details based on step type
const renderStepDetails = (step) => {
  const details = step.details;
  
  if (!details) {
    return <div>No details available</div>;
  }
  
  switch (step.action) {
    case 'CONSTRAINT_CHECK_PASSED':
      return (
        <div className="constraint-details">
          <div>Total Packages: {details.totalPackages}</div>
          <div>Max Allowed: {details.maxAllowed}</div>
          <div className="success">✅ All constraints satisfied</div>
        </div>
      );
      
    case 'CONSTRAINT_CHECK_FAILED':
      return (
        <div className="constraint-details">
          {Array.isArray(details) ? details.map((violation, index) => (
            <div key={index} className="violation">❌ {violation}</div>
          )) : <div className="violation">❌ {details}</div>}
        </div>
      );
      
    case 'GRAPH_BUILT':
      return (
        <div className="graph-details">
          <div>Total Nodes: {details.totalNodes}</div>
          <div>Total Edges: {details.totalEdges}</div>
          {details.locations && (
            <div className="locations-list">
              <strong>Locations:</strong>
              {details.locations.map((loc, index) => (
                <div key={index} className="location-item">
                  {loc.id} ({loc.type}): {loc.address}
                </div>
              ))}
            </div>
          )}
        </div>
      );
      
    case 'DIJKSTRA_INIT':
      return (
        <div className="dijkstra-init-details">
          <div>Start Node: {details.startNode}</div>
          <div>Unvisited Nodes: {details.unvisitedCount}</div>
          {details.initialDistances && (
            <div className="initial-distances">
              <strong>Initial Distances:</strong>
              {Object.entries(details.initialDistances).map(([node, distance]) => (
                <div key={node} className="distance-item">
                  {node}: {distance === Infinity ? '∞' : distance}
                </div>
              ))}
            </div>
          )}
        </div>
      );
      
    case 'VISITING_NODE':
      return (
        <div className="visiting-node-details">
          <div>Node: {details.nodeId}</div>
          <div>Type: {details.nodeType}</div>
          <div>Current Distance: {details.currentDistance}</div>
          <div>Remaining Unvisited: {details.remainingUnvisited}</div>
        </div>
      );
      
    case 'DISTANCE_UPDATED':
      return (
        <div className="distance-update-details">
          <div>Neighbor: {details.neighbor}</div>
          <div>Old Distance: {details.oldDistance === Infinity ? '∞' : Math.round(details.oldDistance)}</div>
          <div>New Distance: {Math.round(details.newDistance)}</div>
          <div>Via: {details.via}</div>
          <div>Edge Weight: {Math.round(details.edgeWeight)}</div>
        </div>
      );
      
    case 'DIJKSTRA_COMPLETED':
      return (
        <div className="dijkstra-completed-details">
          <div className="success">✅ Algorithm completed successfully</div>
          <div>Total Distance: {Math.round((details.totalDistance || 0) / 1000)} km</div>
          <div>Total Time: {Math.round((details.totalTime || 0) / 60)} minutes</div>
          <div>Nodes Visited: {details.visitedNodes}</div>
          <div>Path Length: {details.pathLength} stops</div>
        </div>
      );
      
    default:
      return (
        <div className="generic-details">
          {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {JSON.stringify(value)}
            </div>
          ))}
        </div>
      );
  }
};

// Helper function to get appropriate icon for path step
const getStepIcon = (type) => {
  switch (type) {
    case 'START': return '🏁';
    case 'PICKUP': return '📦';
    case 'DELIVERY': return '🏠';
    case 'RETURN': return '🔄';
    default: return '📍';
  }
};

export default DijkstraVisualization;