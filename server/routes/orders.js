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
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/shipping', getShipping);
router.post('/', protect, checkout);
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrderById);
router.post('/:id/cancel', protect, cancelPendingOrder);
router.post('/:id/received', protect, confirmReceived);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
