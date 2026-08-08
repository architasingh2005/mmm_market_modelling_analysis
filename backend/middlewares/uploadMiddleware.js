import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the uploads folder exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage destination and custom filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `${uniquePrefix}-${file.originalname}`);
    },
});

// File filter to restrict uploads to CSV files only
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isCsvMime = file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';

    if (fileExtension === '.csv' || isCsvMime) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed!'), false);
    }
};

// Image filter for avatar uploads
const avatarFilter = (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isImageMime = file.mimetype.startsWith('image/');

    if (allowedExts.includes(ext) || isImageMime) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (.jpg, .png, .webp, .gif, .svg) are allowed!'), false);
    }
};

// Configure Multer upload middleware for datasets
const upload = multer({
    storage,
    fileFilter,
});

// Configure Multer upload middleware for profile avatars (5MB max)
export const avatarUpload = multer({
    storage,
    fileFilter: avatarFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default upload;
