import User from '../models/User.js';

export const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bridge.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.log('No ADMIN_PASSWORD provided in .env. Skipping default admin seed.');
      return;
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return;
    }

    await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true,
    });

    console.log(`Initial admin account created: ${adminEmail}`);
  } catch (error) {
    console.error(`Error during admin seeding: ${error.message}`);
  }
};