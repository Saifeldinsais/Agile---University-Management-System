const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function linkParentToStudent(parentEmail, studentEmail, relationship = 'Parent') {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'university_management',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log(`Linking Parent (${parentEmail}) to Student (${studentEmail})...`);

        // 1. Find Parent ID
        const [parents] = await pool.query(`
            SELECT p.entity_id, p.entity_name 
            FROM parent_entity p
            JOIN parent_entity_attribute v ON p.entity_id = v.entity_id
            JOIN parent_attributes a ON v.attribute_id = a.attribute_id
            WHERE a.attribute_name = 'email' AND v.value_string = ?
        `, [parentEmail]);

        if (parents.length === 0) {
            console.error(`❌ Parent not found with email: ${parentEmail}`);
            return;
        }
        const parentId = parents[0].entity_id;
        console.log(`✅ Found Parent: ${parents[0].entity_name} (ID: ${parentId})`);

        // 2. Find Student ID
        const [students] = await pool.query(`
            SELECT entity_id, entity_name 
            FROM entities 
            WHERE entity_email = ? AND entity_type = 'student'
        `, [studentEmail]);

        if (students.length === 0) {
            console.error(`❌ Student not found with email: ${studentEmail}`);
            return;
        }
        const studentId = students[0].entity_id;
        console.log(`✅ Found Student: ${students[0].entity_name} (ID: ${studentId})`);

        // 3. Check if link exists
        const [existing] = await pool.query(`
            SELECT link_id FROM parent_student_link 
            WHERE parent_id = ? AND student_id = ?
        `, [parentId, studentId]);

        if (existing.length > 0) {
            console.log(`⚠️ Link already exists between Parent and Student.`);
            return;
        }

        // 4. Create Link
        await pool.query(`
            INSERT INTO parent_student_link (parent_id, student_id, relationship, link_status)
            VALUES (?, ?, ?, 'active')
        `, [parentId, studentId, relationship]);

        console.log(`🎉 Successfully linked Parent (${parentEmail}) to Student (${studentEmail}) as '${relationship}'!`);

    } catch (error) {
        console.error('Error linking parent and student:', error);
    } finally {
        await pool.end();
    }
}

// Get arguments from command line
const parentEmail = process.argv[2];
const studentEmail = process.argv[3];
const relationship = process.argv[4];

async function listEntities() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'university_management',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('\n--- Available Parents ---');
        const [parents] = await pool.query(`
            SELECT p.entity_name, v.value_string as email
            FROM parent_entity p
            JOIN parent_entity_attribute v ON p.entity_id = v.entity_id
            JOIN parent_attributes a ON v.attribute_id = a.attribute_id
            WHERE a.attribute_name = 'email'
            LIMIT 5
        `);
        if (parents.length === 0) console.log('No parents found.');
        parents.forEach(p => console.log(`- ${p.entity_name} (${p.email})`));

        console.log('\n--- Available Students ---');
        const [students] = await pool.query(`
            SELECT entity_name, entity_email 
            FROM entities 
            WHERE entity_type = 'student'
            LIMIT 5
        `);
        if (students.length === 0) console.log('No students found.');
        students.forEach(s => console.log(`- ${s.entity_name} (${s.entity_email})`));

        console.log('\nUsage: node link-parent-student.js <parent_email> <student_email> [relationship]');

    } catch (error) {
        console.error('Error listing entities:', error);
    } finally {
        await pool.end();
    }
}

if (!parentEmail || !studentEmail) {
    listEntities();
} else {
    linkParentToStudent(parentEmail, studentEmail, relationship);
}
