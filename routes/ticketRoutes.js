import express from 'express';
import { createTicket, getMyTickets, getAllTickets, updateTicket } from '../controllers/ticketController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/my', getMyTickets);

router.route('/')
  .post(createTicket)
  .get(requireRole('super_admin', 'manager'), getAllTickets);

router.put('/:id', updateTicket);

export default router;
