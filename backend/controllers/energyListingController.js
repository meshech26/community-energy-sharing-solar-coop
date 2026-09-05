const EnergyListing = require('../models/EnergyListing');

// @desc    Create a new listing
// @route   POST /api/energy/listings
// @access  Private
exports.createListing = async (req, res) => {
  try {
    const { quantity, unit, unitPrice, availableDate, description } = req.body;

    const listing = await EnergyListing.create({
      sellerId: req.user.id,
      householdId: req.user.householdId,
      pendingQuantity: quantity,
      pendingUnit: unit || 'kWh',
      pendingUnitPrice: unitPrice,
      approvedQuantity: 0,
      approvedUnit: unit || 'kWh',
      approvedUnitPrice: 0,
      listedQuantity: quantity,
      availableQuantity: 0,
      availableDate: availableDate ? new Date(availableDate) : new Date(),
      description,
      status: 'PENDING_APPROVAL',
      isEdited: false
    });

    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all active approved listings (excludes requesting user's own listings for marketplace buying)
// @route   GET /api/energy/listings
// @access  Private
exports.getActiveListings = async (req, res) => {
  try {
    const query = {
      status: { $in: ['ACTIVE', 'PARTIALLY_SOLD'] },
      $or: [
        { availableQuantity: { $gt: 0 } },
        { approvedQuantity: { $gt: 0 } }
      ]
    };

    // Filter out current user's own listings so they only see energy available from other members
    if (req.user && req.user.id && req.query.includeOwn !== 'true') {
      query.sellerId = { $ne: req.user.id };
    }

    const listings = await EnergyListing.find(query).populate('sellerId', 'name email');
    const mapped = listings.map(l => {
      const obj = l.toObject();
      if (!obj.listedQuantity || obj.listedQuantity <= 0) {
        obj.listedQuantity = Math.max(obj.pendingQuantity || 0, obj.approvedQuantity || 0);
      }
      if (obj.availableQuantity === undefined) {
        obj.availableQuantity = obj.approvedQuantity !== undefined ? obj.approvedQuantity : 0;
      }
      return obj;
    });

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user's own listings
// @route   GET /api/energy/listings/my
// @access  Private
exports.getMyListings = async (req, res) => {
  try {
    const listings = await EnergyListing.find({ sellerId: req.user.id });
    const mapped = listings.map(l => {
      const obj = l.toObject();
      if (!obj.listedQuantity || obj.listedQuantity <= 0) {
        obj.listedQuantity = Math.max(obj.pendingQuantity || 0, obj.approvedQuantity || 0);
      }
      if (obj.availableQuantity === undefined) {
        obj.availableQuantity = obj.approvedQuantity !== undefined ? obj.approvedQuantity : 0;
      }
      return obj;
    });
    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single listing
// @route   GET /api/energy/listings/:id
// @access  Private
exports.getListingById = async (req, res) => {
  try {
    const listing = await EnergyListing.findById(req.params.id).populate('sellerId', 'name email');
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });
    const obj = listing.toObject();
    if (!obj.listedQuantity || obj.listedQuantity <= 0) {
      obj.listedQuantity = Math.max(obj.pendingQuantity || 0, obj.approvedQuantity || 0);
    }
    if (obj.availableQuantity === undefined) {
      obj.availableQuantity = obj.approvedQuantity !== undefined ? obj.approvedQuantity : 0;
    }
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update listing by seller
// @route   PUT /api/energy/listings/:id
// @access  Private
exports.updateListing = async (req, res) => {
  try {
    let listing = await EnergyListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    // Verify ownership or admin
    if (listing.sellerId.toString() !== req.user.id.toString() && !req.user.isCoopAdmin) {
      return res.status(403).json({ success: false, error: 'User not authorized to update this listing' });
    }

    const { quantity, unit, unitPrice, availableDate, description } = req.body;

    // Capture previous terms for admin comparison
    listing.previousQuantity = listing.approvedQuantity > 0 ? listing.approvedQuantity : listing.pendingQuantity;
    listing.previousUnitPrice = listing.approvedUnitPrice > 0 ? listing.approvedUnitPrice : listing.pendingUnitPrice;
    listing.isEdited = true;

    if (quantity !== undefined) {
      const numQty = parseFloat(quantity);
      listing.pendingQuantity = numQty;
      listing.listedQuantity = numQty;
      listing.availableQuantity = 0; // resets until approved
    }
    if (unit !== undefined) {
      listing.pendingUnit = unit;
    }
    if (unitPrice !== undefined) {
      listing.pendingUnitPrice = parseFloat(unitPrice);
    }
    if (availableDate) listing.availableDate = availableDate;
    if (description !== undefined) listing.description = description;
    
    // Listing returns to PENDING_APPROVAL after changes and clears decline reason
    listing.status = 'PENDING_APPROVAL';
    listing.declineReason = undefined;

    await listing.save();

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete/Cancel listing by seller
// @route   DELETE /api/energy/listings/:id
// @access  Private
exports.cancelListing = async (req, res) => {
  try {
    const listing = await EnergyListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    if (listing.sellerId.toString() !== req.user.id.toString() && !req.user.isCoopAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this listing' });
    }

    if (['COMPLETED'].includes(listing.status)) { // Example check
      return res.status(400).json({ success: false, error: 'Cannot delete a completed listing' });
    }

    // Permanently delete so it is removed from user side AND admin approvals queue
    await EnergyListing.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all pending listings (Admin)
// @route   GET /api/energy/admin/pending
// @access  Private/Admin
exports.getPendingListings = async (req, res) => {
  try {
    const listings = await EnergyListing.find({ status: 'PENDING_APPROVAL' }).populate('sellerId', 'name email');
    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Approve listing (Admin)
// @route   PUT /api/energy/admin/listings/:id/approve
// @access  Private/Admin
exports.approveListing = async (req, res) => {
  try {
    const listing = await EnergyListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    listing.approvedQuantity = listing.pendingQuantity;
    listing.approvedUnit = listing.pendingUnit;
    listing.approvedUnitPrice = listing.pendingUnitPrice;
    listing.listedQuantity = listing.pendingQuantity;
    listing.availableQuantity = listing.pendingQuantity;
    listing.status = 'ACTIVE';
    listing.isEdited = false; // reset edit flag upon approval
    listing.approvedBy = req.user.id;
    listing.approvedAt = Date.now();
    listing.declineReason = undefined; // clear any old reason

    await listing.save();

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Decline listing (Admin)
// @route   PUT /api/energy/admin/listings/:id/decline
// @access  Private/Admin
exports.declineListing = async (req, res) => {
  try {
    const listing = await EnergyListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    listing.status = 'DECLINED';
    listing.declineReason = req.body.reason || 'Not specified';
    listing.isEdited = false;

    await listing.save();

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
