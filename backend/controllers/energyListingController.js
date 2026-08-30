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
      availableDate: availableDate ? new Date(availableDate) : new Date(),
      description,
      status: 'PENDING_APPROVAL'
    });

    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all active approved listings
// @route   GET /api/energy/listings
// @access  Private
exports.getActiveListings = async (req, res) => {
  try {
    const listings = await EnergyListing.find({
      status: { $in: ['ACTIVE', 'PARTIALLY_SOLD'] },
      approvedQuantity: { $gt: 0 }
    }).populate('sellerId', 'name email');

    res.status(200).json({ success: true, count: listings.length, data: listings });
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
    res.status(200).json({ success: true, count: listings.length, data: listings });
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
    res.status(200).json({ success: true, data: listing });
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

    // Verify ownership
    if (listing.sellerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'User not authorized to update this listing' });
    }

    const { quantity, unit, unitPrice, availableDate, description } = req.body;

    listing.pendingQuantity = quantity !== undefined ? quantity : listing.pendingQuantity;
    listing.pendingUnit = unit !== undefined ? unit : listing.pendingUnit;
    listing.pendingUnitPrice = unitPrice !== undefined ? unitPrice : listing.pendingUnitPrice;
    if (availableDate) listing.availableDate = availableDate;
    if (description !== undefined) listing.description = description;
    
    // Listing returns to PENDING_APPROVAL after changes
    listing.status = 'PENDING_APPROVAL';

    await listing.save();

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Cancel listing by seller
// @route   DELETE /api/energy/listings/:id
// @access  Private
exports.cancelListing = async (req, res) => {
  try {
    const listing = await EnergyListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    if (listing.sellerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this listing' });
    }

    if (['COMPLETED'].includes(listing.status)) { // Example check
      return res.status(400).json({ success: false, error: 'Cannot cancel a completed listing' });
    }

    listing.status = 'CANCELLED';
    await listing.save();

    res.status(200).json({ success: true, data: {} });
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
    listing.status = 'ACTIVE';
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
    // We don't overwrite approvedQuantity/Price because previous ones might be kept.
    // Actually, requirement says: "If the Admin declines, the pending changes are discarded and the previous approved version remains active"
    // So let's restore active status if there was an approved version previously.
    if (listing.approvedQuantity > 0) {
      listing.status = 'ACTIVE';
      // pending goes back to approved
      listing.pendingQuantity = listing.approvedQuantity;
      listing.pendingUnitPrice = listing.approvedUnitPrice;
    }

    await listing.save();

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
