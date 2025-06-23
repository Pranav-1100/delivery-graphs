import React, { useState } from 'react';

const AddOrderModal = ({ isOpen, onClose, onAddOrder, loading }) => {
  const [formData, setFormData] = useState({
    restaurantAddress: '',
    customerAddress: '',
    packageCount: 1,
    specialInstructions: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'packageCount' ? parseInt(value) || 1 : value
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
    
    if (!formData.restaurantAddress.trim()) {
      newErrors.restaurantAddress = 'Restaurant address is required';
    }
    
    if (!formData.customerAddress.trim()) {
      newErrors.customerAddress = 'Customer address is required';
    }
    
    if (!formData.packageCount || formData.packageCount < 1 || formData.packageCount > 5) {
      newErrors.packageCount = 'Package count must be between 1 and 5';
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
      await onAddOrder(formData);
      // Reset form on success
      setFormData({
        restaurantAddress: '',
        customerAddress: '',
        packageCount: 1,
        specialInstructions: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to add order:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      restaurantAddress: '',
      customerAddress: '',
      packageCount: 1,
      specialInstructions: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📦 Add New Order</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label htmlFor="restaurantAddress">Restaurant Address *</label>
            <input
              type="text"
              id="restaurantAddress"
              name="restaurantAddress"
              value={formData.restaurantAddress}
              onChange={handleInputChange}
              placeholder="e.g., McDonald's, Koramangala OR 12.8543, 77.6578"
              className={errors.restaurantAddress ? 'error' : ''}
            />
            {errors.restaurantAddress && <span className="error-text">{errors.restaurantAddress}</span>}
            <small className="input-help">
              Restaurant pickup location (address or coordinates)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="customerAddress">Customer Address *</label>
            <input
              type="text"
              id="customerAddress"
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleInputChange}
              placeholder="e.g., BTM Layout, Bangalore OR 12.8506, 77.6477"
              className={errors.customerAddress ? 'error' : ''}
            />
            {errors.customerAddress && <span className="error-text">{errors.customerAddress}</span>}
            <small className="input-help">
              Customer delivery location (address or coordinates)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="packageCount">Number of Packages *</label>
            <select
              id="packageCount"
              name="packageCount"
              value={formData.packageCount}
              onChange={handleInputChange}
              className={errors.packageCount ? 'error' : ''}
            >
              <option value={1}>1 package</option>
              <option value={2}>2 packages</option>
              <option value={3}>3 packages</option>
              <option value={4}>4 packages</option>
              <option value={5}>5 packages</option>
            </select>
            {errors.packageCount && <span className="error-text">{errors.packageCount}</span>}
            <small className="input-help">
              Maximum 5 packages per order (partner capacity constraint)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="specialInstructions">Special Instructions (Optional)</label>
            <textarea
              id="specialInstructions"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              placeholder="e.g., Ring doorbell twice, Call before delivery, Leave at door"
              rows={3}
            />
            <small className="input-help">
              Any special delivery instructions for the partner
            </small>
          </div>

          <div className="delivery-preview">
            <h4>📍 Delivery Route Preview:</h4>
            <div className="route-preview">
              <div className="route-step">
                <span className="route-icon pickup">🏪</span>
                <span className="route-text">
                  Pickup from: {formData.restaurantAddress || 'Restaurant'}
                </span>
              </div>
              <div className="route-arrow">↓</div>
              <div className="route-step">
                <span className="route-icon delivery">🏠</span>
                <span className="route-text">
                  Deliver to: {formData.customerAddress || 'Customer'}
                </span>
              </div>
              <div className="route-info">
                📦 {formData.packageCount} package{formData.packageCount !== 1 ? 's' : ''}
                {formData.specialInstructions && (
                  <div>💬 {formData.specialInstructions}</div>
                )}
              </div>
            </div>
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
                <>📦 Add Order</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;