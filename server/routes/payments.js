import express from 'express';
import { stripeWebhook } from '../controllers/orderController.js';

const router = express.Router();

// O Stripe precisa do pedido "em bruto" para confirmar a assinatura
router.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook);

export default router;
