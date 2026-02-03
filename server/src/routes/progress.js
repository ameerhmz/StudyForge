import express from 'express';
import { saveProgress, getStats } from '../controllers/progress.js';

const router = express.Router();

router.post('/', saveProgress);
router.get('/:docId', getStats);

export default router;
