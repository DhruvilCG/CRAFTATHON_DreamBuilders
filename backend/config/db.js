const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Seed users on database connection
const seedUsers = async () => {
    try {
        const User = require('../models/User');
        
        const seedData = [
            { name: 'Col. Aryan Singh', email: 'admin@mil.local', password: 'admin123', role: 'Admin', accountStatus: 'active' },
            { name: 'Dr. Meera Sharma', email: 'analyst@mil.local', password: 'analyst123', role: 'Analyst', accountStatus: 'active' },
            { name: 'Operator Kabir', email: 'monitor@mil.local', password: 'monitor123', role: 'Monitor', accountStatus: 'active' },
        ];
        
        for (const userData of seedData) {
            const userExists = await User.findOne({ email: userData.email });
            
            if (!userExists) {
                // Don't hash here - let the User model pre-save hook handle it
                await User.create({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,  // Plain password - model will hash it
                    role: userData.role,
                    accountStatus: userData.accountStatus,
                    approvedAt: new Date(),
                });
                
                console.log(`✓ Seeded ${userData.role}: ${userData.email} / ${userData.password}`);
            } else {
                // Migration guard: keep system seed users active after schema updates.
                const updates = {};

                if (userExists.accountStatus !== 'active') {
                    updates.accountStatus = 'active';
                    updates.approvedAt = new Date();
                }

                if (!userExists.role || userExists.role !== userData.role) {
                    updates.role = userData.role;
                }

                if (Object.keys(updates).length > 0) {
                    await User.updateOne({ _id: userExists._id }, { $set: updates });
                    console.log(`✓ Normalized seed user ${userData.email} to active status`);
                }
            }
        }

        // Backfill old records created before accountStatus existed.
        const migrationResult = await User.updateMany(
            { accountStatus: { $exists: false } },
            { $set: { accountStatus: 'active', approvedAt: new Date() } },
        );

        if (migrationResult.modifiedCount > 0) {
            console.log(`✓ Migrated ${migrationResult.modifiedCount} existing users to active account status`);
        }
    } catch (error) {
        console.error('Error seeding users:', error.message);
    }
};

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_military';
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            minPoolSize: 2,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Seed test users after connection
        await seedUsers();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
