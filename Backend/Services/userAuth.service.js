const entity = require("../EAV models/user_entity");
const attribute = require("../EAV models/user_attribute");
const value = require("../EAV models/user_value");
const staffEntity = require("../EAV models/staff_entity");
const staffAttribute = require("../EAV models/staff_attribute");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const crypto = require("crypto");

// Roles that require admin provisioning (cannot self-register)
const ADMIN_PROVISIONED_ROLES = ['doctor', 'ta', 'advisor', 'professor', 'staff'];
const ALLOWED_SELF_REGISTER_ROLES = ['student'];

let attributesInitialized = false;
const initializeAttributes = async () => {
    if (attributesInitialized) return;

    try {
        const attrsToCreate = [
            { name: "email", type: "string" },
            { name: "password", type: "string" },
            { name: "username", type: "string" },
            { name: "createdByAdmin", type: "string" },      // "true" or "false"
            { name: "createdBy", type: "int" },              // Admin user ID who created this account
            { name: "mustChangePassword", type: "string" },  // "true" or "false"
            { name: "accountStatus", type: "string" },       // "active", "inactive", "pending"
            { name: "lastPasswordChange", type: "string" },  // ISO date string
        ];

        for (const attr of attrsToCreate) {
            const existing = await attribute.getAttributeByName(attr.name);
            if (!existing) {
                await attribute.create(attr.name, attr.type);
                console.log(`Created ${attr.name} attribute`);
            }
        }

        attributesInitialized = true;
        console.log("Auth attributes initialized");
    } catch (error) {
        console.error("Error initializing attributes:", error.message);
    }
};

/**
 * Generate a secure temporary password
 */
const generateTemporaryPassword = () => {
    // Generate 12 character password with letters, numbers, and special chars
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(crypto.randomInt(chars.length));
    }
    return password;
};

/**
 * Helper to get attribute value
 */
const getAttrValue = async (entityId, attrName) => {
    const attr = await attribute.getAttributeByName(attrName);
    if (!attr) return null;
    const val = await value.getValue(entityId, attr.attribute_id);
    return val?.value_string || val?.value_number || null;
};

/**
 * Helper to set attribute value
 */
const setAttrValue = async (entityId, attrName, val, isNumber = false) => {
    const attr = await attribute.getAttributeByName(attrName);
    if (!attr) return;

    const existing = await value.getValue(entityId, attr.attribute_id);
    if (existing) {
        await value.updateValue(existing.value_id, isNumber ? { value_number: val } : { value_string: val });
    } else {
        await value.createValue(entityId, attr.attribute_id, isNumber ? { value_number: val } : { value_string: val });
    }
};

const userAuthService = {
    /**
     * Register a new user (PUBLIC - only for students)
     */
    registerUser: async (userData) => {
        try {
            await initializeAttributes();
            const { email, password, confirmPassword, username, userType } = userData;

            // ========== SECURITY: Block staff registration ==========
            const normalizedRole = (userType || '').toLowerCase();
            if (ADMIN_PROVISIONED_ROLES.includes(normalizedRole)) {
                throw new Error("Staff accounts (Doctor/TA/Advisor) must be created by administration. Please contact your admin.");
            }

            if (!ALLOWED_SELF_REGISTER_ROLES.includes(normalizedRole)) {
                throw new Error("Invalid user type. Only student registration is allowed.");
            }
            // =========================================================

            // Validate
            if (!email || !password || !confirmPassword || !username) {
                throw new Error("All fields required");
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords don't match");
            }

            // Check if email exists
            const existing = await entity.findByAttribute("email", email);
            if (existing) {
                throw new Error("Email already exists");
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create entity
            const userId = await entity.create(userType, username);

            // Get attribute IDs
            const emailAttr = await attribute.getAttributeByName("email");
            const passwordAttr = await attribute.getAttributeByName("password");
            const usernameAttr = await attribute.getAttributeByName("username");

            // Store values
            await value.createValue(userId, emailAttr.attribute_id, { value_string: email });
            await value.createValue(userId, passwordAttr.attribute_id, { value_string: hashedPassword });
            await value.createValue(userId, usernameAttr.attribute_id, { value_string: username });

            // Set default attributes for self-registered users
            await setAttrValue(userId, 'createdByAdmin', 'false');
            await setAttrValue(userId, 'mustChangePassword', 'false');
            await setAttrValue(userId, 'accountStatus', 'active');

            return { success: true, userId, message: "Registered successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Login user with security checks
     */
    loginUser: async (credentials) => {
        try {
            await initializeAttributes();
            const { email, password } = credentials;

            if (!email || !password) {
                throw new Error("Email and password required");
            }

            // Find user
            const user = await entity.findByAttribute("email", email);
            if (!user) {
                throw new Error("Invalid email or password");
            }

            const userRole = (user.entity_type || '').toLowerCase();

            // ========== SECURITY: Check staff account restrictions ==========
            if (ADMIN_PROVISIONED_ROLES.includes(userRole)) {
                // Check if account was created by admin
                const createdByAdmin = await getAttrValue(user.entity_id, 'createdByAdmin');
                if (createdByAdmin !== 'true') {
                    throw new Error("Your staff account must be created by the administration. Please contact your admin.");
                }

                // Check account status
                const accountStatus = await getAttrValue(user.entity_id, 'accountStatus');
                if (accountStatus === 'inactive') {
                    throw new Error("Your account has been deactivated. Please contact your administrator.");
                }
                if (accountStatus === 'pending') {
                    throw new Error("Your account is pending approval. Please wait for administrator activation.");
                }
            }
            // =================================================================

            // Get password
            const passwordAttr = await attribute.getAttributeByName("password");
            const storedPassword = await value.getValue(user.entity_id, passwordAttr.attribute_id);

            // Compare
            const isMatch = await bcrypt.compare(password, storedPassword.value_string);
            if (!isMatch) {
                throw new Error("Invalid email or password");
            }

            const usernameAttr = await attribute.getAttributeByName("username");
            const usernameObj = await value.getValue(user.entity_id, usernameAttr.attribute_id);

            // Check if must change password
            const mustChangePassword = await getAttrValue(user.entity_id, 'mustChangePassword');

            // Create token
            const token = JWT.sign(
                { id: user.entity_id, email, role: user.entity_type },
                process.env.JWT_SECRET || "secret",
                { expiresIn: "7d" }
            );

            return {
                success: true,
                token,
                user: {
                    id: user.entity_id,
                    email: email,
                    username: usernameObj?.value_string,
                    userType: user.entity_type,
                    mustChangePassword: mustChangePassword === 'true'
                }
            };
        } catch (error) {
            return { success: false, message: error.message, user: null };
        }
    },

    /**
     * Create staff account (ADMIN ONLY)
     * Returns temporary password for admin to share with staff
     */
    createStaffAccount: async (staffData, adminId) => {
        try {
            await initializeAttributes();
            const { email, username, userType } = staffData;

            if (!email || !username) {
                throw new Error("Email and username are required");
            }

            const normalizedRole = (userType || 'doctor').toLowerCase();
            if (!ADMIN_PROVISIONED_ROLES.includes(normalizedRole) && normalizedRole !== 'admin') {
                throw new Error("Invalid staff role");
            }

            // Check if email exists
            const existing = await entity.findByAttribute("email", email);
            if (existing) {
                throw new Error("Email already exists");
            }

            // Generate temporary password
            const tempPassword = generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            // Create entity in entities table
            const userId = await entity.create(normalizedRole, username);

            // Get attribute IDs
            const emailAttr = await attribute.getAttributeByName("email");
            const passwordAttr = await attribute.getAttributeByName("password");
            const usernameAttr = await attribute.getAttributeByName("username");

            // Store values
            await value.createValue(userId, emailAttr.attribute_id, { value_string: email });
            await value.createValue(userId, passwordAttr.attribute_id, { value_string: hashedPassword });
            await value.createValue(userId, usernameAttr.attribute_id, { value_string: username });

            // Set admin-provisioned attributes
            await setAttrValue(userId, 'createdByAdmin', 'true');
            await setAttrValue(userId, 'createdBy', adminId, true);
            await setAttrValue(userId, 'mustChangePassword', 'true');
            await setAttrValue(userId, 'accountStatus', 'active');

            // For staff roles (doctor, ta, advisor), also create a staff_entity
            let staffId = null;
            if (ADMIN_PROVISIONED_ROLES.includes(normalizedRole)) {
                try {
                    // Create staff entity with email as the entity_name for easy lookup
                    const staffName = `staff-${email}`;
                    staffId = await staffEntity.create(normalizedRole, staffName);
                    
                    // Link staff_id back to the user entity via an attribute
                    await setAttrValue(userId, 'staffEntityId', staffId.toString(), true);
                    
                    console.log(`[AUDIT] Staff entity created: ${staffName} (${normalizedRole}) linked to user ${userId}`);
                } catch (staffError) {
                    console.error(`[WARN] Failed to create staff_entity for ${email}:`, staffError.message);
                    // Continue anyway - the system will still work but doctors might not be able to teach courses
                }
            }

            console.log(`[AUDIT] Staff account created: ${email} (${normalizedRole}) by admin ${adminId}`);

            return {
                success: true,
                userId,
                staffId,
                temporaryPassword: tempPassword,
                message: "Staff account created successfully. Share the temporary password with the staff member."
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Change password (for first login or regular change)
     */
    changePassword: async (userId, currentPassword, newPassword) => {
        try {
            await initializeAttributes();

            // Get current password
            const passwordAttr = await attribute.getAttributeByName("password");
            const storedPassword = await value.getValue(userId, passwordAttr.attribute_id);

            if (!storedPassword) {
                throw new Error("User not found");
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, storedPassword.value_string);
            if (!isMatch) {
                throw new Error("Current password is incorrect");
            }

            // Hash and update new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await value.updateValue(storedPassword.value_id, { value_string: hashedPassword });

            // Update password change tracking
            await setAttrValue(userId, 'mustChangePassword', 'false');
            await setAttrValue(userId, 'lastPasswordChange', new Date().toISOString());

            console.log(`[AUDIT] Password changed for user ${userId}`);

            return { success: true, message: "Password changed successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Admin reset password for staff
     */
    adminResetPassword: async (staffUserId, adminId) => {
        try {
            await initializeAttributes();

            // Generate new temporary password
            const tempPassword = generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            // Update password
            const passwordAttr = await attribute.getAttributeByName("password");
            const storedPassword = await value.getValue(staffUserId, passwordAttr.attribute_id);

            if (!storedPassword) {
                throw new Error("User not found");
            }

            await value.updateValue(storedPassword.value_id, { value_string: hashedPassword });
            await setAttrValue(staffUserId, 'mustChangePassword', 'true');

            console.log(`[AUDIT] Password reset for user ${staffUserId} by admin ${adminId}`);

            return {
                success: true,
                temporaryPassword: tempPassword,
                message: "Password reset successfully. Share the new temporary password with the staff member."
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Update staff account status
     */
    updateAccountStatus: async (userId, status, adminId) => {
        try {
            await initializeAttributes();

            if (!['active', 'inactive', 'pending'].includes(status)) {
                throw new Error("Invalid status");
            }

            await setAttrValue(userId, 'accountStatus', status);

            console.log(`[AUDIT] Account status changed to ${status} for user ${userId} by admin ${adminId}`);

            return { success: true, message: `Account ${status === 'active' ? 'activated' : 'deactivated'} successfully` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Check if user exists by email
    checkUserExists: async (email) => {
        try {
            await initializeAttributes();
            const user = await entity.findByAttribute("email", email);
            return !!user;
        } catch (error) {
            throw new Error("Error checking user existence: " + error.message);
        }
    },

    // Get user by ID (for internal use)
    getUserById: async (userId) => {
        try {
            await initializeAttributes();
            const user = await entity.findById(userId);
            if (!user) return null;

            const emailVal = await getAttrValue(userId, 'email');
            const usernameVal = await getAttrValue(userId, 'username');
            const mustChange = await getAttrValue(userId, 'mustChangePassword');
            const status = await getAttrValue(userId, 'accountStatus');

            return {
                id: user.entity_id,
                email: emailVal,
                username: usernameVal,
                userType: user.entity_type,
                mustChangePassword: mustChange === 'true',
                accountStatus: status || 'active'
            };
        } catch (error) {
            return null;
        }
    }
};

module.exports = userAuthService;