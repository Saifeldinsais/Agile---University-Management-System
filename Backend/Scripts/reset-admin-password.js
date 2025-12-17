require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../Db_config/DB');

async function resetAdminPassword() {
    try {
        console.log('🔑 Resetting Admin Password...\n');

        const adminEmail = 'admin@admin.com';
        const newPassword = 'admin123';

        // Find admin account
        const [user] = await pool.query(`
      SELECT 
        e.entity_id,
        e.entity_type
      FROM entities e
      JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE a.attribute_name = 'email' AND ea.value_string = ?
    `, [adminEmail]);

        if (user.length === 0) {
            console.log('❌ Admin account not found!');
            console.log('   Run "node setup-admin.js" first.\n');
            process.exit(1);
        }

        const adminId = user[0].entity_id;
        console.log(`✅ Found admin account (ID: ${adminId}, Type: ${user[0].entity_type})`);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Get password attribute ID
        const [passwordAttr] = await pool.query(
            'SELECT attribute_id FROM attributes WHERE attribute_name = ?',
            ['password']
        );

        if (passwordAttr.length === 0) {
            console.log('❌ Password attribute not found!');
            process.exit(1);
        }

        const passwordAttrId = passwordAttr[0].attribute_id;

        // Update password
        await pool.query(
            'UPDATE entity_attribute SET value_string = ? WHERE entity_id = ? AND attribute_id = ?',
            [hashedPassword, adminId, passwordAttrId]
        );

        console.log('✅ Password reset successfully!');
        console.log('\n📌 New Admin Credentials:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${newPassword}`);
        console.log('\n✅ You can now login at http://localhost:3000/login\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();
