const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    const allowMockTokens = process.env.ALLOW_MOCK_TOKENS === 'true' && process.env.NODE_ENV !== 'production';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        
        if (!token || typeof token !== 'string') {
            return res.status(401).json({ message: 'Not authorized, token invalid format' });
        }
        
        // Trim any whitespace
        token = token.trim();
        
        // Handle mock tokens (from frontend fallback when backend unreachable)
        if (allowMockTokens && token.startsWith('mock-token-')) {
            console.log(`✓ Mock token accepted (frontend fallback): ${token}`);
            const mockUserId = token.replace('mock-token-', '');
            const mockUsers = {
                'u1': { _id: 'u1', name: 'Col. Aryan Singh', email: 'admin@mil.local', role: 'Admin' },
                'u2': { _id: 'u2', name: 'Dr. Meera Sharma', email: 'analyst@mil.local', role: 'Analyst' },
                'u3': { _id: 'u3', name: 'Operator Kabir', email: 'monitor@mil.local', role: 'Monitor' },
            };
            req.user = mockUsers[mockUserId] || { _id: mockUserId, role: 'Monitor' };
            return next();
        }

        if (token.startsWith('mock-token-') && !allowMockTokens) {
            return res.status(401).json({ message: 'Not authorized, mock tokens are disabled' });
        }
        
        try {
            // Verify JWT token format (should have 3 parts: header.payload.signature)
            if (token.split('.').length !== 3) {
                console.error(`Token has ${token.split('.').length} parts, expected 3. Token: ${token.substring(0, 30)}...`);
                return res.status(401).json({ message: 'Not authorized, token malformed - invalid format' });
            }
            
            const secret = process.env.JWT_SECRET || 'supersecretkey';
            const decoded = jwt.verify(token, secret);
            
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            return next();
        } catch (error) {
            console.error('Token verification failed:', error.message, 'Token preview:', token.substring(0, 30));
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token malformed: ' + error.message });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed: ' + error.message });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token' });
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
