import User from '../models/userModel.js';
import Dataset from '../models/datasetModel.js';
import Report from '../models/reportModel.js';
import ChatHistory from '../models/chatHistoryModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function registerUser(req, res) {
    try {
        const { name, email, password } = req.body;
        
        // Validate the input 
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                success: false,
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
                success: false,
            });
        }

        // Create new user 
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return res.status(201).json({
            message: "User registered successfully",
            success: true,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });
        
    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}

export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Every field is required",
                success: false,
            });
        }

        // Check if the user exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Check valid password
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
                success: false,
            });
        }

        // Generate token 
        const token = jwt.sign(
            { id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            success: true,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
            },
            token,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}

export async function getProfile(req, res) {
    try {
        // Find user by ID extracted from authenticated token (req.user.id) and exclude password
        const user = await User.findById(req.user.id).select('-password');

        // Check if user exists in database
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Compute real database counts for authenticated user
        const [datasetCount, reportCount, chatCount] = await Promise.all([
            Dataset.countDocuments({ userId: req.user.id }),
            Report.countDocuments({ userId: req.user.id }),
            ChatHistory.countDocuments({ userId: req.user.id }),
        ]);

        const userObj = user.toObject();
        userObj.stats = {
            datasets: datasetCount,
            reports: reportCount,
            chats: chatCount,
        };

        // Return user profile data with real stats
        return res.status(200).json({
            message: "User profile fetched successfully",
            success: true,
            user: userObj,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}

export async function updateProfile(req, res) {
    try {
        const { name, profilePicture, profileImageSource } = req.body;

        // Build updateData payload
        const updateData = {};
        if (name !== undefined) updateData.name = name;

        if (profileImageSource === 'none' || (profilePicture !== undefined && !profilePicture.trim())) {
            updateData.profilePicture = '';
            updateData.profileImageSource = 'none';
        } else if (profilePicture !== undefined) {
            updateData.profilePicture = profilePicture;
            if (profileImageSource) {
                updateData.profileImageSource = profileImageSource;
            }
        }

        // Find user by ID and update allowed fields
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        // If user is not found in database
        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Include stats in response
        const [datasetCount, reportCount, chatCount] = await Promise.all([
            Dataset.countDocuments({ userId: req.user.id }),
            Report.countDocuments({ userId: req.user.id }),
            ChatHistory.countDocuments({ userId: req.user.id }),
        ]);

        const userObj = updatedUser.toObject();
        userObj.stats = { datasets: datasetCount, reports: reportCount, chats: chatCount };

        // Return updated user profile
        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user: userObj,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}

export async function uploadAvatar(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image file to upload",
                success: false,
            });
        }

        // Construct public URL for uploaded avatar image
        const host = req.get('host') || 'localhost:3001';
        const protocol = req.protocol || 'http';
        const avatarUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                profilePicture: avatarUrl,
                profileImageSource: 'upload',
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Include stats in response
        const [datasetCount, reportCount, chatCount] = await Promise.all([
            Dataset.countDocuments({ userId: req.user.id }),
            Report.countDocuments({ userId: req.user.id }),
            ChatHistory.countDocuments({ userId: req.user.id }),
        ]);

        const userObj = updatedUser.toObject();
        userObj.stats = { datasets: datasetCount, reports: reportCount, chats: chatCount };

        return res.status(200).json({
            message: "Avatar uploaded successfully",
            success: true,
            user: userObj,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}

export async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate that both fields are provided
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Both current password and new password are required",
                success: false,
            });
        }

        // Find user by ID in database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Compare current password with hashed password in database
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Incorrect current password",
                success: false,
            });
        }

        // Hash new password and save
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = newHashedPassword;
        await user.save();

        return res.status(200).json({
            message: "Password changed successfully",
            success: true,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}