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
  // Initialize with empty arrays to prevent undefined errors
  const [partners, setPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [selectedPartnerOptimization, setSelectedPartnerOptimization] = useState(null);
  const [viewingPartnerId, setViewingPartnerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [apiError, setApiError] = useState(null);
  
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
      setApiError(null);
      
      const [partnersRes, ordersRes, statsRes] = await Promise.all([
        apiService.getPartners(),
        apiService.getOrders(),
        apiService.getSystemInfo()
      ]);
      
      // Add null checks and ensure arrays
      setPartners(Array.isArray(partnersRes?.data) ? partnersRes.data : []);
      setOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
      setStats(statsRes?.data || {});
      
    } catch (error) {
      console.error('API Error:', error);
      setApiError(error.message);
      showNotification('Error loading data: ' + error.message, 'error');
      
      // Keep empty arrays on error
      setPartners([]);
      setOrders([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const handleInitDemo = async () => {
    try {
      setLoading(true);
      const result = await apiService.initDemoData();
      showNotification('Demo data initialized successfully!', 'success');
      // Clear any existing optimization views when resetting data
      setOptimizationResult(null);
      setSelectedPartnerOptimization(null);
      setViewingPartnerId(null);
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
      setSelectedPartnerOptimization(null);
      setViewingPartnerId(null);
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
      setSelectedPartnerOptimization(null); // Clear individual partner view
      setViewingPartnerId(null);
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
      setSelectedPartnerOptimization(null); // Clear individual partner view
      setViewingPartnerId(null);
      showNotification(`Auto assignment completed! ${result.message}`, 'success');
      await loadAllData();
    } catch (error) {
      showNotification('Auto assignment failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle partner click to view their optimization
  const handlePartnerClick = async (partnerId) => {
    try {
      setLoading(true);
      const result = await apiService.getOptimizationDetails(partnerId);
      
      if (result.data && result.data.optimization) {
        setSelectedPartnerOptimization(result.data);
        setViewingPartnerId(partnerId);
        setOptimizationResult(null); // Clear global optimization view
        
        const partner = partners.find(p => p.id === partnerId);
        showNotification(`Viewing optimization details for ${partner?.name || 'Partner'}`, 'info');
      } else {
        const partner = partners.find(p => p.id === partnerId);
        if (result.data && result.data.needsOptimization) {
          showNotification(`${partner?.name || 'This partner'} has assigned orders but no stored optimization data. The optimization may have been lost after a system restart.`, 'warning');
        } else {
          showNotification(`No optimization data found for ${partner?.name || 'this partner'}. Try running auto-assign or manual optimization first.`, 'warning');
        }
      }
    } catch (error) {
      console.error('Partner optimization fetch error:', error);
      showNotification('Failed to load partner optimization: ' + error.message, 'error');
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

  // Add null checks and use fallback empty arrays
  const pendingOrders = Array.isArray(orders) ? orders.filter(order => order.status === 'PENDING') : [];
  const availablePartners = Array.isArray(partners) ? partners.filter(partner => partner.status === 'AVAILABLE') : [];

  // Determine which optimization data to show
  const currentOptimizationResult = selectedPartnerOptimization ? 
    { data: selectedPartnerOptimization } : optimizationResult;
  
  const viewingPartner = viewingPartnerId ? 
    partners.find(p => p.id === viewingPartnerId) : null;

  // Show API error screen if backend is not accessible
  if (apiError && !loading) {
    return (
      <div className="App">
        <div className="api-error-screen">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Backend Connection Error</h2>
            <p>Unable to connect to the backend server.</p>
            <div className="error-details">
              <p><strong>Error:</strong> {apiError}</p>
              <p><strong>Expected Backend URL:</strong> {process.env.NODE_ENV === 'production' ? window.location.origin + '/api' : 'https://graphs.trou.hackclub.app/api'}</p>
            </div>
            <div className="error-actions">
              <button onClick={loadAllData} className="btn btn-primary">
                🔄 Retry Connection
              </button>
              <button onClick={() => setApiError(null)} className="btn btn-secondary">
                🚀 Continue Offline
              </button>
            </div>
            <div className="troubleshooting">
              <h4>Troubleshooting:</h4>
              <ul>
                <li>Make sure the backend server is running</li>
                <li>Check if the API endpoint is accessible</li>
                <li>Verify CORS settings if backend is on different port</li>
                <li>Check browser console for more details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1> Dijkstra Route Optimization</h1>
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
          
          <PartnersList 
            partners={partners} 
            onPartnerClick={handlePartnerClick}
          />
          
          <OrdersList orders={pendingOrders} />
        </div>

        {/* Right Panel: Dijkstra Visualization */}
        <div className="right-panel">
          <DijkstraVisualization 
            optimizationResult={currentOptimizationResult}
            partners={partners}
            orders={orders}
            viewingPartner={viewingPartner}
            onClearView={() => {
              setSelectedPartnerOptimization(null);
              setViewingPartnerId(null);
            }}
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