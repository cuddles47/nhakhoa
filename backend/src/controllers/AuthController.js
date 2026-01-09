const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
        static async refreshToken(req, res) {
            try {
                const refreshToken = req.cookies && req.cookies.refreshToken;
                if (!refreshToken) {
                    return res.status(401).json({ success: false, message: 'Không tìm thấy refresh token' });
                }
                const jwt = require('jsonwebtoken');
                let decoded;
                try {
                    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
                } catch (err) {
                    return res.status(401).json({ success: false, message: 'Refresh token hết hạn, vui lòng đăng nhập lại' });
                }
                // Tạo access token mới
                const newAccessToken = jwt.sign(
                    { id: decoded.id },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '20m' }
                );
                return res.json({ success: true, accessToken: newAccessToken });
            } catch (error) {
                return res.status(500).json({ success: false, message: 'Lỗi khi cấp lại access token' });
            }
        }
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

            // Generate access token (short-lived)
            const accessToken = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.role 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '20m' } // access token: 20 phút
            );

            // Generate refresh token (long-lived)
            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
                { expiresIn: '7d' } // refresh token: 7 ngày
            );

            // Return user info (excluding password_hash)
            const { password_hash, ...userInfo } = user;

            // Set httpOnly cookie for refresh token
                const isProduction = process.env.NODE_ENV === 'development' ? false : true;
                const cookieOptions = {
                    httpOnly: true,
                    secure: isProduction, // chỉ bật secure khi production
                    sameSite: isProduction ? 'None' : 'Lax', // local thì dùng Lax, production thì None
                    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
                };
            res.cookie('refreshToken', refreshToken, cookieOptions);

            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    user: userInfo,
                    accessToken
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

    static async logout(req, res) {
        try {
            // Clear refreshToken cookie on logout
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'development' ? false : true, sameSite: 'None' });
            return res.json({ success: true, message: 'Đã đăng xuất' });
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi đăng xuất' });
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
