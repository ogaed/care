// createNewAdmin.js
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createNewAdmin() {
  try {
    console.log('👨‍💼 CREATING NEW ADMIN USER\n');

    const adminUsers = [
      {
        username: 'superadmin',
        password: 'super1', // 6 characters
        email: 'superadmin@mamacare.org',
        name: 'Super Administrator'
      },
      {
        username: 'manager', 
        password: 'manage', // 6 characters
        email: 'manager@mamacare.org',
        name: 'System Manager'
      }
    ];

    for (const admin of adminUsers) {
      console.log(`=== Creating ${admin.username} ===`);
      
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      const firstPassword = admin.password; // Already 6 chars

      console.log('Username:', admin.username);
      console.log('Password:', admin.password);
      console.log('Email:', admin.email);
      console.log('Hashed password:', hashedPassword);
      console.log('');

      // Check if user already exists
      const existingUser = await db.query(
        "SELECT user_name FROM entitys WHERE user_name = $1",
        [admin.username]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⚠️ ${admin.username} already exists, updating password...`);
        
        // Update existing user
        await db.query(
          `UPDATE entitys 
           SET entity_password = $1, first_password = $2, role = 'admin'
           WHERE user_name = $3`,
          [hashedPassword, firstPassword, admin.username]
        );
      } else {
        // Create new admin
        const result = await db.query(
          `INSERT INTO entitys (
            org_id, entity_name, user_name, primary_email, primary_telephone, 
            entity_password, first_password, role
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          RETURNING entity_id, user_name`,
          [1, admin.name, admin.username, admin.email, '+254711111111', hashedPassword, firstPassword, 'admin']
        );

        console.log('✅ Admin created:', result.rows[0].user_name);

        // Create wallet
        await db.query(
          'INSERT INTO wallets (entity_id, org_id, balance, total_saved) VALUES ($1, 1, 0, 0)',
          [result.rows[0].entity_id]
        );

        console.log('✅ Admin wallet created');
      }

      // Verify the password works
      const verifyResult = await db.query(
        "SELECT entity_password FROM entitys WHERE user_name = $1",
        [admin.username]
      );

      if (verifyResult.rows.length > 0) {
        const isValid = await bcrypt.compare(admin.password, verifyResult.rows[0].entity_password);
        console.log(`🔐 Password verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);

        if (isValid) {
          console.log(`🎯 LOGIN CREDENTIALS for ${admin.username}:`);
          console.log('Username:', admin.username);
          console.log('Password:', admin.password);
        }
      }

      console.log(''); // Empty line for separation
    }

    console.log('📋 ALL ADMIN USERS:');
    const allAdmins = await db.query(
      "SELECT user_name, primary_email, role FROM entitys WHERE role = 'admin'"
    );
    
    allAdmins.rows.forEach(admin => {
      console.log(`- ${admin.user_name} (${admin.primary_email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

createNewAdmin();