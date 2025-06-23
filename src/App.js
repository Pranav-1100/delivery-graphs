import React, { useState, useEffect } from 'react';
import './App.css';
import DemoData from './components/DemoData';
import OrdersList from './components/OrdersList';
import PartnersList from './components/PartnersList';
import DijkstraVisualization from './components/DijkstraVisualization';
import AddPartnerModal from './components/AddPartnerModal';
import AddOrderModal from './components/AddOrderModal';
import { apiService } from './services/api';

function App() {
  const [partners, setPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Modal states
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [partnersRes, ordersRes, statsRes] = await Promise.all([
        apiService.getPartners(),
        apiService.getOrders(),
        apiService.getSystemInfo()
      ]);
      
      setPartners(partnersRes.data);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      showNotification('Error loading data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInitDemo = async () => {
    try {
      setLoading(true);
      const result = await apiService.initDemoData();
      showNotification('Demo data initialized successfully!', 'success');
      await loadAllData();
    } catch (error) {
      showNotification('Failed to initialize demo data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSystem = async () => {
    if (!window.confirm('Reset all assignments? This will clear optimization results but keep all partners and orders.')) return;
    
    try {
      setLoading(true);
      await apiService.resetSystem();
      setOptimizationResult(null);
      showNotification('System reset successfully!', 'success');
      await loadAllData();
    } catch (error) {
      showNotification('Failed to reset system: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeRoute = async (partnerId, orderIds) => {
    try {
      setLoading(true);
      const result = await apiService.optimizeRoute(partnerId, orderIds);
      setOptimizationResult(result.data);
      showNotification('Route optimization completed!', 'success');
      await loadAllData();
    } catch (error) {
      showNotification('Route optimization failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      const result = await apiService.autoAssignOrders();
      setOptimizationResult(result.data);
      showNotification(`Auto assignment completed! ${result.message}`, 'success');
      await loadAllData();
    } catch (error) {
      showNotification('Auto assignment failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = async (partnerData) => {
    try {
      setLoading(true);
      await apiService.createPartner(partnerData);
      showNotification(`Partner "${partnerData.name}" added successfully!`, 'success');
      await loadAllData();
    } catch (error) {
      showNotification('Failed to add partner: ' + error.message, 'error');
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (orderData) => {
    try {
      setLoading(true);
      await apiService.createOrder(orderData);
      showNotification('Order added successfully!', 'success');
      await loadAllData();
    } catch (error) {
      showNotification('Failed to add order: ' + error.message, 'error');
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const pendingOrders = orders.filter(order => order.status === 'PENDING');
  const availablePartners = partners.filter(partner => partner.status === 'AVAILABLE');

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>🎯 Dijkstra Route Optimization Demo</h1>
          <p>Delivery Route Optimization using Graph Algorithms</p>
          <div className="header-actions">
            <button 
              onClick={handleInitDemo} 
              disabled={loading}
              className="btn btn-primary"
            >
              📊 Load Demo Data
            </button>
            <button 
              onClick={() => setShowAddPartnerModal(true)} 
              disabled={loading}
              className="btn btn-success"
            >
              👤 Add Partner
            </button>
            <button 
              onClick={() => setShowAddOrderModal(true)} 
              disabled={loading}
              className="btn btn-success"
            >
              📦 Add Order
            </button>
            <button 
              onClick={handleResetSystem} 
              disabled={loading}
              className="btn btn-secondary"
            >
              🔄 Reset System
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalPartners || 0}</div>
            <div className="stat-label">Partners</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.availablePartners || 0}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalOrders || 0}</div>
            <div className="stat-label">Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{stats.pendingOrders || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <div className="stat-number">{stats.assignedOrders || 0}</div>
            <div className="stat-label">Assigned</div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel: Demo Controls & Data */}
        <div className="left-panel">
          <DemoData 
            partners={partners}
            orders={orders}
            onOptimizeRoute={handleOptimizeRoute}
            onAutoAssign={handleAutoAssign}
            availablePartners={availablePartners}
            pendingOrders={pendingOrders}
            loading={loading}
          />
          
          <PartnersList partners={partners} />
          
          <OrdersList orders={pendingOrders} />
        </div>

        {/* Right Panel: Dijkstra Visualization */}
        <div className="right-panel">
          <DijkstraVisualization 
            optimizationResult={optimizationResult}
            partners={partners}
            orders={orders}
          />
        </div>
      </div>

      {/* Modals */}
      <AddPartnerModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onAddPartner={handleAddPartner}
        loading={loading}
      />

      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onAddOrder={handleAddOrder}
        loading={loading}
      />

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>×</button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;