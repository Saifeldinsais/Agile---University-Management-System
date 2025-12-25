/**
 * Seed script to add sample doctors/staff to the Staff Directory
 * Run: node Scripts/seed-staff.js
 */

require('dotenv').config();
const pool = require('../Db_config/DB');
const StaffAttribute = require('../EAV models/staff_attribute');

const sampleStaff = [
    {
        name: "Dr. Ahmed Hassan",
        email: "ahmed.hassan@university.edu",
        role: "doctor",
        roles: ["doctor", "advisor"],
        department: "Computer Science",
        officeLocation: "Building A, Room 201",
        phone: "+20 123 456 7890",
        status: "active",
        specialization: "Machine Learning, Data Science"
    },
    {
        name: "Dr. Sarah Mohamed",
        email: "sarah.mohamed@university.edu",
        role: "doctor",
        roles: ["doctor"],
        department: "Computer Science",
        officeLocation: "Building A, Room 205",
        phone: "+20 123 456 7891",
        status: "active",
        specialization: "Software Engineering, Agile Methods"
    },
    {
        name: "Dr. Omar Ali",
        email: "omar.ali@university.edu",
        role: "doctor",
        roles: ["doctor", "professor"],
        department: "Mathematics",
        officeLocation: "Building B, Room 102",
        phone: "+20 123 456 7892",
        status: "active",
        specialization: "Discrete Mathematics, Algorithms"
    },
    {
        name: "Eng. Fatma Youssef",
        email: "fatma.youssef@university.edu",
        role: "ta",
        roles: ["ta"],
        department: "Computer Science",
        officeLocation: "Building A, Room 310",
        phone: "+20 123 456 7893",
        status: "active",
        specialization: "Web Development, Frontend"
    },
    {
        name: "Eng. Karim Mahmoud",
        email: "karim.mahmoud@university.edu",
        role: "ta",
        roles: ["ta"],
        department: "Computer Science",
        officeLocation: "Building A, Room 312",
        phone: "+20 123 456 7894",
        status: "active",
        specialization: "Database Systems, Backend"
    },
    {
        name: "Dr. Nadia Ibrahim",
        email: "nadia.ibrahim@university.edu",
        role: "advisor",
        roles: ["doctor", "advisor"],
        department: "Information Systems",
        officeLocation: "Building C, Room 105",
        phone: "+20 123 456 7895",
        status: "active",
        specialization: "Information Security, Networks"
    }
];

const getAttrId = async (name) => {
    const attr = await StaffAttribute.getAttributeByName(name);
    return attr ? attr.attribute_id : null;
};

const upsertValue = async (entityId, attrId, value) => {
    if (!attrId) return;

    const [[existing]] = await pool.query(
        'SELECT value_id FROM staff_entity_attribute WHERE entity_id = ? AND attribute_id = ?',
        [entityId, attrId]
    );

    if (existing) {
        await pool.query(
            'UPDATE staff_entity_attribute SET value_string = ? WHERE value_id = ?',
            [value, existing.value_id]
        );
    } else {
        await pool.query(
            'INSERT INTO staff_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
            [entityId, attrId, value]
        );
    }
};

async function seedStaff() {
    console.log("🚀 Starting staff seed...\n");

    try {
        // Initialize attributes
        const attrs = ['name', 'email', 'role', 'roles', 'department', 'officeLocation', 'phone', 'status', 'specialization'];
        for (const attr of attrs) {
            await StaffAttribute.createIfNotExists(attr, 'string');
        }
        console.log("✅ Attributes initialized\n");

        // Get attribute IDs
        const nameAttrId = await getAttrId('name');
        const emailAttrId = await getAttrId('email');
        const roleAttrId = await getAttrId('role');
        const rolesAttrId = await getAttrId('roles');
        const deptAttrId = await getAttrId('department');
        const officeAttrId = await getAttrId('officeLocation');
        const phoneAttrId = await getAttrId('phone');
        const statusAttrId = await getAttrId('status');
        const specAttrId = await getAttrId('specialization');

        let created = 0;
        let skipped = 0;

        for (const staff of sampleStaff) {
            // Check if already exists
            const [[existing]] = await pool.query(
                'SELECT entity_id FROM staff_entity_attribute WHERE attribute_id = ? AND value_string = ?',
                [emailAttrId, staff.email]
            );

            if (existing) {
                console.log(`⏭️  Skipped: ${staff.name} (already exists)`);
                skipped++;
                continue;
            }

            // Create staff entity
            const [result] = await pool.query(
                'INSERT INTO staff_entity (entity_name) VALUES (?)',
                [`staff-${staff.email}`]
            );
            const staffId = result.insertId;

            // Save attributes
            await upsertValue(staffId, nameAttrId, staff.name);
            await upsertValue(staffId, emailAttrId, staff.email);
            await upsertValue(staffId, roleAttrId, staff.role);
            await upsertValue(staffId, rolesAttrId, JSON.stringify(staff.roles));
            await upsertValue(staffId, deptAttrId, staff.department);
            await upsertValue(staffId, officeAttrId, staff.officeLocation);
            await upsertValue(staffId, phoneAttrId, staff.phone);
            await upsertValue(staffId, statusAttrId, staff.status);
            await upsertValue(staffId, specAttrId, staff.specialization);

            console.log(`✅ Created: ${staff.name} (${staff.role})`);
            created++;
        }

        console.log(`\n========================================`);
        console.log(`✅ Seed completed!`);
        console.log(`   Created: ${created} staff members`);
        console.log(`   Skipped: ${skipped} (already exist)`);
        console.log(`========================================\n`);

    } catch (error) {
        console.error("❌ Error seeding staff:", error);
    } finally {
        process.exit(0);
    }
}

seedStaff();
