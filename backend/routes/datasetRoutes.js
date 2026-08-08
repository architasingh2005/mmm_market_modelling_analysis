import express from 'express';
import {
    uploadDataset,
    getAllDatasets,
    getDatasetById,
    deleteDataset,
    getDatasetAnalytics,
} from '../controllers/datasetController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Route 1: Upload a dataset file (Protected + Multer file handler)
router.post('/upload', protect, upload.single('file'), uploadDataset);

// Route 2: Get all datasets belonging to logged-in user (Protected)
router.get('/', protect, getAllDatasets);

// Route 3: Get dynamic analytics for a dataset by ID (Protected)
router.get('/:id/analytics', protect, getDatasetAnalytics);

// Route 4: Get a specific dataset by ID (Protected)
router.get('/:id', protect, getDatasetById);

// Route 5: Delete a specific dataset by ID (Protected)
router.delete('/:id', protect, deleteDataset);

export default router;
