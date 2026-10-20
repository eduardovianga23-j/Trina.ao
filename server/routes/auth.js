import express from 'express';
import { register, login, getMe, googleConfig, googleLogin } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Entrar ou criar conta com o Google
router.get('/google-config', googleConfig);
router.post('/google', googleLogin);

export default router;
