import express from 'express';
import {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
} from "../controllers/authControler.js";
import { protect } from '../middlewares/authMiddleware.js';
import { avatarUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, avatarUpload.single('file'), uploadAvatar);
router.put('/change-password', protect, changePassword);

export default router;