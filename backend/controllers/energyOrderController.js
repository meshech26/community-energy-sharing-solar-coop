const EnergyOrder = require('../models/EnergyOrder');
const EnergyListing = require('../models/EnergyListing');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// @desc    Create a new order
// @route   POST /api/energy/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { listingId, quantity } = req.body;

    const listing = await EnergyListing.findById(listingId);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    if (!['ACTIVE', 'PARTIALLY_SOLD', 'PENDING_APPROVAL'].includes(listing.status) || listing.approvedQuantity <= 0) {
      return res.status(400).json({ success: false, error: 'Listing is not available for purchase' });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Requested quantity must be greater than zero' });
    }

    if (quantity > listing.approvedQuantity) {
      return res.status(400).json({ success: false, error: 'Not enough energy available' });
    }

    if (listing.sellerId.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot purchase your own energy listing' });
    }

    const totalAmount = quantity * listing.approvedUnitPrice;

    const order = await EnergyOrder.create({
      listingId: listing._id,
      buyerId: req.user.id,
      buyerHouseholdId: req.user.householdId,
      sellerId: listing.sellerId,
      sellerHouseholdId: listing.householdId,
      purchasedQuantity: quantity,
      unit: listing.approvedUnit,
      agreedUnitPrice: listing.approvedUnitPrice,
      totalAmount,
      status: 'PENDING'
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user's orders (both buying and selling)
// @route   GET /api/energy/orders/my
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await EnergyOrder.find({
      $or: [
        { buyerId: req.user.id }, 
        { sellerId: req.user.id },
        { buyerHouseholdId: req.user.householdId },
        { sellerHouseholdId: req.user.householdId }
      ]
    }).populate('listingId').populate('buyerId', 'name email').populate('sellerId', 'name email');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get order details
// @route   GET /api/energy/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await EnergyOrder.findById(req.params.id)
      .populate('listingId')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Ensure only buyer, seller, or admin can view
    if (order.buyerId._id.toString() !== req.user.id.toString() &&
        order.sellerId._id.toString() !== req.user.id.toString() &&
        req.user.isCoopAdmin !== true) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Start payment processing
// @route   POST /api/energy/orders/:id/payment
// @access  Private
exports.startPayment = async (req, res) => {
  try {
    const order = await EnergyOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (order.buyerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Order cannot be processed for payment' });
    }

    // Convert total amount to smallest currency unit (e.g. cents for LKR if using Stripe, LKR doesn't have a smaller unit typically represented in decimals but stripe treats LKR smallest unit as cents, meaning 1 LKR = 100 cents)
    const amountInCents = Math.round(order.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'lkr',
      metadata: { orderId: order._id.toString() },
    });

    order.paymentIntentId = paymentIntent.id;
    order.status = 'PAYMENT_PROCESSING';
    await order.save();

    res.status(200).json({ 
      success: true, 
      data: order, 
      clientSecret: paymentIntent.client_secret,
      message: 'Payment processing started' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Confirm payment
// @route   POST /api/energy/orders/:id/payment/confirm
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const order = await EnergyOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (order.buyerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (order.status !== 'PAYMENT_PROCESSING') {
      return res.status(400).json({ success: false, error: 'Order is not in payment processing stage' });
    }

    if (order.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ success: false, error: 'Payment has not succeeded yet' });
      }
    } else {
      // For backwards compatibility or testing without Stripe
      console.warn('No paymentIntentId found on order, bypassing Stripe verification for test.');
    }

    const listing = await EnergyListing.findById(order.listingId);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    // Deduct quantity from listing
    if (listing.approvedQuantity < order.purchasedQuantity) {
      return res.status(400).json({ success: false, error: 'Not enough available energy to complete purchase' });
    }

    listing.approvedQuantity -= order.purchasedQuantity;
    // We should also deduct from pendingQuantity, otherwise pending shows more than approved.
    listing.pendingQuantity -= order.purchasedQuantity;

    if (listing.status !== 'PENDING_APPROVAL') {
      if (listing.approvedQuantity === 0) {
        listing.status = 'SOLD_OUT';
      } else {
        listing.status = 'PARTIALLY_SOLD';
      }
    }

    await listing.save();

    order.status = 'COMPLETED';
    await order.save();

    res.status(200).json({ success: true, data: order, message: 'Payment completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
