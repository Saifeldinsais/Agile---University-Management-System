const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'fail', message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_change_in_production');
        req.user = decoded; // { id, email, role }
        next();
    } catch (error) {
        return res.status(403).json({ status: 'fail', message: 'Invalid or expired token.' });
    }
};

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} allowedRoles - Role or array of roles that are allowed
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
            });
        }

        next();
    };
};

/**
 * Combined middleware: verify token + check admin role
 */
const adminOnly = [verifyToken, requireRole('admin')];

/**
 * Combined middleware: verify token + check admin or advisor role
 */
const adminOrAdvisor = [verifyToken, requireRole(['admin', 'advisor'])];

// Alias for verifyToken
const authenticateToken = verifyToken;

// Convenience middleware for admin-only routes
const requireAdmin = requireRole('admin');

module.exports = {
    verifyToken,
    authenticateToken,
    requireRole,
    requireAdmin,
    adminOnly,
    adminOrAdvisor
};
