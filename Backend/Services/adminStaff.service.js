const pool = require('../Db_config/DB');
const StaffAttribute = require('../EAV models/staff_attribute');

let attrsInitialized = false;

/**
 * Initialize staff attributes (ensure they exist)
 */
const initStaffAttrs = async () => {
    if (attrsInitialized) return;

    const attrs = [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'role', type: 'string' },         // 'doctor', 'ta', 'advisor'
        { name: 'roles', type: 'string' },        // JSON array for multiple roles: ["doctor", "advisor"]
        { name: 'department', type: 'string' },
        { name: 'officeLocation', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'status', type: 'string' },       // 'active', 'inactive'
        { name: 'hireDate', type: 'string' },
        { name: 'specialization', type: 'string' },
        { name: 'bio', type: 'string' },
    ];

    for (const attr of attrs) {
        // Use createIfNotExists to avoid duplicate entry errors
        await StaffAttribute.createIfNotExists(attr.name, attr.type);
    }

    attrsInitialized = true;
};

/**
 * Get attribute ID by name
 */
const getAttrId = async (name) => {
    const attr = await StaffAttribute.getAttributeByName(name);
    return attr ? attr.attribute_id : null;
};

/**
 * Upsert a staff attribute value
 */
const upsertValue = async (entityId, attrId, value, isNumber = false) => {
    const [[existing]] = await pool.query(
        'SELECT value_id FROM staff_entity_attribute WHERE entity_id = ? AND attribute_id = ?',
        [entityId, attrId]
    );

    if (existing) {
        if (isNumber) {
            await pool.query(
                'UPDATE staff_entity_attribute SET value_number = ? WHERE value_id = ?',
                [value, existing.value_id]
            );
        } else {
            await pool.query(
                'UPDATE staff_entity_attribute SET value_string = ? WHERE value_id = ?',
                [value, existing.value_id]
            );
        }
    } else {
        if (isNumber) {
            await pool.query(
                'INSERT INTO staff_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)',
                [entityId, attrId, value]
            );
        } else {
            await pool.query(
                'INSERT INTO staff_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                [entityId, attrId, value]
            );
        }
    }
};

const AdminStaffService = {
    /**
     * Get all staff members with optional filters
     * @param {Object} filters - { role, department, status, search }
     */
    getStaff: async (filters = {}) => {
        try {
            await initStaffAttrs();

            const nameAttrId = await getAttrId('name');
            const emailAttrId = await getAttrId('email');
            const roleAttrId = await getAttrId('role');
            const rolesAttrId = await getAttrId('roles');
            const deptAttrId = await getAttrId('department');
            const officeAttrId = await getAttrId('officeLocation');
            const phoneAttrId = await getAttrId('phone');
            const statusAttrId = await getAttrId('status');
            const hireDateAttrId = await getAttrId('hireDate');
            const specAttrId = await getAttrId('specialization');

            const [staffMembers] = await pool.query(`
                SELECT 
                    se.entity_id AS id,
                    se.entity_name,
                    se.created_at,
                    vName.value_string AS name,
                    vEmail.value_string AS email,
                    vRole.value_string AS role,
                    vRoles.value_string AS roles,
                    vDept.value_string AS department,
                    vOffice.value_string AS officeLocation,
                    vPhone.value_string AS phone,
                    vStatus.value_string AS status,
                    vHireDate.value_string AS hireDate,
                    vSpec.value_string AS specialization
                FROM staff_entity se
                LEFT JOIN staff_entity_attribute vName ON vName.entity_id = se.entity_id AND vName.attribute_id = ?
                LEFT JOIN staff_entity_attribute vEmail ON vEmail.entity_id = se.entity_id AND vEmail.attribute_id = ?
                LEFT JOIN staff_entity_attribute vRole ON vRole.entity_id = se.entity_id AND vRole.attribute_id = ?
                LEFT JOIN staff_entity_attribute vRoles ON vRoles.entity_id = se.entity_id AND vRoles.attribute_id = ?
                LEFT JOIN staff_entity_attribute vDept ON vDept.entity_id = se.entity_id AND vDept.attribute_id = ?
                LEFT JOIN staff_entity_attribute vOffice ON vOffice.entity_id = se.entity_id AND vOffice.attribute_id = ?
                LEFT JOIN staff_entity_attribute vPhone ON vPhone.entity_id = se.entity_id AND vPhone.attribute_id = ?
                LEFT JOIN staff_entity_attribute vStatus ON vStatus.entity_id = se.entity_id AND vStatus.attribute_id = ?
                LEFT JOIN staff_entity_attribute vHireDate ON vHireDate.entity_id = se.entity_id AND vHireDate.attribute_id = ?
                LEFT JOIN staff_entity_attribute vSpec ON vSpec.entity_id = se.entity_id AND vSpec.attribute_id = ?
                ORDER BY se.created_at DESC
            `, [nameAttrId, emailAttrId, roleAttrId, rolesAttrId, deptAttrId, officeAttrId, phoneAttrId, statusAttrId, hireDateAttrId, specAttrId]);

            // Parse roles JSON and build enriched list
            let result = staffMembers.map(s => {
                let parsedRoles = [];
                try {
                    parsedRoles = s.roles ? JSON.parse(s.roles) : (s.role ? [s.role] : []);
                } catch {
                    parsedRoles = s.role ? [s.role] : [];
                }

                return {
                    id: s.id,
                    name: s.name || s.entity_name || 'Unknown',
                    email: s.email || '',
                    role: s.role || 'staff',
                    roles: parsedRoles,
                    department: s.department || '',
                    officeLocation: s.officeLocation || '',
                    phone: s.phone || '',
                    status: s.status || 'active',
                    hireDate: s.hireDate || null,
                    specialization: s.specialization || '',
                    createdAt: s.created_at
                };
            });

            // Apply filters
            if (filters.role) {
                result = result.filter(s =>
                    s.role?.toLowerCase() === filters.role.toLowerCase() ||
                    s.roles.some(r => r.toLowerCase() === filters.role.toLowerCase())
                );
            }

            if (filters.department) {
                result = result.filter(s =>
                    s.department?.toLowerCase().includes(filters.department.toLowerCase())
                );
            }

            if (filters.status && filters.status !== 'all') {
                result = result.filter(s =>
                    s.status?.toLowerCase() === filters.status.toLowerCase()
                );
            }

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(s =>
                    s.name?.toLowerCase().includes(searchLower) ||
                    s.email?.toLowerCase().includes(searchLower) ||
                    s.specialization?.toLowerCase().includes(searchLower)
                );
            }

            return { success: true, data: result };
        } catch (error) {
            console.error('Error fetching staff:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Get a single staff member by ID
     */
    getStaffById: async (staffId) => {
        try {
            await initStaffAttrs();

            const nameAttrId = await getAttrId('name');
            const emailAttrId = await getAttrId('email');
            const roleAttrId = await getAttrId('role');
            const rolesAttrId = await getAttrId('roles');
            const deptAttrId = await getAttrId('department');
            const officeAttrId = await getAttrId('officeLocation');
            const phoneAttrId = await getAttrId('phone');
            const statusAttrId = await getAttrId('status');
            const hireDateAttrId = await getAttrId('hireDate');
            const specAttrId = await getAttrId('specialization');
            const bioAttrId = await getAttrId('bio');

            const [rows] = await pool.query(`
                SELECT 
                    se.entity_id AS id,
                    se.entity_name,
                    se.created_at,
                    vName.value_string AS name,
                    vEmail.value_string AS email,
                    vRole.value_string AS role,
                    vRoles.value_string AS roles,
                    vDept.value_string AS department,
                    vOffice.value_string AS officeLocation,
                    vPhone.value_string AS phone,
                    vStatus.value_string AS status,
                    vHireDate.value_string AS hireDate,
                    vSpec.value_string AS specialization,
                    vBio.value_string AS bio
                FROM staff_entity se
                LEFT JOIN staff_entity_attribute vName ON vName.entity_id = se.entity_id AND vName.attribute_id = ?
                LEFT JOIN staff_entity_attribute vEmail ON vEmail.entity_id = se.entity_id AND vEmail.attribute_id = ?
                LEFT JOIN staff_entity_attribute vRole ON vRole.entity_id = se.entity_id AND vRole.attribute_id = ?
                LEFT JOIN staff_entity_attribute vRoles ON vRoles.entity_id = se.entity_id AND vRoles.attribute_id = ?
                LEFT JOIN staff_entity_attribute vDept ON vDept.entity_id = se.entity_id AND vDept.attribute_id = ?
                LEFT JOIN staff_entity_attribute vOffice ON vOffice.entity_id = se.entity_id AND vOffice.attribute_id = ?
                LEFT JOIN staff_entity_attribute vPhone ON vPhone.entity_id = se.entity_id AND vPhone.attribute_id = ?
                LEFT JOIN staff_entity_attribute vStatus ON vStatus.entity_id = se.entity_id AND vStatus.attribute_id = ?
                LEFT JOIN staff_entity_attribute vHireDate ON vHireDate.entity_id = se.entity_id AND vHireDate.attribute_id = ?
                LEFT JOIN staff_entity_attribute vSpec ON vSpec.entity_id = se.entity_id AND vSpec.attribute_id = ?
                LEFT JOIN staff_entity_attribute vBio ON vBio.entity_id = se.entity_id AND vBio.attribute_id = ?
                WHERE se.entity_id = ?
            `, [nameAttrId, emailAttrId, roleAttrId, rolesAttrId, deptAttrId, officeAttrId, phoneAttrId, statusAttrId, hireDateAttrId, specAttrId, bioAttrId, staffId]);

            if (!rows.length) {
                return { success: false, message: 'Staff member not found' };
            }

            const s = rows[0];
            let parsedRoles = [];
            try {
                parsedRoles = s.roles ? JSON.parse(s.roles) : (s.role ? [s.role] : []);
            } catch {
                parsedRoles = s.role ? [s.role] : [];
            }

            return {
                success: true,
                data: {
                    id: s.id,
                    name: s.name || s.entity_name || 'Unknown',
                    email: s.email || '',
                    role: s.role || 'staff',
                    roles: parsedRoles,
                    department: s.department || '',
                    officeLocation: s.officeLocation || '',
                    phone: s.phone || '',
                    status: s.status || 'active',
                    hireDate: s.hireDate || null,
                    specialization: s.specialization || '',
                    bio: s.bio || '',
                    createdAt: s.created_at
                }
            };
        } catch (error) {
            console.error('Error fetching staff member:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Create a new staff member
     */
    createStaff: async (staffData) => {
        try {
            await initStaffAttrs();

            const { name, email, role, roles, department, officeLocation, phone, status, hireDate, specialization, bio } = staffData;

            if (!name || !email) {
                return { success: false, message: 'Name and email are required' };
            }

            // Check if email already exists
            const emailAttrId = await getAttrId('email');
            const [[existingEmail]] = await pool.query(
                'SELECT entity_id FROM staff_entity_attribute WHERE attribute_id = ? AND value_string = ?',
                [emailAttrId, email]
            );

            if (existingEmail) {
                return { success: false, message: 'A staff member with this email already exists' };
            }

            // Create staff entity
            const entityName = `staff-${email}`;
            const entityType = role || (roles && roles[0]) || 'doctor';
            const [result] = await pool.query(
                'INSERT INTO staff_entity (entity_type, entity_name) VALUES (?, ?)',
                [entityType, entityName]
            );
            const staffId = result.insertId;

            // Save attributes
            const nameAttrId = await getAttrId('name');
            const roleAttrId = await getAttrId('role');
            const rolesAttrId = await getAttrId('roles');
            const deptAttrId = await getAttrId('department');
            const officeAttrId = await getAttrId('officeLocation');
            const phoneAttrId = await getAttrId('phone');
            const statusAttrId = await getAttrId('status');
            const hireDateAttrId = await getAttrId('hireDate');
            const specAttrId = await getAttrId('specialization');
            const bioAttrId = await getAttrId('bio');

            await upsertValue(staffId, nameAttrId, name);
            await upsertValue(staffId, emailAttrId, email);
            await upsertValue(staffId, roleAttrId, role || 'doctor');

            // Store roles as JSON array
            const rolesArray = roles || [role || 'doctor'];
            await upsertValue(staffId, rolesAttrId, JSON.stringify(rolesArray));

            if (department) await upsertValue(staffId, deptAttrId, department);
            if (officeLocation) await upsertValue(staffId, officeAttrId, officeLocation);
            if (phone) await upsertValue(staffId, phoneAttrId, phone);
            await upsertValue(staffId, statusAttrId, status || 'active');
            if (hireDate) await upsertValue(staffId, hireDateAttrId, hireDate);
            if (specialization) await upsertValue(staffId, specAttrId, specialization);
            if (bio) await upsertValue(staffId, bioAttrId, bio);

            return {
                success: true,
                message: 'Staff member created successfully',
                data: { id: staffId }
            };
        } catch (error) {
            console.error('Error creating staff:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Update a staff member
     */
    updateStaff: async (staffId, staffData) => {
        try {
            await initStaffAttrs();

            // Check if staff exists
            const [[existing]] = await pool.query(
                'SELECT entity_id FROM staff_entity WHERE entity_id = ?',
                [staffId]
            );

            if (!existing) {
                return { success: false, message: 'Staff member not found' };
            }

            const { name, email, role, roles, department, officeLocation, phone, status, hireDate, specialization, bio } = staffData;

            // Get attribute IDs
            const nameAttrId = await getAttrId('name');
            const emailAttrId = await getAttrId('email');
            const roleAttrId = await getAttrId('role');
            const rolesAttrId = await getAttrId('roles');
            const deptAttrId = await getAttrId('department');
            const officeAttrId = await getAttrId('officeLocation');
            const phoneAttrId = await getAttrId('phone');
            const statusAttrId = await getAttrId('status');
            const hireDateAttrId = await getAttrId('hireDate');
            const specAttrId = await getAttrId('specialization');
            const bioAttrId = await getAttrId('bio');

            // Update attributes
            if (name !== undefined) await upsertValue(staffId, nameAttrId, name);
            if (email !== undefined) await upsertValue(staffId, emailAttrId, email);
            if (role !== undefined) await upsertValue(staffId, roleAttrId, role);
            if (roles !== undefined) await upsertValue(staffId, rolesAttrId, JSON.stringify(roles));
            if (department !== undefined) await upsertValue(staffId, deptAttrId, department);
            if (officeLocation !== undefined) await upsertValue(staffId, officeAttrId, officeLocation);
            if (phone !== undefined) await upsertValue(staffId, phoneAttrId, phone);
            if (status !== undefined) await upsertValue(staffId, statusAttrId, status);
            if (hireDate !== undefined) await upsertValue(staffId, hireDateAttrId, hireDate);
            if (specialization !== undefined) await upsertValue(staffId, specAttrId, specialization);
            if (bio !== undefined) await upsertValue(staffId, bioAttrId, bio);

            return { success: true, message: 'Staff member updated successfully' };
        } catch (error) {
            console.error('Error updating staff:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Toggle staff status (activate/deactivate)
     */
    toggleStaffStatus: async (staffId) => {
        try {
            await initStaffAttrs();

            const statusAttrId = await getAttrId('status');

            // Get current status
            const [[currentStatus]] = await pool.query(
                'SELECT value_string FROM staff_entity_attribute WHERE entity_id = ? AND attribute_id = ?',
                [staffId, statusAttrId]
            );

            const newStatus = currentStatus?.value_string === 'active' ? 'inactive' : 'active';
            await upsertValue(staffId, statusAttrId, newStatus);

            return {
                success: true,
                message: `Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: { status: newStatus }
            };
        } catch (error) {
            console.error('Error toggling staff status:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Delete a staff member
     */
    deleteStaff: async (staffId) => {
        try {
            // Delete attributes first
            await pool.query('DELETE FROM staff_entity_attribute WHERE entity_id = ?', [staffId]);
            // Delete entity
            await pool.query('DELETE FROM staff_entity WHERE entity_id = ?', [staffId]);

            return { success: true, message: 'Staff member deleted successfully' };
        } catch (error) {
            console.error('Error deleting staff:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Get all unique departments (for filter dropdown)
     */
    getDepartments: async () => {
        try {
            await initStaffAttrs();
            const deptAttrId = await getAttrId('department');

            const [rows] = await pool.query(`
                SELECT DISTINCT value_string AS department
                FROM staff_entity_attribute
                WHERE attribute_id = ? AND value_string IS NOT NULL AND value_string != ''
                ORDER BY value_string
            `, [deptAttrId]);

            return { success: true, data: rows.map(r => r.department) };
        } catch (error) {
            console.error('Error fetching departments:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Get staff statistics
     */
    getStats: async () => {
        try {
            await initStaffAttrs();

            const roleAttrId = await getAttrId('role');
            const statusAttrId = await getAttrId('status');

            // Count by role
            const [roleCounts] = await pool.query(`
                SELECT value_string AS role, COUNT(*) as count
                FROM staff_entity_attribute
                WHERE attribute_id = ?
                GROUP BY value_string
            `, [roleAttrId]);

            // Count by status
            const [statusCounts] = await pool.query(`
                SELECT value_string AS status, COUNT(*) as count
                FROM staff_entity_attribute
                WHERE attribute_id = ?
                GROUP BY value_string
            `, [statusAttrId]);

            // Total count
            const [[totalCount]] = await pool.query('SELECT COUNT(*) as total FROM staff_entity');

            return {
                success: true,
                data: {
                    total: totalCount?.total || 0,
                    byRole: roleCounts.reduce((acc, r) => { acc[r.role] = r.count; return acc; }, {}),
                    byStatus: statusCounts.reduce((acc, s) => { acc[s.status] = s.count; return acc; }, {})
                }
            };
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            return { success: false, message: error.message };
        }
    }
};

module.exports = AdminStaffService;
