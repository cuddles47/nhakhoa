const bcrypt = require('bcryptjs');
const User = require('../models/User');

class UserController {
    // Get all users
    static async getAllUsers(req, res) {
        try {
            const { page, limit, role, sortBy, sortOrder } = req.query;
            
            const result = await User.findAll({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                role,
                sortBy: sortBy || 'created_at',
                sortOrder: sortOrder || 'DESC'
            });

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách người dùng',
                error: error.message
            });
        }
    }

    // Get user by ID
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);

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
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy thông tin người dùng',
                error: error.message
            });
        }
    }

    // Create new user
    static async createUser(req, res) {
        try {
            const { username, password, role, full_name, email } = req.body;

            // Validate required fields
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên đăng nhập và mật khẩu là bắt buộc'
                });
            }

            // Check if username already exists
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên đăng nhập đã tồn tại'
                });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            // Create user
            const newUser = await User.create({
                username,
                password_hash,
                role: role || 'user',
                full_name,
                email
            });

            res.status(201).json({
                success: true,
                message: 'Tạo người dùng thành công',
                data: { user: newUser }
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi tạo người dùng',
                error: error.message
            });
        }
    }

    // Update user
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { full_name, email, role, password } = req.body;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            // Update basic info
            const updatedUser = await User.update(id, {
                full_name,
                email,
                role: role || existingUser.role
            });

            // Update password if provided
            if (password) {
                const password_hash = await bcrypt.hash(password, 10);
                const db = require('../config/database');
                await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);
            }

            res.json({
                success: true,
                message: 'Cập nhật người dùng thành công',
                data: { user: updatedUser }
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi cập nhật người dùng',
                error: error.message
            });
        }
    }

    // Delete user
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            await User.delete(id);

            res.json({
                success: true,
                message: 'Xóa người dùng thành công'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xóa người dùng',
                error: error.message
            });
        }
    }

    // Delete all users
    static async deleteAllUsers(req, res) {
        try {
            const db = require('../config/database');
            await db.query('DELETE FROM users');

            res.json({
                success: true,
                message: 'Đã xóa tất cả người dùng'
            });
        } catch (error) {
            console.error('Delete all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xóa tất cả người dùng',
                error: error.message
            });
        }
    }
}

module.exports = UserController;
