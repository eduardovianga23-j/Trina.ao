import express from 'express';
import {
  checkout,
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
import { protect, requirePerm } from '../middleware/auth.js';

const router = express.Router();

router.get('/shipping', getShipping);
router.post('/', protect, checkout);
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, requirePerm('orders'), getAllOrders);
router.get('/:id', protect, getOrderById);
router.post('/:id/cancel', protect, cancelPendingOrder);
router.post('/:id/received', protect, confirmReceived);
router.put('/:id/status', protect, requirePerm('orders'), updateOrderStatus);
router.get('/:id/invoice', protect, getInvoicePdf);
router.post('/:id/invoice', protect, requirePerm('orders'), retryInvoice);

export default router;
