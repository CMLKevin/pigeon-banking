import express from 'express';
import { signup, login, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

// Ensure cookies are set cross-origin if needed
const router = express.Router();
router.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

export default router;

