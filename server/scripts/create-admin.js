import bcrypt from 'bcryptjs';
import db from '../src/config/database.js';

const createAdmin = async () => {
  try {
    const username = 'AdminAccount';
    const password = 'agonadmin123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser) {
      console.log(`User "${username}" already exists. Updating password and admin status...`);
      await db.exec(
        'UPDATE users SET password = $1, is_admin = true WHERE username = $2',
        [hashedPassword, username]
      );
      console.log('✓ Admin account updated successfully');
    } else {
      console.log(`Creating new admin account "${username}"...`);
      const result = await db.queryOne(
        'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, true) RETURNING id',
        [username, hashedPassword]
      );
      
      // Create wallet for the admin user
      await db.exec(
        'INSERT INTO wallets (user_id, agon, stoneworks_dollar, agon_escrow) VALUES ($1, 0, 0, 0)',
        [result.id]
      );
      
      console.log('✓ Admin account created successfully');
      console.log(`  Username: ${username}`);
      console.log(`  User ID: ${result.id}`);
    }
    
    await db.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin account:', error);
    await db.shutdown();
    process.exit(1);
  }
};

createAdmin();
