// const mongoose = require('mongoose');

// // Connect to db
// const dbConnection = () => {
//   mongoose
//     .connect(process.env.DB_URI)
//     .then((conn) => {
//       console.log(
//         `Database Connected : ${conn.connection.host}`.cyan.underline
//       );
//     })
//     .catch((err) => {
//       console.error(`Database Error: ${err}`.red);
//       process.exit(1);
//     });
// };

// module.exports = dbConnection;

const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds بدل 5 ثواني الافتراضي
      socketTimeoutMS: 45000, // 45 ثانية لتفادي وقف الاتصال
      maxPoolSize: 10, // تثبيت عدد الاتصالات
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
