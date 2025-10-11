import express from 'express';
import { getAllUsers, searchUsers } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllUsers);
router.get('/search', authenticateToken, searchUsers);

export default router;

