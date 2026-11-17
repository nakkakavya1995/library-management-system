const mongoose = require('mongoose');

let lastDbError = null;
let isConnecting = false;

// Connect to MongoDB with auto-retry
const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  const uri =
    process.env.MONGO_URI ||
    (process.env.NODE_ENV === 'production'
      ? null
      : 'mongodb://localhost:27017/library_management_system');

  if (!uri) {
    lastDbError = 'MONGO_URI is not set in environment variables';
    console.warn('\n======================================================');
    console.warn('[MongoDB] WARNING: MONGO_URI is not set in environment variables!');
    console.warn('[MongoDB] In Render, please add MONGO_URI in your Environment tab');
    console.warn('======================================================\n');
    return;
  }

  isConnecting = true;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    lastDbError = null;
    isConnecting = false;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnecting = false;
    lastDbError = error.message;
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('[MongoDB] Retrying database connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

const getLastDbError = () => lastDbError;

module.exports = { connectDB, getLastDbError };

