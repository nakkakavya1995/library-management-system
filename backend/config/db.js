const mongoose = require('mongoose');

const PRIMARY_ATLAS_URI =
  'mongodb+srv://nakkakavya801_db_user:H5UaH0Ar2zuBfFbl@cluster0.2mu6lzn.mongodb.net/library_management_system?retryWrites=true&w=majority';

let lastDbError = null;
let isConnecting = false;

// Connect to MongoDB with auto-failover and auto-retry
const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  let uri = process.env.MONGO_URI;

  if (!uri) {
    uri = process.env.NODE_ENV === 'production'
      ? PRIMARY_ATLAS_URI
      : 'mongodb://localhost:27017/library_management_system';
  } else if (uri.includes('V7vrAjSpC8bRdPnH')) {
    // Auto-heal old expired password if still configured in host environment
    console.log('[MongoDB] Auto-correcting expired database password in connection string...');
    uri = uri.replace('V7vrAjSpC8bRdPnH', 'H5UaH0Ar2zuBfFbl');
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
    console.error(`MongoDB Connection Error on primary attempt: ${error.message}`);

    // If host environment URI failed, attempt direct fallback to PRIMARY_ATLAS_URI
    if (uri !== PRIMARY_ATLAS_URI) {
      try {
        console.log('[MongoDB] Retrying connection using PRIMARY_ATLAS_URI fallback...');
        const fallbackConn = await mongoose.connect(PRIMARY_ATLAS_URI, {
          serverSelectionTimeoutMS: 5000
        });
        lastDbError = null;
        isConnecting = false;
        console.log(`MongoDB Connected via fallback: ${fallbackConn.connection.host}`);
        return;
      } catch (fallbackErr) {
        lastDbError = fallbackErr.message;
        console.error(`MongoDB Fallback Connection Error: ${fallbackErr.message}`);
      }
    } else {
      lastDbError = error.message;
    }

    isConnecting = false;
    console.log('[MongoDB] Scheduling connection retry in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

const getLastDbError = () => lastDbError;

module.exports = { connectDB, getLastDbError };

