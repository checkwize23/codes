import dotenv from 'dotenv';
import '../firebaseAdmin.js';
import User from '../models/User.js';

dotenv.config();

const bootstrapSuperAdmin = async () => {
  try {
    // Check if super admin already exists (by role or email)
    const existingByRole = await User.findOne({ role: 'super_admin' });
    const existingByEmail = await User.findOne({ email: process.env.SUPER_ADMIN_EMAIL });

    if (existingByRole || existingByEmail) {
      console.log('Super admin already exists:', (existingByRole || existingByEmail).email);
      process.exit(0);
    }

    // Create super admin user
    const superAdminData = {
      username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!',
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'Super',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Admin',
      role: 'super_admin',
      isActive: true,
    };

    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', superAdminData.email);
    console.log('🔑 Password:', superAdminData.password);
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

bootstrapSuperAdmin();
