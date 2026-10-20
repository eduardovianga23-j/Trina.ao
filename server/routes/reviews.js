import express from 'express';
import multer from 'multer';
import { protect, requirePerm } from '../middleware/auth.js';
import { saveImage } from '../utils/storage.js';
import { MAX_REVIEW_PHOTOS } from '../models/Review.js';
import {
  getProductReviews,
  getOrderReviews,
  saveReview,
  deleteReview,
  canUploadReviewPhotos,
  getAllReviewsAdmin,
} from '../controllers/reviewController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_REVIEW_PHOTOS },
  fileFilter: (req, file, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Formato não suportado. Usa JPG, PNG ou WEBP.'), { status: 400 })),
});

router.get('/admin', protect, requirePerm('reviews'), getAllReviewsAdmin);
router.get('/product/:productId', getProductReviews);
router.get('/order/:orderId', protect, getOrderReviews);
router.post('/', protect, saveReview);
router.delete('/:id', protect, deleteReview);

// POST /api/reviews/photos  (campo "photos", até 3) -> { urls }
router.post('/photos', protect, async (req, res) => {
  if (!(await canUploadReviewPhotos(req.user._id))) {
    return res.status(403).json({ message: 'Só podes enviar fotos depois de confirmares que recebeste uma encomenda' });
  }
  upload.array('photos', MAX_REVIEW_PHOTOS)(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Cada foto pode ter no máximo 5 MB'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `No máximo ${MAX_REVIEW_PHOTOS} fotos`
        : err.message;
      return res.status(400).json({ message });
    }
    if (!req.files?.length) return res.status(400).json({ message: 'Nenhuma foto enviada' });
    try {
      const urls = await Promise.all(req.files.map((f) => saveImage(f.buffer)));
      res.status(201).json({ urls });
    } catch (e) {
      res.status(e.status || 500).json({ message: e.status ? e.message : 'Erro ao guardar a foto' });
    }
  });
});

export default router;
