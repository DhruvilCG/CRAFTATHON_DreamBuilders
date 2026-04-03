const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Seed users on database connection
const seedUsers = async () => {
    try {
        const User = require('../models/User');
        
        const seedData = [
            { name: 'Col. Aryan Singh', email: 'admin@mil.local', password: 'admin123', role: 'Admin' },
            { name: 'Dr. Meera Sharma', email: 'analyst@mil.local', password: 'analyst123', role: 'Analyst' },
            { name: 'Operator Kabir', email: 'monitor@mil.local', password: 'monitor123', role: 'Monitor' },
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
                });
                
                console.log(`✓ Seeded ${userData.role}: ${userData.email} / ${userData.password}`);
            }
        }
    } catch (error) {
        console.error('Error seeding users:', error.message);
    }
};

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_military';
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Seed test users after connection
        await seedUsers();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
