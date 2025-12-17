require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../Db_config/DB');

async function setupAdmin() {
    try {
        console.log('🔐 Admin Account Setup\n');

        const adminEmail = 'admin@admin.com';
        const adminPassword = 'admin123'; // Change after first login
        const adminUsername = 'admin';

        // Check if admin@admin.com exists
        const [existing] = await pool.query(`
      SELECT 
        e.entity_id,
        e.entity_type,
        e.entity_name
      FROM entities e
      JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE a.attribute_name = 'email' AND ea.value_string = ?
    `, [adminEmail]);

        if (existing.length > 0) {
            const user = existing[0];
            console.log(`📌 Found existing user with ${adminEmail}`);
            console.log(`   Current type: ${user.entity_type}`);
            console.log(`   Entity ID: ${user.entity_id}\n`);

            if (user.entity_type !== 'admin') {
                console.log('🔄 Converting to admin type...');
                await pool.query(
                    'UPDATE entities SET entity_type = ? WHERE entity_id = ?',
                    ['admin', user.entity_id]
                );
                console.log('✅ Converted to admin type');
            } else {
                console.log('✅ Already an admin account');
            }

            console.log('\n📌 Admin Login Credentials:');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
            console.log('\n   ⚠️  If you don\'t know the password, reset it manually in database\n');

        } else {
            console.log('📝 Creating new admin account...\n');

            // Hash password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Create entity
            const [entityResult] = await pool.query(
                'INSERT INTO entities (entity_type, entity_name) VALUES (?, ?)',
                ['admin', adminUsername]
            );
            const adminId = entityResult.insertId;
            console.log('✅ Created admin entity (ID:', adminId + ')');

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
            console.log('✅ Added email');

            await pool.query(
                'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                [adminId, attrMap.password, hashedPassword]
            );
            console.log('✅ Added password (hashed)');

            await pool.query(
                'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                [adminId, attrMap.username, adminUsername]
            );
            console.log('✅ Added username');

            console.log('\n🎉 Admin account created successfully!');
            console.log('\n📌 Login Credentials:');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        }

        console.log('\n🔒 Security Status:');
        console.log('   ✅ Signup page blocks @admin emails');
        console.log('   ✅ Only manual database access can create admins');
        console.log('   ⚠️  Change password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupAdmin();
