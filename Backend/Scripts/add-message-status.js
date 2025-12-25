/**
 * Add message status column to student_staff_message table
 */
require('dotenv').config();
const pool = require('../Db_config/DB');

async function addMessageStatus() {
    try {
        // Check if column exists
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'student_staff_message' 
            AND COLUMN_NAME = 'status'
        `);

        if (columns.length === 0) {
            await pool.query(`
                ALTER TABLE student_staff_message 
                ADD COLUMN status ENUM('sent','delivered','read') DEFAULT 'sent'
            `);
            console.log('✓ Added status column to student_staff_message');
        } else {
            console.log('✓ Status column already exists');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

addMessageStatus();
