const mangoose = require('mongoose');

async function connectDB() {
    try {
        await mangoose.connect(process.env.MONGO_URI)
            console.log('MongoDB connected');
    }
        catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        
    }
}

module.exports = connectDB;