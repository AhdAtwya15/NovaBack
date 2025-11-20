// const path = require('path');
// const express = require('express');
// const dotenv = require('dotenv');

// dotenv.config({ path: 'config.env' });
// console.log('📦 Connecting to MongoDB:', process.env.DB_URI);


// // للتأكد من الـ credentials (اختياري - ممكن تشيله بعد ما تتأكد إن كل حاجة شغالة)
// console.log('📧 EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
// console.log('🔑 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Found' : '❌ Missing');

// const morgan = require('morgan');
// require('colors');
// const compression = require('compression');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// const ApiError = require('./utils/apiError');
// const globalError = require('./middlewares/errorMiddleware');
// const mountRoutes = require('./routes');
// const { webhookCheckout } = require('./controllers/orderService');

// const dbConnection = require('./config/database');

// // DB Connection
// dbConnection();

// // Builtin Middleware
// const app = express();

// app.use(cors());
// app.options('*', cors());
// app.enable('trust proxy');

// // Add hook here before we call body parser, because stripe will send data in the body in form raw
// app.post(
//   '/webhook-checkout',
//   bodyParser.raw({ type: 'application/json' }),
//   webhookCheckout
// );

// // Used to parse JSON bodies
// app.use(express.json());

// // Parse URL-encoded bodies
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// app.use(express.static(path.join(__dirname, 'uploads')));

// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
//   console.log(`Mode : ${process.env.NODE_ENV}`.yellow);
// }

// app.use(compression());

// // Mount routers
// mountRoutes(app);

// app.all('*', (req, res, next) => {
//   next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
// });

// // Global error handler to catch error from express error
// app.use(globalError);

// const PORT = process.env.PORT || 8000;
// const server = app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`.green);
// });

// // we are listening to this unhandled rejection event, which then allow us to handle all
// // errors that occur in asynchronous code which were not previously handled
// process.on('unhandledRejection', (err) => {
//   console.log(err.name, err.message);
//   server.close(() => {
//     console.log('unhandledRejection!! shutting down...');
//     process.exit(1);
//   });
// });

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config({ path: 'config.env' });

// لضمان BASE_URL على Vercel (اختياري دلوقتي لكن مفيد)
process.env.BASE_URL = process.env.BASE_URL || 'https://novaback.vercel.app';

console.log('Connecting to MongoDB:', process.env.DB_URI);
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Found' : 'Missing');

const morgan = require('morgan');
require('colors');
const compression = require('compression');
const cors = require('cors');

const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const mountRoutes = require('./routes');
const { webhookCheckout } = require('./controllers/orderService');
const dbConnection = require('./config/database');

// DB Connection
dbConnection();

// Express App
const app = express();

// ==== CORS + حل مشكلة الـ double slash نهائيًا على Vercel ====
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://novaback.vercel.app',
      "https://nova-tau-one.vercel.app"
      // أضيفي أي domain تاني هنا بعدين
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  })
);

app.options('*', cors()); // للـ preflight requests

// حل الـ double slash اللي بيسبب CORS redirect error على Vercel
app.use((req, res, next) => {
  if (req.path.includes('//')) {
    const cleanPath = req.path.replace(/\/+/g, '/');
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, cleanPath + query);
  }
  next();
});

app.enable('trust proxy');

// Stripe Webhook (قبل أي body parser)
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// حذفنا السطر ده نهائيًا لأننا بنستخدم Cloudinary
// app.use(express.static(path.join(__dirname, 'uploads')));

// Logging في الـ development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`Mode : ${process.env.NODE_ENV}`.yellow);
}

app.use(compression());

// Mount all routes
mountRoutes(app);

// Catch undefined routes
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handler
app.use(globalError);

// Start server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.green);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...'.red);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app; // اختياري لو بتستخدمي tests