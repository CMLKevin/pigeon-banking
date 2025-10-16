import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAllAuctions,
  getAuctionById,
  createAuction,
  placeBid,
  confirmDelivery,
  getMyAuctions,
  getMyBids,
  cancelAuction,
  reportDeliveryIssue,
  autoReleaseEscrow,
  getEscrowStatus
} from '../controllers/auctionController.js';

const router = express.Router();

// All auction routes require authentication
router.use(authenticateToken);

// Get all auctions (with optional status filter)
router.get('/', getAllAuctions);

// Get user's own auctions
router.get('/my-auctions', getMyAuctions);

// Get user's bids
router.get('/my-bids', getMyBids);

// Get specific auction
router.get('/:id', getAuctionById);

// Create new auction
router.post('/', createAuction);

// Place bid on auction
router.post('/:id/bid', placeBid);

// Confirm delivery (buyer confirms receipt, releases escrow)
router.post('/:id/confirm-delivery', confirmDelivery);

// Report delivery issue (dispute)
router.post('/:id/report-issue', reportDeliveryIssue);

// Auto-release escrow (admin only)
router.post('/:id/auto-release', autoReleaseEscrow);

// Get escrow status for user
router.get('/escrow/status', getEscrowStatus);

// Cancel auction
router.delete('/:id', cancelAuction);

export default router;

