import React from 'react';

const PartnersList = ({ partners }) => {
  const availablePartners = partners.filter(p => p.status === 'AVAILABLE');
  const assignedPartners = partners.filter(p => p.status === 'ASSIGNED');

  return (
    <div className="partners-list-container">
      <div className="section-header">
        <h2>👥 Delivery Partners</h2>
        <span className="count-badge">{partners.length} partners</span>
      </div>

      <div className="partners-content">
        {partners.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No Partners Available</h3>
            <p>Initialize demo data to see available delivery partners.</p>
          </div>
        ) : (
          <div className="partners-sections">
            {/* Available Partners */}
            {availablePartners.length > 0 && (
              <div className="partners-section">
                <h3 className="section-title">
                  <span className="status-dot available"></span>
                  Available Partners ({availablePartners.length})
                </h3>
                <div className="partners-grid">
                  {availablePartners.map(partner => (
                    <PartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Partners */}
            {assignedPartners.length > 0 && (
              <div className="partners-section">
                <h3 className="section-title">
                  <span className="status-dot assigned"></span>
                  Assigned Partners ({assignedPartners.length})
                </h3>
                <div className="partners-grid">
                  {assignedPartners.map(partner => (
                    <PartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {partners.length > 0 && (
        <div className="partners-summary">
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-value">{availablePartners.length}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{assignedPartners.length}</span>
              <span className="stat-label">Assigned</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{partners.reduce((sum, p) => sum + p.maxPackages, 0)}</span>
              <span className="stat-label">Total Capacity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PartnerCard = ({ partner }) => {
  return (
    <div className={`partner-card ${partner.status.toLowerCase()}`}>
      <div className="partner-header">
        <div className="partner-name">{partner.name}</div>
        <div className={`partner-status ${partner.status.toLowerCase()}`}>
          <span className="status-dot"></span>
          <span className="status-text">{partner.status}</span>
        </div>
      </div>

      <div className="partner-details">
        <div className="detail-item">
          <span className="detail-icon">📞</span>
          <span className="detail-text">{partner.phone}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-icon">📦</span>
          <span className="detail-text">Max {partner.maxPackages} packages</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-icon">⏱️</span>
          <span className="detail-text">Max {partner.maxDeliveryTime / 60} min delivery</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-icon">📍</span>
          <span className="detail-text">
            {partner.currentLocation.lat.toFixed(4)}, {partner.currentLocation.lng.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="partner-footer">
        <div className="partner-created">
          Joined: {new Date(partner.createdAt).toLocaleDateString()}
        </div>
        
        {partner.status === 'AVAILABLE' && (
          <div className="partner-ready">
            <span className="ready-icon">✅</span>
            <span className="ready-text">Ready for optimization</span>
          </div>
        )}
        
        {partner.status === 'ASSIGNED' && (
          <div className="partner-working">
            <span className="working-icon">🚚</span>
            <span className="working-text">Currently optimized</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnersList;