const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { recordAuditEvent } = require('../services/auditService');
const {
    createAccessToken,
    issueSession,
    setRefreshCookie,
    clearRefreshCookie,
    verifyRefreshTokenRecord,
    rotateRefreshToken,
    generateMfaSetup,
    verifyTotp,
} = require('../services/securityService');

const allowedRoles = ['Admin', 'Analyst', 'Monitor'];

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const isStrongPassword = (value) => typeof value === 'string' && value.length >= 10;

const isValidRole = (value) => allowedRoles.includes(value);
const allowedApprovalStatuses = ['active', 'rejected'];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getSafeUserResponse = (user, token) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    token,
});

const createMfaToken = (user) => {
    const secret = process.env.JWT_SECRET || 'supersecretkey';
    return jwt.sign(
        { id: user._id.toString(), tokenType: 'mfa' },
        secret,
        { expiresIn: '5m' },
    );
};

const verifyMfaToken = (token) => {
    const secret = process.env.JWT_SECRET || 'supersecretkey';
    const decoded = jwt.verify(token, secret);
    if (decoded.tokenType !== 'mfa') {
        throw new Error('Invalid MFA token');
    }
    return decoded;
};

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'supersecretkey';
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign({ id: id.toString() }, secret, {
        expiresIn: '30d',
    });
    console.log(`✓ Token generated for user ${id}: ${token.substring(0, 20)}...`);
    return token;
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const role = req.body.role;

    if (!name || name.length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'A valid email address is required' });
    }

    if (!isStrongPassword(password)) {
        return res.status(400).json({ message: 'Password must be at least 10 characters long' });
    }

    if (role && !isValidRole(role)) {
        return res.status(400).json({ message: 'Invalid role value' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'Monitor',
        accountStatus: 'pending',
    });

    if (user) {
        await recordAuditEvent({
            actor: user,
            action: 'user.register',
            targetType: 'User',
            targetId: String(user._id),
            req,
            details: { role: user.role, accountStatus: user.accountStatus },
        });

        res.status(201).json({
            message: 'Registration submitted. Your account is pending Admin approval.',
            pendingApproval: true,
            accountStatus: user.accountStatus,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+mfaSecret +mfaTempSecret +mfaEnabled +mfaLastUsedAt');

    if (user && (await user.matchPassword(password))) {
        if (user.accountStatus === 'pending') {
            return res.status(403).json({ message: 'Your account is pending Admin approval.' });
        }

        if (user.accountStatus === 'rejected') {
            return res.status(403).json({ message: 'Your registration request was rejected. Please contact Admin.' });
        }

        if (user.mfaEnabled) {
            const mfaToken = createMfaToken(user);
            await recordAuditEvent({
                actor: user,
                action: 'user.login.mfa_challenge',
                targetType: 'Session',
                targetId: String(user._id),
                req,
                details: { reason: 'mfa-required' },
            });

            return res.json({
                mfaRequired: true,
                mfaToken,
                message: 'Multi-factor authentication required',
            });
        }

        const session = await issueSession(user, req);
        setRefreshCookie(res, session.refreshToken);
        await recordAuditEvent({
            actor: user,
            action: 'user.login',
            targetType: 'Session',
            targetId: String(user._id),
            req,
            details: { mfa: false },
        });

        res.json({
            ...getSafeUserResponse(user, session.token),
            mfaRequired: false,
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Admin create user
// @route   POST /api/users/admin
// @access  Private/Admin
const createUserByAdmin = async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const role = req.body.role;

    if (!name || name.length < 2 || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'A valid email address is required' });
    }

    if (!isStrongPassword(password)) {
        return res.status(400).json({ message: 'Password must be at least 10 characters long' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        name,
        email,
        password,
        role: isValidRole(role) ? role : 'Monitor',
        accountStatus: 'active',
        approvedAt: new Date(),
        approvedBy: req.user?._id || null,
    });

    await recordAuditEvent({
        actor: req.user,
        action: 'admin.user.create',
        targetType: 'User',
        targetId: String(user._id),
        req,
        details: { role: user.role, email: user.email },
    });

    return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ accountStatus: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 });
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch pending users', error: error.message });
    }
};

const updateUserApproval = async (req, res) => {
    try {
        const { status } = req.body;

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        if (!allowedApprovalStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid approval status' });
        }

        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToUpdate.role === 'Admin' && status !== 'active') {
            return res.status(400).json({ message: 'Admin account cannot be rejected via approval flow' });
        }

        userToUpdate.accountStatus = status;
        userToUpdate.approvedAt = status === 'active' ? new Date() : null;
        userToUpdate.approvedBy = status === 'active' ? req.user?._id || null : null;
        await userToUpdate.save();

        await recordAuditEvent({
            actor: req.user,
            action: 'admin.user.approval_update',
            targetType: 'User',
            targetId: String(userToUpdate._id),
            req,
            details: { status },
        });

        return res.json({
            _id: userToUpdate._id,
            name: userToUpdate.name,
            email: userToUpdate.email,
            role: userToUpdate.role,
            accountStatus: userToUpdate.accountStatus,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update user approval', error: error.message });
    }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        if (!isValidRole(role)) {
            return res.status(400).json({ message: 'Invalid role value' });
        }

        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (String(req.user?._id) === String(userToUpdate._id) && role !== 'Admin') {
            return res.status(400).json({ message: 'You cannot downgrade your own role from Admin' });
        }

        const adminCount = await User.countDocuments({ role: 'Admin' });
        if (userToUpdate.role === 'Admin' && role !== 'Admin' && adminCount <= 1) {
            return res.status(400).json({ message: 'At least one Admin account must remain active' });
        }

        userToUpdate.role = role;
        await userToUpdate.save();

        await recordAuditEvent({
            actor: req.user,
            action: 'admin.user.role_update',
            targetType: 'User',
            targetId: String(userToUpdate._id),
            req,
            details: { role },
        });

        return res.json({
            _id: userToUpdate._id,
            name: userToUpdate.name,
            email: userToUpdate.email,
            role: userToUpdate.role,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update user role', error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        if (String(req.user?._id) === String(req.params.id)) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToDelete.role === 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'At least one Admin account must remain active' });
            }
        }

        await User.findByIdAndDelete(req.params.id);

        await recordAuditEvent({
            actor: req.user,
            action: 'admin.user.delete',
            targetType: 'User',
            targetId: String(req.params.id),
            req,
            details: { deletedRole: userToDelete.role },
        });
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
};

const loginMfa = async (req, res) => {
    try {
        const { mfaToken, code } = req.body;
        if (!mfaToken || !code) {
            return res.status(400).json({ message: 'MFA token and code are required' });
        }

        const decoded = verifyMfaToken(mfaToken);
        const user = await User.findById(decoded.id).select('+mfaSecret +mfaEnabled +mfaLastUsedAt');
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            return res.status(401).json({ message: 'MFA session is invalid' });
        }

        const verified = verifyTotp(user.mfaSecret, code);
        if (!verified) {
            await recordAuditEvent({
                actor: user,
                action: 'user.login.mfa_verify',
                targetType: 'Session',
                targetId: String(user._id),
                req,
                status: 'failure',
                details: { reason: 'invalid-code' },
            });
            return res.status(401).json({ message: 'Invalid MFA code' });
        }

        user.mfaLastUsedAt = new Date();
        await user.save();

        const session = await issueSession(user, req);
        setRefreshCookie(res, session.refreshToken);

        await recordAuditEvent({
            actor: user,
            action: 'user.login',
            targetType: 'Session',
            targetId: String(user._id),
            req,
            details: { mfa: true },
        });

        return res.json({
            ...getSafeUserResponse(user, session.token),
            mfaRequired: false,
        });
    } catch (error) {
        return res.status(401).json({ message: error.message || 'MFA verification failed' });
    }
};

const refreshSession = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token missing' });
        }

        const { user, token, refreshToken: nextRefreshToken } = await rotateRefreshToken(refreshToken, req);
        setRefreshCookie(res, nextRefreshToken);

        await recordAuditEvent({
            actor: user,
            action: 'session.refresh',
            targetType: 'Session',
            targetId: String(user._id),
            req,
            details: { rotated: true },
        });

        return res.json({
            ...getSafeUserResponse(user, token),
        });
    } catch (error) {
        return res.status(401).json({ message: 'Session refresh failed' });
    }
};

const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (refreshToken) {
            try {
                const { record, decoded } = await verifyRefreshTokenRecord(refreshToken);
                record.revokedAt = new Date();
                await record.save();

                const user = await User.findById(decoded.id).select('name role');
                await recordAuditEvent({
                    actor: user,
                    action: 'session.logout',
                    targetType: 'Session',
                    targetId: String(decoded.id),
                    req,
                    details: { revoked: true },
                });
            } catch {
                // Ignore invalid refresh token on logout and still clear the cookie.
            }
        }

        clearRefreshCookie(res);
        return res.json({ message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};

const setupMfa = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+mfaSecret +mfaTempSecret +mfaEnabled');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const setup = await generateMfaSetup(user);
        user.mfaTempSecret = setup.secretBase32;
        await user.save();

        await recordAuditEvent({
            actor: req.user,
            action: 'user.mfa.setup',
            targetType: 'User',
            targetId: String(user._id),
            req,
            details: { enabled: user.mfaEnabled },
        });

        return res.json(setup);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to initialize MFA setup', error: error.message });
    }
};

const enableMfa = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'MFA code is required' });
        }

        const user = await User.findById(req.user._id).select('+mfaSecret +mfaTempSecret +mfaEnabled');
        if (!user || !user.mfaTempSecret) {
            return res.status(400).json({ message: 'MFA setup not initialized' });
        }

        const verified = verifyTotp(user.mfaTempSecret, code);
        if (!verified) {
            return res.status(401).json({ message: 'Invalid MFA code' });
        }

        user.mfaSecret = user.mfaTempSecret;
        user.mfaTempSecret = '';
        user.mfaEnabled = true;
        user.mfaLastUsedAt = new Date();
        await user.save();

        await recordAuditEvent({
            actor: req.user,
            action: 'user.mfa.enable',
            targetType: 'User',
            targetId: String(user._id),
            req,
            details: { enabled: true },
        });

        return res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to enable MFA', error: error.message });
    }
};

const disableMfa = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id).select('+mfaSecret +mfaTempSecret +mfaEnabled');
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            return res.status(400).json({ message: 'MFA is not enabled' });
        }

        if (!code || !verifyTotp(user.mfaSecret, code)) {
            return res.status(401).json({ message: 'Invalid MFA code' });
        }

        user.mfaEnabled = false;
        user.mfaSecret = '';
        user.mfaTempSecret = '';
        await user.save();

        await recordAuditEvent({
            actor: req.user,
            action: 'user.mfa.disable',
            targetType: 'User',
            targetId: String(user._id),
            req,
            details: { enabled: false },
        });

        return res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to disable MFA', error: error.message });
    }
};

module.exports = {
    registerUser,
    authUser,
    loginMfa,
    refreshSession,
    logoutUser,
    setupMfa,
    enableMfa,
    disableMfa,
    createUserByAdmin,
    getAllUsers,
    getPendingUsers,
    updateUserApproval,
    updateUserRole,
    deleteUser,
};
