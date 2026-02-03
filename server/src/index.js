import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import uploadRouter from './routes/upload.js';
import chatRouter from './routes/chat.js';
import generateRouter from './routes/generate.js';
import progressRouter from './routes/progress.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);
app.use('/api/generate', generateRouter);
app.use('/api/progress', progressRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
