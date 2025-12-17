require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../Db_config/DB');

async function createAdmin() {
    try {
        console.log('🔐 Creating Admin Account...\n');

        // Admin credentials
        const adminData = {
            username: 'admin',
            email: 'admin@admin.com',
            password: 'admin123', // You should change this after first login
            userType: 'admin'
        };

        console.log('📝 Admin Details:');
        console.log('   Email:', adminData.email);
        console.log('   Username:', adminData.username);
        console.log('   Password:', adminData.password);
        console.log('   ⚠️  IMPORTANT: Change this password after first login!\n');

        // Check if admin already exists
        const [existingAdmin] = await pool.query(`
      SELECT e.entity_id 
      FROM entities e
      JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE a.attribute_name = 'email' AND ea.value_string = ?
    `, [adminData.email]);

        if (existingAdmin.length > 0) {
            console.log('❌ Admin account already exists!');
            console.log('   If you forgot the password, delete it manually and run this script again.\n');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create entity
        const [entityResult] = await pool.query(
            'INSERT INTO entities (entity_type, entity_name) VALUES (?, ?)',
            [adminData.userType, adminData.username]
        );
        const adminId = entityResult.insertId;
        console.log('✅ Created admin entity with ID:', adminId);

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
            [adminId, attrMap.email, adminData.email]
        );
        console.log('✅ Added email');

        await pool.query(
            'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
            [adminId, attrMap.password, hashedPassword]
        );
        console.log('✅ Added password (hashed)');

        await pool.query(
            'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
            [adminId, attrMap.username, adminData.username]
        );
        console.log('✅ Added username');

        console.log('\n🎉 Admin account created successfully!');
        console.log('\n📌 Login Credentials:');
        console.log('   Email: admin@admin.com');
        console.log('   Password: admin123');
        console.log('\n⚠️  Security Note:');
        console.log('   - The signup page already blocks @admin emails');
        console.log('   - Only this script can create admin accounts');
        console.log('   - Change the password immediately after login\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
}

createAdmin();
