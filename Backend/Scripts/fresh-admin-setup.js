require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../Db_config/DB');

async function freshAdminSetup() {
    try {
        console.log('🔐 Fresh Admin Setup (Delete & Recreate)...\n');

        const adminEmail = 'admin@admin.com';
        const adminPassword = 'admin123';
        const adminUsername = 'admin';

        // Delete existing admin@admin.com account if it exists
        console.log('🗑️  Deleting existing admin@admin.com account...');
        const [existing] = await pool.query(`
      SELECT e.entity_id FROM entities e
      JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE a.attribute_name = 'email' AND ea.value_string = ?
    `, [adminEmail]);

        if (existing.length > 0) {
            for (const user of existing) {
                await pool.query('DELETE FROM entities WHERE entity_id = ?', [user.entity_id]);
                console.log(`   ✅ Deleted entity ID: ${user.entity_id}`);
            }
        } else {
            console.log('   ℹ️  No existing account found');
        }

        console.log('\n📝 Creating new admin account...');

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        console.log('   ✅ Password hashed');

        // Create entity
        const [entityResult] = await pool.query(
            'INSERT INTO entities (entity_type, entity_name) VALUES (?, ?)',
            ['admin', adminUsername]
        );
        const adminId = entityResult.insertId;
        console.log(`   ✅ Created admin entity (ID: ${adminId})`);

        // Get attribute IDs
        const [attributes] = await pool.query(`
      SELECT attribute_id, attribute_name FROM attributes 
      WHERE attribute_name IN ('email', 'password', 'username')
    `);

        const attrMap = {};
        attributes.forEach(attr => {
            attrMap[attr.attribute_name] = attr.attribute_id;
        });

        // Insert attributes
        await pool.query(
            'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
            [adminId, attrMap.email, adminEmail]
        );
        console.log('   ✅ Added email');

        await pool.query(
            'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
            [adminId, attrMap.password, hashedPassword]
        );
        console.log('   ✅ Added password');

        await pool.query(
            'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
            [adminId, attrMap.username, adminUsername]
        );
        console.log('   ✅ Added username');

        console.log('\n🎉 Admin account created successfully!');
        console.log('\n📌 Login Credentials:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   URL: http://localhost:3000/login`);
        console.log('\n🔒 Security:');
        console.log('   ✅ Signup page blocks @admin emails');
        console.log('   ⚠️  Change password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

freshAdminSetup();
