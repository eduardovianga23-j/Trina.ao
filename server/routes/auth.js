import express from 'express';
import {
  register, login, getMe, googleConfig, googleLogin, forgotPassword, resetPassword, changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../utils/rateLimit.js';

const router = express.Router();

// Limites por endereço de internet (IP) contra robôs
const QUARTER = 15 * 60 * 1000;
const loginLimit = rateLimit({ name: 'login-ip', windowMs: QUARTER, max: 30 });
const registerLimit = rateLimit({ name: 'register-ip', windowMs: 60 * 60 * 1000, max: 10, message: 'Foram criadas várias contas seguidas a partir desta ligação. Tenta mais tarde.' });
const forgotLimit = rateLimit({ name: 'forgot-ip', windowMs: 60 * 60 * 1000, max: 10 });
const resetLimit = rateLimit({ name: 'reset-ip', windowMs: QUARTER, max: 20 });

router.post('/register', registerLimit, register);
router.post('/login', loginLimit, login);
router.get('/me', protect, getMe);

// Recuperar e mudar a senha
router.post('/forgot', forgotLimit, forgotPassword);
router.post('/reset', resetLimit, resetPassword);
router.put('/password', protect, resetLimit, changePassword);

// Entrar ou criar conta com o Google
router.get('/google-config', googleConfig);
router.post('/google', loginLimit, googleLogin);

export default router;
