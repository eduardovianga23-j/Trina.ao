import express from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getRelatedProducts,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
} from '../controllers/productController.js';
import { protect, staffOnly } from '../middleware/auth.js';

const router = express.Router();

// Público
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, addReview);

// Equipa da loja (administrador principal e gestores)
router.get('/admin/all', protect, staffOnly, getAllProductsAdmin);
router.post('/', protect, staffOnly, createProduct);
router.put('/:id', protect, staffOnly, updateProduct);
router.delete('/:id', protect, staffOnly, deleteProduct);

export default router;
