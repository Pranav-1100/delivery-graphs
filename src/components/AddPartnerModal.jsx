import React, { useState } from 'react';

const AddPartnerModal = ({ isOpen, onClose, onAddPartner, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    startAddress: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Partner name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.startAddress.trim()) {
      newErrors.startAddress = 'Starting location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onAddPartner(formData);
      // Reset form on success
      setFormData({
        name: '',
        phone: '',
        startAddress: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to add partner:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      startAddress: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Add New Delivery Partner</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="partner-form">
          <div className="form-group">
            <label htmlFor="name">Partner Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., John Doe"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g., +91-9876543210"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="startAddress">Starting Location *</label>
            <input
              type="text"
              id="startAddress"
              name="startAddress"
              value={formData.startAddress}
              onChange={handleInputChange}
              placeholder="e.g., Koramangala, Bangalore OR 12.8482, 77.6577"
              className={errors.startAddress ? 'error' : ''}
            />
            {errors.startAddress && <span className="error-text">{errors.startAddress}</span>}
            <small className="input-help">
              You can enter an address or exact coordinates (lat, lng)
            </small>
          </div>

          <div className="constraint-info">
            <h4>Partner Constraints:</h4>
            <ul>
              <li>📦 Maximum capacity: 5 packages</li>
              <li>⏱️ Maximum delivery time: 60 minutes</li>
              <li>🚚 Will be used in Dijkstra route optimization</li>
            </ul>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>🔄 Adding...</>
              ) : (
                <>➕ Add Partner</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPartnerModal;