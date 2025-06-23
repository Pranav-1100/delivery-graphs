import React from 'react';

const OrdersList = ({ orders }) => {
  return (
    <div className="orders-list-container">
      <div className="section-header">
        <h2>📦 Pending Orders</h2>
        <span className="count-badge">{orders.length} orders</span>
      </div>

      <div className="orders-content">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📪</div>
            <h3>No Pending Orders</h3>
            <p>Initialize demo data to see available orders for optimization.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-id">Order #{order.id}</div>
                  <div className="order-packages">📦 {order.packageCount}</div>
                </div>

                <div className="order-route">
                  <div className="route-step">
                    <div className="route-icon pickup">🏪</div>
                    <div className="route-details">
                      <div className="route-label">Pickup</div>
                      <div className="route-address">{order.restaurantAddress}</div>
                      <div className="route-coordinates">
                        📍 {order.restaurantLocation.lat.toFixed(4)}, {order.restaurantLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="route-arrow">
                    <div className="arrow-line"></div>
                    <div className="arrow-head">→</div>
                  </div>

                  <div className="route-step">
                    <div className="route-icon delivery">🏠</div>
                    <div className="route-details">
                      <div className="route-label">Delivery</div>
                      <div className="route-address">{order.customerAddress}</div>
                      <div className="route-coordinates">
                        📍 {order.customerLocation.lat.toFixed(4)}, {order.customerLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                {order.specialInstructions && (
                  <div className="order-instructions">
                    <div className="instructions-icon">💬</div>
                    <div className="instructions-text">{order.specialInstructions}</div>
                  </div>
                )}

                <div className="order-footer">
                  <div className="order-status">
                    <span className="status-dot pending"></span>
                    <span className="status-text">Pending Assignment</span>
                  </div>
                  <div className="order-time">
                    Created: {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div className="orders-summary">
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-value">{orders.reduce((sum, o) => sum + o.packageCount, 0)}</span>
              <span className="stat-label">Total Packages</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{orders.filter(o => o.specialInstructions).length}</span>
              <span className="stat-label">Special Instructions</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{new Set(orders.map(o => o.restaurantAddress)).size}</span>
              <span className="stat-label">Unique Restaurants</span>
            </div>
          </div>
          
          <div className="optimization-note">
            <div className="note-icon">💡</div>
            <div className="note-text">
              Select multiple orders above to see how Dijkstra's algorithm finds the optimal delivery route!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;