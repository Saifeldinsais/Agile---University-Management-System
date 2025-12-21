const StaffEntity = require("../EAV models/staff_entity");
const StaffAttribute = require("../EAV models/staff_attribute");
const StaffValue = require("../EAV models/staff_value");
const pool = require("../Db_config/DB");

let attributesInitialized = false;

// Initialize all required staff attributes
const initializeAttributes = async () => {
    if (attributesInitialized) return;

    try {
        const attrs = [
            { name: "email", type: "string" },
            { name: "phone", type: "string" },
            { name: "department", type: "string" },
            { name: "office_location", type: "string" },
            { name: "office_hours", type: "text" },
            { name: "assigned_courses", type: "text" },
            { name: "ta_responsibilities", type: "text" },
            { name: "supervisor_id", type: "int" },
            { name: "hire_date", type: "datetime" },
            { name: "salary", type: "float" },
            { name: "leave_balance", type: "int" },
            { name: "benefits", type: "text" },
            { name: "performance_records", type: "text" },
            { name: "research_publications", type: "text" },
            { name: "professional_development", type: "text" }
        ];

        for (const attr of attrs) {
            await StaffAttribute.createIfNotExists(attr.name, attr.type);
        }

        attributesInitialized = true;
        console.log("Staff attributes initialized");
    } catch (error) {
        console.error("Error initializing staff attributes:", error.message);
    }
};

// ================= STAFF DIRECTORY =================

const staffService = {
    // Get all staff members with their details
    getAllStaff: async () => {
        try {
            await initializeAttributes();

            const [rows] = await pool.query(`
        SELECT
          se.entity_id AS id,
          se.entity_type AS staffType,
          se.entity_name AS name,
          MAX(CASE WHEN sa.attribute_name='email' THEN sea.value_string END) AS email,
          MAX(CASE WHEN sa.attribute_name='phone' THEN sea.value_string END) AS phone,
          MAX(CASE WHEN sa.attribute_name='department' THEN sea.value_string END) AS department,
          MAX(CASE WHEN sa.attribute_name='office_location' THEN sea.value_string END) AS officeLocation,
          MAX(CASE WHEN sa.attribute_name='office_hours' THEN sea.value_string END) AS officeHours
        FROM staff_entity se
        LEFT JOIN staff_entity_attribute sea ON se.entity_id = sea.entity_id
        LEFT JOIN staff_attributes sa ON sea.attribute_id = sa.attribute_id
        GROUP BY se.entity_id, se.entity_type, se.entity_name
        ORDER BY se.entity_name ASC
      `);

            return { success: true, data: rows };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Get staff by type (professor or ta)
    getStaffByType: async (type) => {
        try {
            await initializeAttributes();

            const [rows] = await pool.query(`
        SELECT
          se.entity_id AS id,
          se.entity_type AS staffType,
          se.entity_name AS name,
          MAX(CASE WHEN sa.attribute_name='email' THEN sea.value_string END) AS email,
          MAX(CASE WHEN sa.attribute_name='phone' THEN sea.value_string END) AS phone,
          MAX(CASE WHEN sa.attribute_name='department' THEN sea.value_string END) AS department,
          MAX(CASE WHEN sa.attribute_name='office_location' THEN sea.value_string END) AS officeLocation
        FROM staff_entity se
        LEFT JOIN staff_entity_attribute sea ON se.entity_id = sea.entity_id
        LEFT JOIN staff_attributes sa ON sea.attribute_id = sa.attribute_id
        WHERE se.entity_type = ?
        GROUP BY se.entity_id, se.entity_type, se.entity_name
        ORDER BY se.entity_name ASC
      `, [type]);

            return { success: true, data: rows };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Get single staff member by ID
    getStaffById: async (id) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(id);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const values = await StaffValue.getEntityValues(id);
            const [attributes] = await pool.query("SELECT * FROM staff_attributes");

            // Build a map of attribute_id -> attribute_name
            const attrMap = {};
            attributes.forEach(attr => {
                attrMap[attr.attribute_id] = attr.attribute_name;
            });

            // Build staff object
            const staffData = {
                id: staff.entity_id,
                name: staff.entity_name,
                staffType: staff.entity_type,
                createdAt: staff.created_at
            };

            // Add attribute values
            values.forEach(val => {
                const attrName = attrMap[val.attribute_id];
                if (attrName) {
                    // Try to parse JSON for complex fields
                    if (['office_hours', 'assigned_courses', 'ta_responsibilities', 'benefits',
                        'performance_records', 'research_publications', 'professional_development'].includes(attrName)) {
                        try {
                            staffData[attrName] = JSON.parse(val.value_string);
                        } catch {
                            staffData[attrName] = val.value_string;
                        }
                    } else if (val.value_number !== null) {
                        staffData[attrName] = val.value_number;
                    } else {
                        staffData[attrName] = val.value_string;
                    }
                }
            });

            return { success: true, data: staffData };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Create a new staff profile
    createStaffProfile: async (staffData) => {
        try {
            await initializeAttributes();

            const { name, type, email, phone, department, officeLocation, supervisorId } = staffData;

            if (!name || !type || !email) {
                return { success: false, message: "Name, type, and email are required" };
            }

            if (!['professor', 'ta'].includes(type)) {
                return { success: false, message: "Type must be 'professor' or 'ta'" };
            }

            // Check if email already exists
            const existing = await StaffEntity.findByAttribute("email", email);
            if (existing) {
                return { success: false, message: "Staff with this email already exists" };
            }

            // Create entity
            const staffId = await StaffEntity.create(type, name);

            // Get attribute IDs
            const emailAttr = await StaffAttribute.getAttributeByName("email");
            const phoneAttr = await StaffAttribute.getAttributeByName("phone");
            const deptAttr = await StaffAttribute.getAttributeByName("department");
            const officeAttr = await StaffAttribute.getAttributeByName("office_location");
            const supervisorAttr = await StaffAttribute.getAttributeByName("supervisor_id");
            const leaveAttr = await StaffAttribute.getAttributeByName("leave_balance");

            // Store values
            await StaffValue.createValue(staffId, emailAttr.attribute_id, { value_string: email });

            if (phone) {
                await StaffValue.createValue(staffId, phoneAttr.attribute_id, { value_string: phone });
            }
            if (department) {
                await StaffValue.createValue(staffId, deptAttr.attribute_id, { value_string: department });
            }
            if (officeLocation) {
                await StaffValue.createValue(staffId, officeAttr.attribute_id, { value_string: officeLocation });
            }
            if (supervisorId && type === 'ta') {
                await StaffValue.createValue(staffId, supervisorAttr.attribute_id, { value_number: supervisorId });
            }

            // Initialize leave balance to 21 days
            await StaffValue.createValue(staffId, leaveAttr.attribute_id, { value_number: 21 });

            return { success: true, staffId, message: "Staff profile created successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Update staff profile
    updateStaffProfile: async (id, staffData) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(id);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const { name, phone, department, officeLocation } = staffData;

            // Update entity name if provided
            if (name) {
                await StaffEntity.update(id, name);
            }

            // Helper to update attribute value
            const updateAttr = async (attrName, value, isNumber = false) => {
                if (value !== undefined) {
                    const attr = await StaffAttribute.getAttributeByName(attrName);
                    if (attr) {
                        const valueData = isNumber ? { value_number: value } : { value_string: value };
                        await StaffValue.upsertValue(id, attr.attribute_id, valueData);
                    }
                }
            };

            await updateAttr("phone", phone);
            await updateAttr("department", department);
            await updateAttr("office_location", officeLocation);

            return { success: true, message: "Staff profile updated successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Delete staff profile
    deleteStaffProfile: async (id) => {
        try {
            const staff = await StaffEntity.findById(id);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            await StaffEntity.delete(id);
            return { success: true, message: "Staff profile deleted successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= OFFICE HOURS =================

    getOfficeHours: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("office_hours");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let officeHours = [];
            if (value && value.value_string) {
                try {
                    officeHours = JSON.parse(value.value_string);
                } catch {
                    officeHours = [];
                }
            }

            return { success: true, data: officeHours };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    updateOfficeHours: async (staffId, officeHoursData) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("office_hours");
            await StaffValue.upsertValue(staffId, attr.attribute_id, {
                value_string: JSON.stringify(officeHoursData)
            });

            return { success: true, message: "Office hours updated successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= COURSES =================

    getAssignedCourses: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("assigned_courses");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let courses = [];
            if (value && value.value_string) {
                try {
                    courses = JSON.parse(value.value_string);
                } catch {
                    courses = [];
                }
            }

            return { success: true, data: courses };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    assignCourseToStaff: async (staffId, courseId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("assigned_courses");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let courses = [];
            if (value && value.value_string) {
                try {
                    courses = JSON.parse(value.value_string);
                } catch {
                    courses = [];
                }
            }

            if (courses.includes(courseId)) {
                return { success: false, message: "Course already assigned" };
            }

            courses.push(courseId);
            await StaffValue.upsertValue(staffId, attr.attribute_id, {
                value_string: JSON.stringify(courses)
            });

            return { success: true, message: "Course assigned successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= TA MANAGEMENT =================

    getTAResponsibilities: async (taId) => {
        try {
            await initializeAttributes();

            const ta = await StaffEntity.findById(taId);
            if (!ta) {
                return { success: false, message: "TA not found" };
            }
            if (ta.entity_type !== 'ta') {
                return { success: false, message: "Staff member is not a TA" };
            }

            const attr = await StaffAttribute.getAttributeByName("ta_responsibilities");
            const value = await StaffValue.getValue(taId, attr.attribute_id);

            let responsibilities = [];
            if (value && value.value_string) {
                try {
                    responsibilities = JSON.parse(value.value_string);
                } catch {
                    responsibilities = [];
                }
            }

            return { success: true, data: responsibilities };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    updateTAResponsibilities: async (taId, responsibilities) => {
        try {
            await initializeAttributes();

            const ta = await StaffEntity.findById(taId);
            if (!ta) {
                return { success: false, message: "TA not found" };
            }
            if (ta.entity_type !== 'ta') {
                return { success: false, message: "Staff member is not a TA" };
            }

            const attr = await StaffAttribute.getAttributeByName("ta_responsibilities");
            await StaffValue.upsertValue(taId, attr.attribute_id, {
                value_string: JSON.stringify(responsibilities)
            });

            return { success: true, message: "TA responsibilities updated successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= PERFORMANCE TRACKING =================

    getPerformanceRecords: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("performance_records");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let records = [];
            if (value && value.value_string) {
                try {
                    records = JSON.parse(value.value_string);
                } catch {
                    records = [];
                }
            }

            return { success: true, data: records };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    addPerformanceRecord: async (staffId, record) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("performance_records");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let records = [];
            if (value && value.value_string) {
                try {
                    records = JSON.parse(value.value_string);
                } catch {
                    records = [];
                }
            }

            record.id = Date.now();
            record.createdAt = new Date().toISOString();
            records.push(record);

            await StaffValue.upsertValue(staffId, attr.attribute_id, {
                value_string: JSON.stringify(records)
            });

            return { success: true, message: "Performance record added successfully", recordId: record.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    getResearchPublications: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("research_publications");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let publications = [];
            if (value && value.value_string) {
                try {
                    publications = JSON.parse(value.value_string);
                } catch {
                    publications = [];
                }
            }

            return { success: true, data: publications };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    addResearchPublication: async (staffId, publication) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("research_publications");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let publications = [];
            if (value && value.value_string) {
                try {
                    publications = JSON.parse(value.value_string);
                } catch {
                    publications = [];
                }
            }

            publication.id = Date.now();
            publication.addedAt = new Date().toISOString();
            publications.push(publication);

            await StaffValue.upsertValue(staffId, attr.attribute_id, {
                value_string: JSON.stringify(publications)
            });

            return { success: true, message: "Research publication added successfully", publicationId: publication.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= HR INTEGRATION =================

    getPayrollInfo: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const salaryAttr = await StaffAttribute.getAttributeByName("salary");
            const hireDateAttr = await StaffAttribute.getAttributeByName("hire_date");

            const salaryVal = await StaffValue.getValue(staffId, salaryAttr.attribute_id);
            const hireDateVal = await StaffValue.getValue(staffId, hireDateAttr.attribute_id);

            return {
                success: true,
                data: {
                    staffId,
                    name: staff.entity_name,
                    salary: salaryVal?.value_number || null,
                    hireDate: hireDateVal?.value_string || null,
                    staffType: staff.entity_type
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    updatePayrollInfo: async (staffId, payrollData) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const { salary, hireDate } = payrollData;

            if (salary !== undefined) {
                const salaryAttr = await StaffAttribute.getAttributeByName("salary");
                await StaffValue.upsertValue(staffId, salaryAttr.attribute_id, { value_number: salary });
            }

            if (hireDate !== undefined) {
                const hireDateAttr = await StaffAttribute.getAttributeByName("hire_date");
                await StaffValue.upsertValue(staffId, hireDateAttr.attribute_id, { value_string: hireDate });
            }

            return { success: true, message: "Payroll information updated successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    getBenefits: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("benefits");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let benefits = {};
            if (value && value.value_string) {
                try {
                    benefits = JSON.parse(value.value_string);
                } catch {
                    benefits = {};
                }
            }

            return { success: true, data: benefits };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= LEAVE REQUESTS =================

    getLeaveRequests: async (staffId) => {
        try {
            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const [rows] = await pool.query(
                `SELECT * FROM staff_leave_requests WHERE staff_entity_id = ? ORDER BY created_at DESC`,
                [staffId]
            );

            return { success: true, data: rows };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    getAllLeaveRequests: async (status = null) => {
        try {
            let query = `
        SELECT slr.*, se.entity_name AS staffName, se.entity_type AS staffType
        FROM staff_leave_requests slr
        JOIN staff_entity se ON slr.staff_entity_id = se.entity_id
      `;
            const params = [];

            if (status) {
                query += ` WHERE slr.status = ?`;
                params.push(status);
            }

            query += ` ORDER BY slr.created_at DESC`;

            const [rows] = await pool.query(query, params);
            return { success: true, data: rows };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    createLeaveRequest: async (staffId, leaveData) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const { leaveType, startDate, endDate, reason } = leaveData;

            if (!leaveType || !startDate || !endDate) {
                return { success: false, message: "Leave type, start date, and end date are required" };
            }

            const [result] = await pool.query(
                `INSERT INTO staff_leave_requests (staff_entity_id, leave_type, start_date, end_date, reason)
         VALUES (?, ?, ?, ?, ?)`,
                [staffId, leaveType, startDate, endDate, reason || null]
            );

            return { success: true, requestId: result.insertId, message: "Leave request created successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    updateLeaveRequestStatus: async (requestId, status, reviewedBy) => {
        try {
            if (!['approved', 'rejected'].includes(status)) {
                return { success: false, message: "Status must be 'approved' or 'rejected'" };
            }

            const [existing] = await pool.query(
                "SELECT * FROM staff_leave_requests WHERE request_id = ?",
                [requestId]
            );

            if (existing.length === 0) {
                return { success: false, message: "Leave request not found" };
            }

            await pool.query(
                `UPDATE staff_leave_requests 
         SET status = ?, reviewed_by = ?, reviewed_at = NOW()
         WHERE request_id = ?`,
                [status, reviewedBy, requestId]
            );

            // If approved, deduct from leave balance
            if (status === 'approved') {
                const request = existing[0];
                const startDate = new Date(request.start_date);
                const endDate = new Date(request.end_date);
                const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                const leaveAttr = await StaffAttribute.getAttributeByName("leave_balance");
                const currentBalance = await StaffValue.getValue(request.staff_entity_id, leaveAttr.attribute_id);
                const newBalance = (currentBalance?.value_number || 21) - daysDiff;

                await StaffValue.upsertValue(request.staff_entity_id, leaveAttr.attribute_id, {
                    value_number: Math.max(0, newBalance)
                });
            }

            return { success: true, message: `Leave request ${status}` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    getLeaveBalance: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const leaveAttr = await StaffAttribute.getAttributeByName("leave_balance");
            const value = await StaffValue.getValue(staffId, leaveAttr.attribute_id);

            return { success: true, data: { leaveBalance: value?.value_number || 21 } };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= PROFESSIONAL DEVELOPMENT =================

    getProfessionalDevelopment: async (staffId) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("professional_development");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let activities = [];
            if (value && value.value_string) {
                try {
                    activities = JSON.parse(value.value_string);
                } catch {
                    activities = [];
                }
            }

            return { success: true, data: activities };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    addProfessionalDevelopment: async (staffId, activity) => {
        try {
            await initializeAttributes();

            const staff = await StaffEntity.findById(staffId);
            if (!staff) {
                return { success: false, message: "Staff member not found" };
            }

            const attr = await StaffAttribute.getAttributeByName("professional_development");
            const value = await StaffValue.getValue(staffId, attr.attribute_id);

            let activities = [];
            if (value && value.value_string) {
                try {
                    activities = JSON.parse(value.value_string);
                } catch {
                    activities = [];
                }
            }

            activity.id = Date.now();
            activity.addedAt = new Date().toISOString();
            activities.push(activity);

            await StaffValue.upsertValue(staffId, attr.attribute_id, {
                value_string: JSON.stringify(activities)
            });

            return { success: true, message: "Professional development activity added", activityId: activity.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= USER-STAFF LINKING =================

    getOrCreateByEmail: async (email, name, type = 'ta') => {
        try {
            await initializeAttributes();

            // First try to find existing staff by email
            const existing = await StaffEntity.findByAttribute("email", email);
            if (existing) {
                // Return existing staff profile
                const result = await staffService.getStaffById(existing.entity_id);
                return result;
            }

            // Create new staff profile
            const createResult = await staffService.createStaffProfile({
                name: name || email.split('@')[0],
                type: type,
                email: email
            });

            if (createResult.success) {
                return await staffService.getStaffById(createResult.staffId);
            }

            return createResult;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

module.exports = staffService;
