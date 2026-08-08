import express from 'express';
import {
    sendMessage,
    getSessions,
    getChatHistory,
    clearChatHistory,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/chat — send a message (requires sessionId in body)
router.post('/', protect, sendMessage);

// GET /api/chat/sessions — list all conversation sessions for the sidebar
router.get('/sessions', protect, getSessions);

// GET /api/chat?sessionId=xxx — get messages for a session
// GET /api/chat/:datasetId  — legacy: get messages by dataset (backward compat)
router.get('/', protect, getChatHistory);
router.get('/:datasetId', protect, getChatHistory);

// DELETE /api/chat?sessionId=xxx — clear a session
// DELETE /api/chat/:datasetId    — legacy clear by dataset
router.delete('/', protect, clearChatHistory);
router.delete('/:datasetId', protect, clearChatHistory);

export default router;
