import express from 'express';
import multer from 'multer';
import { extractText } from '../services/parser.js';
import { saveDocument } from '../services/storage.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF files are allowed' });
        }

        console.log(`Processing file: ${req.file.originalname}`);

        const text = await extractText(req.file.buffer);
        const docId = await saveDocument(req.file.originalname, text);

        res.status(201).json({
            message: 'Document uploaded and processed successfully',
            documentId: docId
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process document', details: error.message });
    }
});

export default router;
