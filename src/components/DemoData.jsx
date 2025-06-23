import React, { useState } from 'react';

const DemoData = ({ 
  partners, 
  orders, 
  onOptimizeRoute, 
  onAutoAssign,
  availablePartners, 
  pendingOrders, 
  loading 
}) => {
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showManualAssign, setShowManualAssign] = useState(false);

  const handleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleOptimize = () => {
    if (!selectedPartner || selectedOrders.length === 0) {
      alert('Please select a partner and at least one order');
      return;
    }
    
    // Check partner capacity constraint
    const partner = availablePartners.find(p => p.id.toString() === selectedPartner);
    const totalPackages = selectedOrdersData.reduce((sum, order) => sum + order.packageCount, 0);
    
    if (totalPackages > partner.maxPackages) {
      alert(`Cannot assign: Total packages (${totalPackages}) exceed partner capacity (${partner.maxPackages})`);
      return;
    }
    
    onOptimizeRoute(parseInt(selectedPartner), selectedOrders);
    setSelectedOrders([]);
    setSelectedPartner('');
  };

  const handleAutoAssign = async () => {
    if (pendingOrders.length === 0 || availablePartners.length === 0) {
      alert('Need at least one pending order and one available partner for auto assignment');
      return;
    }

    onAutoAssign();
  };

  const selectedOrdersData = selectedOrders.map(id => 
    pendingOrders.find(o => o.id === id)
  ).filter(Boolean);

  const totalPackages = selectedOrdersData.reduce((sum, order) => sum + order.packageCount, 0);
  const selectedPartnerData = availablePartners.find(p => p.id.toString() === selectedPartner);
  const isOverCapacity = selectedPartnerData && totalPackages > selectedPartnerData.maxPackages;

  return (
    <div className="demo-data-container">
      <div className="section-header">
        <h2>🎯 Dijkstra Route Optimization</h2>
        <p>Automatic optimal assignment with 30-minute constraints</p>
      </div>

      <div className="optimization-setup">
        {/* PRIMARY: Auto Assignment */}
        <div className="auto-assign-section primary">
          <h3>🤖 Smart Auto Assignment (Main Feature)</h3>
          <div className="constraint-display">
            <div className="constraint-item">
              <span className="constraint-icon">📦</span>
              <span>Max 5 packages per partner</span>
            </div>
            <div className="constraint-item">
              <span className="constraint-icon">⏱️</span>
              <span>Max 30 minutes delivery time</span>
            </div>
            <div className="constraint-item">
              <span className="constraint-icon">🎯</span>
              <span>Dijkstra's Algorithm optimization</span>
            </div>
          </div>
          
          <div className="auto-assign-stats">
            <div className="stat">
              <span className="stat-value">{availablePartners.length}</span>
              <span className="stat-label">Available Partners</span>
            </div>
            <div className="stat">
              <span className="stat-value">{pendingOrders.length}</span>
              <span className="stat-label">Pending Orders</span>
            </div>
            <div className="stat">
              <span className="stat-value">{pendingOrders.reduce((sum, o) => sum + o.packageCount, 0)}</span>
              <span className="stat-label">Total Packages</span>
            </div>
          </div>

          <button
            onClick={handleAutoAssign}
            disabled={loading || pendingOrders.length === 0 || availablePartners.length === 0}
            className="btn btn-success auto-assign-btn large"
          >
            {loading ? (
              <>🔄 Running Dijkstra Optimization...</>
            ) : (
              <>🚀 Auto Assign with Dijkstra Algorithm</>
            )}
          </button>
          
          <div className="algorithm-info">
            <h4>🧠 What the algorithm does:</h4>
            <ul>
              <li>🗺️ Fetches real distances from Google Maps API</li>
              <li>📊 Builds graph with all locations as nodes</li>
              <li>🔍 Applies Dijkstra's shortest path algorithm</li>
              <li>✅ Validates 30-minute time constraints</li>
              <li>🎯 Finds optimal pickup → delivery sequence</li>
              <li>⚖️ Distributes orders fairly across partners</li>
            </ul>
          </div>
        </div>

        {/* SECONDARY: Manual Override */}
        <div className="manual-section-toggle">
          <button 
            onClick={() => setShowManualAssign(!showManualAssign)}
            className="btn btn-secondary toggle-btn"
          >
            {showManualAssign ? '🔼 Hide Manual Override' : '🔽 Show Manual Override (Advanced)'}
          </button>
        </div>

        {showManualAssign && (
          <div className="manual-assign-section secondary">
            <h3>👤 Manual Override (For Testing)</h3>
            <p className="manual-note">⚠️ Manual assignment may violate 30-minute constraints</p>
            
            {/* Partner Selection */}
            <div className="partner-selection">
              <h4>Select Partner:</h4>
              {availablePartners.length === 0 ? (
                <div className="no-partners">
                  <p>⚠️ No available partners.</p>
                </div>
              ) : (
                <div className="partner-options">
                  {availablePartners.map(partner => (
                    <label key={partner.id} className="partner-option compact">
                      <input
                        type="radio"
                        name="partner"
                        value={partner.id}
                        checked={selectedPartner === partner.id.toString()}
                        onChange={(e) => setSelectedPartner(e.target.value)}
                      />
                      <div className="partner-info">
                        <div className="partner-name">{partner.name}</div>
                        <div className="partner-details">
                          📦 {partner.maxPackages} packages | ⏱️ 30 min limit
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Order Selection */}
            <div className="order-selection">
              <h4>Select Orders:</h4>
              {selectedPartnerData && (
                <div className="capacity-info">
                  <span className={`capacity-count ${isOverCapacity ? 'error' : 'success'}`}>
                    Selected: {totalPackages}/{selectedPartnerData.maxPackages} packages
                  </span>
                  {isOverCapacity && (
                    <div className="capacity-warning">
                      ⚠️ Exceeds partner capacity!
                    </div>
                  )}
                </div>
              )}
              
              {pendingOrders.length === 0 ? (
                <div className="no-orders">
                  <p>⚠️ No pending orders.</p>
                </div>
              ) : (
                <div className="order-options compact">
                  {pendingOrders.slice(0, 4).map(order => (
                    <label key={order.id} className="order-option compact">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleOrderSelection(order.id)}
                      />
                      <div className="order-info">
                        <span className="order-id">#{order.id}</span>
                        <span className="order-packages">📦 {order.packageCount}</span>
                        <span className="order-route-compact">
                          {order.restaurantAddress.split(',')[0]} → {order.customerAddress.split(',')[0]}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Optimize Button */}
            <button
              onClick={handleOptimize}
              disabled={!selectedPartner || selectedOrders.length === 0 || isOverCapacity || loading}
              className="btn btn-primary optimize-btn"
            >
              {loading ? (
                <>🔄 Processing...</>
              ) : (
                <>🧪 Test Manual Assignment</>
              )}
            </button>
          </div>
        )}

        {/* Quick Demo Actions */}
        <div className="quick-demo-section">
          <h4>🎬 Quick Demo Actions:</h4>
          <div className="demo-buttons">
            <button
              onClick={() => {
                if (pendingOrders.length > 0) {
                  handleAutoAssign();
                }
              }}
              disabled={loading || pendingOrders.length === 0}
              className="btn btn-demo demo-primary"
            >
              🎯 Run Full Demo
            </button>
            
            <button
              onClick={() => {
                if (availablePartners.length > 0 && pendingOrders.length >= 2) {
                  setSelectedPartner(availablePartners[0].id.toString());
                  setSelectedOrders(pendingOrders.slice(0, 2).map(o => o.id));
                  setShowManualAssign(true);
                }
              }}
              disabled={loading || pendingOrders.length < 2}
              className="btn btn-demo demo-secondary"
            >
              🧪 Test 2 Orders
            </button>

            <button
              onClick={() => {
                setSelectedPartner('');
                setSelectedOrders([]);
                setShowManualAssign(false);
              }}
              disabled={loading}
              className="btn btn-demo demo-clear"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoData;