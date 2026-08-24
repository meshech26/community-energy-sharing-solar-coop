const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createListing,
  getActiveListings,
  getMyListings,
  getListingById,
  updateListing,
  cancelListing,
  getPendingListings,
  approveListing,
  declineListing
} = require('../controllers/energyListingController');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  startPayment,
  confirmPayment
} = require('../controllers/energyOrderController');

const router = express.Router();

// Publicly visible endpoints ? No, requirement says "authenticated households".
// So all routes need `protect`

// --- LISTINGS ---
router.route('/listings')
  .post(protect, createListing)
  .get(protect, getActiveListings);

router.route('/listings/my')
  .get(protect, getMyListings);

router.route('/listings/:id')
  .get(protect, getListingById)
  .put(protect, updateListing)
  .delete(protect, cancelListing);

// --- ADMIN LISTINGS ---
router.route('/admin/pending')
  .get(protect, admin, getPendingListings);

router.route('/admin/listings/:id/approve')
  .put(protect, admin, approveListing);

router.route('/admin/listings/:id/decline')
  .put(protect, admin, declineListing);

// --- ORDERS ---
router.route('/orders')
  .post(protect, createOrder);

router.route('/orders/my')
  .get(protect, getMyOrders);

router.route('/orders/:id')
  .get(protect, getOrderById);

router.route('/orders/:id/payment')
  .post(protect, startPayment);

router.route('/orders/:id/payment/confirm')
  .post(protect, confirmPayment);

module.exports = router;
