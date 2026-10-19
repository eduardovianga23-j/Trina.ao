import express from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../middleware/auth.js';
import { saveImage, deleteImage } from '../utils/storage.js';
import Product, { MAX_IMAGES } from '../models/Product.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_IMAGES }, // 5 MB por foto, no máximo 4
  fileFilter: (req, file, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Formato não suportado. Use JPG, PNG ou WEBP.'), { status: 400 })),
});

// POST /api/uploads  (campo "images", 1 a 4 fotos) -> { urls: [...] }
router.post('/', protect, adminOnly, (req, res) => {
  upload.array('images', MAX_IMAGES)(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Cada foto pode ter no máximo 5 MB'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `No máximo ${MAX_IMAGES} fotos`
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

// DELETE /api/uploads  { urls: [...] }
// Apaga fotos enviadas que acabaram por não ser usadas (ex.: removidas antes de guardar).
// Nunca apaga uma foto que algum produto esteja a usar.
router.delete('/', protect, adminOnly, async (req, res) => {
  const urls = Array.isArray(req.body?.urls) ? req.body.urls.filter((u) => typeof u === 'string').slice(0, 20) : [];
  let deleted = 0;
  for (const url of urls) {
    if (await Product.exists({ images: url })) continue;
    await deleteImage(url);
    deleted++;
  }
  res.json({ deleted });
});

export default router;
