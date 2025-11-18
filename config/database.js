const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds instead of default 5 seconds
      socketTimeoutMS: 45000, // 45 seconds to avoid connection drops
      maxPoolSize: 5, // Reduced pool size for free tier
      minPoolSize: 1, // Minimum connections to keep open
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      waitQueueTimeoutMS: 10000, // 10 seconds queue timeout
    })
    .then((conn) => {
      console.log(
        `Database Connected : ${conn.connection.host}`.cyan.underline
      );
    })
    .catch((err) => {
      console.error(`Database Error: ${err}`.red);
      process.exit(1);
    });
};

module.exports = dbConnection;