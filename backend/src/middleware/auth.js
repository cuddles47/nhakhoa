const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticate = (req, res, next) => {
    try {
        // Get access token from Authorization header
        const authHeader = req.headers.authorization;
        let accessToken = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        }

        // Try verify access token
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key');
                req.user = decoded;
                return next();
            } catch (err) {
                if (err.name !== 'TokenExpiredError') {
                    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
                }
                // Nếu access token hết hạn, tiếp tục kiểm tra refresh token
            }
        }

        // Nếu không có access token hoặc access token hết hạn, kiểm tra refresh token
        const refreshToken = req.cookies && req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Token đã hết hạn, vui lòng đăng nhập lại' });
        }
        // Verify refresh token
        try {
            const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
            // Tạo access token mới
            const newAccessToken = jwt.sign(
                { id: decodedRefresh.id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '20m' }
            );
            // Gửi access token mới về frontend
            res.setHeader('x-new-access-token', newAccessToken);
            req.user = { id: decodedRefresh.id };
            return next();
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Refresh token hết hạn, vui lòng đăng nhập lại' });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Lỗi xác thực' });
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực',
            error: error.message
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't fail if missing
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = { authenticate, optionalAuth };
