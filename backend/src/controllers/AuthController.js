const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validate input
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin'
                });
            }

            // Find user by username
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Tên đăng nhập hoặc mật khẩu không đúng'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Tên đăng nhập hoặc mật khẩu không đúng'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.role 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Return user info (excluding password_hash) and token
            const { password_hash, ...userInfo } = user;
            
            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    user: userInfo,
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi đăng nhập',
                error: error.message
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const userId = req.user?.id; // Assuming middleware sets req.user
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Chưa đăng nhập'
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;
