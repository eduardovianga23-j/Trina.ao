import express from 'express';
import {
  checkout,
  quote,
  getShipping,
  cancelPendingOrder,
  confirmReceived,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getInvoicePdf,
  retryInvoice,
} from '../controllers/orderController.js';
import { protect, optionalAuth, requirePerm } from '../middleware/auth.js';

const router = express.Router();

router.get('/shipping', getShipping);
router.post('/quote', optionalAuth, quote);
router.post('/', optionalAuth, checkout); // com ou sem conta
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, requirePerm('orders'), getAllOrders);
router.get('/:id', optionalAuth, getOrderById);
router.post('/:id/cancel', optionalAuth, cancelPendingOrder);
router.post('/:id/received', optionalAuth, confirmReceived);
router.put('/:id/status', protect, requirePerm('orders'), updateOrderStatus);
router.get('/:id/invoice', optionalAuth, getInvoicePdf);
router.post('/:id/invoice', protect, requirePerm('orders'), retryInvoice);

export default router;
