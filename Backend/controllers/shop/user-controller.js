const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
        expiresIn: '30d'
    });
};

// Register user
const registerUser = async (req, res) => {
    try {
        const { username, email, password, userType, firstName, lastName } = req.body;
        
        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            userType: userType || 'customer',
            firstName,
            lastName
        });
        
        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                userType: user.userType,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        // Extract credentials directly from request body
        const { username, password, userType } = req.body;
        console.log('Login attempt:', { username, userType });
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }
        
        // Find user by username and userType
        const user = await User.findOne({ username, userType });
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log("Stored Hashed Password:", user.password);
        console.log("Entered Password:", password);
        
        // Check password match
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isPasswordMatch ? 'Yes' : 'No');
        
        if (isPasswordMatch) {
            // Create response object based on user type
            const responseData = {
                _id: user._id,
                username: user.username,
                email: user.email,
                userType: user.userType,
                token: generateToken(user._id),
                address: user.address,
                phone: user.phone,
                createdAt: user.createdAt,
                updatedAt: user.updated

            };
            console.log('Login successful - Full user data being sent to client:', JSON.stringify(responseData, null, 2));

            console.log('Login successful:', responseData);
            console.log('User Type:', user.userType);
            
            // Add name if available
            if (user.firstName) responseData.firstName = user.firstName;
            if (user.lastName) responseData.lastName = user.lastName;
            
            // Add shopkeeper specific data if needed
            if (user.userType === 'shopkeeper') {
                if (user.storeName) responseData.storeName = user.storeName;
                if (user.address) responseData.address = user.address;
            }
            
            res.json(responseData);
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        console.log("Update profile request received:", req.body);
        console.log("User from token:", req.user);
        
        const userId = req.user._id;
        const { firstName, lastName, email, phone, address, storeName, bio } = req.body;
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found with ID:", userId);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log("Found user:", user);
        
        // Update fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (storeName && user.userType === 'shopkeeper') user.storeName = storeName;
        
        // Handle bio field - check if it exists in schema
        if (bio !== undefined && 'bio' in user.schema.paths) {
            user.bio = bio;
        }
        
        console.log("Updated user object before save:", user);
        
        // Save updated user
        const updatedUser = await user.save();
        
        console.log("User saved successfully");
        
        // Return updated user data without password
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            userType: updatedUser.userType,
            phone: updatedUser.phone|| "",
            address: updatedUser.address,
            storeName: updatedUser.storeName,
            bio: updatedUser.bio || "",  // Handle case where bio field might not exist
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        });
        
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

const UserController = {
    // Get user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching profile'
            });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const { name, email, phone, address } = req.body;
            const userId = req.user.id;

            // Check if email is being changed and if it's already taken
            if (email && email !== req.user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        name: name || req.user.name,
                        email: email || req.user.email,
                        phone: phone || req.user.phone,
                        address: address || req.user.address,
                        updated_at: new Date()
                    }
                },
                { new: true }
            ).select('-password');

            res.json({
                success: true,
                data: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating profile'
            });
        }
    },

    // Change password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            // Get user with password
            const user = await User.findById(userId);

            // Check current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.updated_at = new Date();

            await user.save();

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Error changing password'
            });
        }
    },

    // Delete account
    deleteAccount: async (req, res) => {
        try {
            const userId = req.user.id;

            // Instead of actually deleting, set status to inactive
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        status: 'inactive',
                        updated_at: new Date()
                    }
                }
            );

            res.json({
                success: true,
                message: 'Account deactivated successfully'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deactivating account'
            });
        }
    }
};

module.exports = UserController;
