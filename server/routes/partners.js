const express = require('express');
const router = express.Router();
const dataStore = require('../models/dataStore');
const googleMaps = require('../utils/googleMaps');

// GET /api/partners/stats/overview - Get partner statistics (MUST BE BEFORE /:id)
router.get('/stats/overview', (req, res) => {
  try {
    const partners = dataStore.getPartners();
    
    const stats = {
      totalPartners: partners.length,
      availablePartners: partners.filter(p => p.status === 'AVAILABLE').length,
      assignedPartners: partners.filter(p => p.status === 'ASSIGNED').length,
      averageCapacity: partners.length > 0 ? 
        partners.reduce((sum, p) => sum + p.maxPackages, 0) / partners.length : 0,
      partners: partners.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        location: `${p.currentLocation.lat}, ${p.currentLocation.lng}`,
        assignedOrders: dataStore.getPartnerOrders(p.id).length
      }))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get partner stats',
      error: error.message
    });
  }
});

// GET /api/partners - Get all delivery partners
router.get('/', (req, res) => {
  try {
    const partners = dataStore.getPartners();
    res.json({
      success: true,
      data: partners,
      count: partners.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partners',
      error: error.message
    });
  }
});

// GET /api/partners/:id - Get specific partner
router.get('/:id', (req, res) => {
  try {
    const partner = dataStore.getPartnerById(req.params.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Get assigned orders for this partner
    const assignedOrders = dataStore.getPartnerOrders(partner.id);

    res.json({
      success: true,
      data: {
        partner,
        assignedOrders,
        totalPackages: assignedOrders.reduce((sum, order) => sum + order.packageCount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner details',
      error: error.message
    });
  }
});

// POST /api/partners - Add new delivery partner
router.post('/', async (req, res) => {
  try {
    const { name, phone, startAddress } = req.body;

    if (!name || !phone || !startAddress) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and start address are required'
      });
    }

    // Geocode the start address
    let location;
    const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const coordMatch = startAddress.match(coordPattern);
    
    if (coordMatch) {
      // Use exact coordinates if provided
      location = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      };
    } else {
      // Geocode address
      const geocodeResult = await googleMaps.geocodeAddress(startAddress);
      location = geocodeResult.location;
    }
    
    const partnerData = {
      name: name.trim(),
      phone: phone.trim(),
      startLocation: location
    };

    const newPartner = dataStore.addPartner(partnerData);

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: newPartner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create partner',
      error: error.message
    });
  }
});

// PUT /api/partners/:id - Update partner
router.put('/:id', async (req, res) => {
  try {
    const partner = dataStore.getPartnerById(req.params.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    const updates = {};
    const { name, phone, startAddress, status } = req.body;

    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (status) updates.status = status;
    
    // Handle location update
    if (startAddress) {
      const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
      const coordMatch = startAddress.match(coordPattern);
      
      if (coordMatch) {
        updates.currentLocation = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
        updates.homeBase = updates.currentLocation;
      } else {
        const geocodeResult = await googleMaps.geocodeAddress(startAddress);
        updates.currentLocation = geocodeResult.location;
        updates.homeBase = geocodeResult.location;
      }
    }

    const updatedPartner = dataStore.updatePartner(req.params.id, updates);

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: updatedPartner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update partner',
      error: error.message
    });
  }
});

// DELETE /api/partners/:id - Delete partner
router.delete('/:id', (req, res) => {
  try {
    const partner = dataStore.getPartnerById(req.params.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Check if partner has assigned orders
    const assignedOrders = dataStore.getPartnerOrders(req.params.id);
    if (assignedOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete partner with assigned orders'
      });
    }

    // Remove partner
    const partnerIndex = dataStore.partners.findIndex(p => p.id === parseInt(req.params.id));
    if (partnerIndex !== -1) {
      dataStore.partners.splice(partnerIndex, 1);
    }

    res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete partner',
      error: error.message
    });
  }
});

module.exports = router;